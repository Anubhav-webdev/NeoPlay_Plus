import Content from "../models/Content.js";
import Creator from "../models/Creator.js";
import Category from "../models/Category.js";
import MediaAsset from "../models/MediaAsset.js";
import Comment from "../models/Comment.js";
import ApiError from "../scripts/utils/ApiError.js";
import asyncHandler from "../scripts/utils/asyncHandler.js";
import sendResponse from "../scripts/utils/sendResponse.js";
import validateObjectId from "../scripts/utils/validateObjectId.js";

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(query.limit, 10) || 20)
  );
  return { page, limit, skip: (page - 1) * limit };
}

// List published media with bounded pagination and optional filters.
export const listContent = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = { status: "published" };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.creatorId) {
    validateObjectId(req.query.creatorId, "creatorId");
    filter.creatorId = req.query.creatorId;
  }
  if (req.query.categoryId) {
    validateObjectId(req.query.categoryId, "categoryId");
    filter.categoryIds = req.query.categoryId;
  }
  if (req.query.search) {
    const search = String(req.query.search).trim().slice(0, 100);
    filter.$or = [
      {
        title: {
          $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      },
      {
        description: {
          $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      },
    ];
  }
  const [items, total] = await Promise.all([
    Content.find(filter)
      .sort({ publishedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("creatorId", "displayName avatar")
      .populate("categoryIds", "name slug")
      .populate("mediaAssetId", "mediaType metadata"),
    Content.countDocuments(filter),
  ]);
  const commentCounts = await Comment.aggregate([
    { $match: { contentId: { $in: items.map((item) => item._id) } } },
    { $group: { _id: "$contentId", count: { $sum: 1 } } },
  ]);
  const countsByContentId = new Map(
    commentCounts.map(({ _id, count }) => [String(_id), count])
  );
  return sendResponse(res, 200, "Content retrieved", {
    items: items.map((item) => ({
      ...item.toObject(),
      commentCount: countsByContentId.get(String(item._id)) || 0,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getContent = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const content = await Content.findById(req.params.contentId)
    .populate("creatorId", "displayName avatar")
    .populate("categoryIds", "name slug");
  if (!content) throw new ApiError(404, "Content not found");

  if (content.status !== "published" && req.user?.role !== "admin") {
    const ownedCreator =
      req.user?._id &&
      content.creatorId?._id &&
      (await Creator.exists({
        _id: content.creatorId?._id,
        userId: req.user._id,
      }));
    if (!ownedCreator) throw new ApiError(404, "Content not found");
  }
  return sendResponse(res, 200, "Content retrieved", { content });
});

export const listMyContent = asyncHandler(async (req, res) => {
  const creator = await Creator.findOne({ userId: req.user._id });
  if (!creator)
    return sendResponse(res, 200, "Creator content retrieved", { items: [] });
  const { page, limit, skip } = pagination(req.query);
  const [items, total] = await Promise.all([
    Content.find({ creatorId: creator._id, status: { $ne: "archived" } })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("categoryIds", "name slug"),
    Content.countDocuments({ creatorId: creator._id, status: { $ne: "archived" } }),
  ]);
  return sendResponse(res, 200, "Creator content retrieved", {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const createContent = asyncHandler(async (req, res) => {
  const creator = await Creator.findOne({ userId: req.user._id });
  if (!creator || creator.applicationStatus !== "approved") {
    throw new ApiError(403, "An approved creator account is required");
  }
  const {
    type,
    description,
    thumbnailUrl,
    mediaAssetId,
    categoryIds = [],
  } = req.body;
  const title = req.body.title || (type === "Tweet" ? description : undefined);
  if (!["Tweet", "Video", "Image"].includes(type)) {
    throw new ApiError(400, "type must be Tweet, Video, or Image");
  }
  if (!Array.isArray(categoryIds) || categoryIds.length > 20) {
    throw new ApiError(400, "categoryIds must be an array of at most 20 IDs");
  }
  categoryIds.forEach((id) => validateObjectId(id, "categoryId"));
  const categoryCount = await Category.countDocuments({
    _id: { $in: categoryIds },
  });
  if (categoryCount !== new Set(categoryIds.map(String)).size) {
    throw new ApiError(400, "One or more categories do not exist");
  }
  let media = null;
  if (mediaAssetId) {
    validateObjectId(mediaAssetId, "mediaAssetId");
    media = await MediaAsset.findOne({
      _id: mediaAssetId,
      ownerId: req.user._id,
      creatorId: creator._id,
      status: "ready",
    });
    if (!media) {
      throw new ApiError(400, "Use a completed, verified media upload you own");
    }
    if (
      (type === "Video" && media.mediaType !== "video") ||
      (type === "Image" && media.mediaType !== "image")
    ) {
      throw new ApiError(400, "The uploaded media type does not match the post type");
    }
  } else if (type !== "Tweet") {
    throw new ApiError(400, "Video and image posts require a verified mediaAssetId");
  }

  const content = await Content.create({
    creatorId: creator._id,
    type,
    title,
    description,
    thumbnailUrl,
    mediaUrl: media?.secureUrl || null,
    mediaPublicId: media?.publicId || null,
    mediaAssetId: media?._id || null,
    categoryIds,
    status: req.body.publish === true ? "published" : "draft",
    publishedAt: req.body.publish === true ? new Date() : null,
  });
  return sendResponse(res, 201, "Content created", { content });
});

export const updateContent = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const content = await Content.findById(req.params.contentId);
  if (!content) throw new ApiError(404, "Content not found");
  const creator = await Creator.findOne({ userId: req.user._id });
  if (
    req.user.role !== "admin" &&
    String(content.creatorId) !== String(creator?._id)
  ) {
    throw new ApiError(403, "You cannot edit this content");
  }

  const allowed = [
    "type",
    "title",
    "description",
    "thumbnailUrl",
    "mediaAssetId",
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) content[key] = req.body[key];
  }
  if (req.body.mediaAssetId !== undefined) {
    validateObjectId(req.body.mediaAssetId, "mediaAssetId");
    const media = await MediaAsset.findOne({
      _id: req.body.mediaAssetId,
      ownerId: req.user._id,
      creatorId: content.creatorId,
      status: "ready",
    });
    if (!media) {
      throw new ApiError(400, "Use a completed, verified media upload you own");
    }
    if (
      (content.type === "Video" && media.mediaType !== "video") ||
      (content.type === "Image" && media.mediaType !== "image")
    ) {
      throw new ApiError(400, "The uploaded media type does not match the post type");
    }
    content.mediaUrl = media.secureUrl;
    content.mediaPublicId = media.publicId;
    content.mediaAssetId = media._id;
  }
  if (content.mediaAssetId) {
    const media = await MediaAsset.findOne({
      _id: content.mediaAssetId,
      ownerId: req.user._id,
      status: "ready",
    });
    if (
      !media ||
      (content.type === "Video" && media.mediaType !== "video") ||
      (content.type === "Image" && media.mediaType !== "image")
    ) {
      throw new ApiError(400, "The content type requires a matching verified media asset");
    }
    content.mediaUrl = media.secureUrl;
    content.mediaPublicId = media.publicId;
  }
  if (req.body.categoryIds !== undefined) {
    if (
      !Array.isArray(req.body.categoryIds) ||
      req.body.categoryIds.length > 20
    ) {
      throw new ApiError(400, "categoryIds must be an array of at most 20 IDs");
    }
    req.body.categoryIds.forEach((id) => validateObjectId(id, "categoryId"));
    const count = await Category.countDocuments({
      _id: { $in: req.body.categoryIds },
    });
    if (count !== new Set(req.body.categoryIds.map(String)).size) {
      throw new ApiError(400, "One or more categories do not exist");
    }
    content.categoryIds = req.body.categoryIds;
  }
  await content.save();
  return sendResponse(res, 200, "Content updated", { content });
});

export const publishContent = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const content = await Content.findById(req.params.contentId);
  if (!content) throw new ApiError(404, "Content not found");
  const creator = await Creator.findOne({ userId: req.user._id });
  if (
    req.user.role !== "admin" &&
    String(content.creatorId) !== String(creator?._id)
  ) {
    throw new ApiError(403, "You cannot publish this content");
  }
  if (content.type !== "Tweet" && !content.mediaUrl) {
    throw new ApiError(
      400,
      "Video and image posts require media before publishing"
    );
  }
  content.status = "published";
  content.publishedAt = content.publishedAt || new Date();
  await content.save();
  return sendResponse(res, 200, "Content published", { content });
});

// Archive instead of hard-deleting so comments and history keep valid references.
export const archiveContent = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const content = await Content.findById(req.params.contentId);
  if (!content) throw new ApiError(404, "Content not found");
  const creator = await Creator.findOne({ userId: req.user._id });
  if (
    req.user.role !== "admin" &&
    String(content.creatorId) !== String(creator?._id)
  ) {
    throw new ApiError(403, "You cannot archive this content");
  }
  content.status = "archived";
  await content.save();
  return sendResponse(res, 200, "Content archived", { content });
});

export const incrementView = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const content = await Content.findOneAndUpdate(
    { _id: req.params.contentId, status: "published" },
    { $inc: { viewCount: 1 } },
    { new: true, projection: { viewCount: 1 } }
  );
  if (!content) throw new ApiError(404, "Content not found");
  return sendResponse(res, 200, "View recorded", {
    viewCount: content.viewCount,
  });
});
