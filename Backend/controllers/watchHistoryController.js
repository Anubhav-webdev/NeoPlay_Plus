import WatchHistory from "../models/WatchHistory.js";
import Content from "../models/Content.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import validateObjectId from "../utils/validateObjectId.js";
import cloudinary from "../config/cloudinary.js";

function serializeHistoryItem(item) {
  const content = item.contentId?.toObject ? item.contentId.toObject() : item.contentId;
  if (!content) return item;
  const thumbnailUrl = content.thumbnailUrl || content.thumbnailAssetId?.secureUrl ||
    (content.type === "Video" && content.mediaPublicId
      ? cloudinary.url(content.mediaPublicId, {
          resource_type: "video",
          format: "jpg",
          transformation: [{ start_offset: "0" }],
        })
      : null);
  return { ...item.toObject(), contentId: { ...content, thumbnailUrl } };
}

export const listWatchHistory = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 30)
  );
  const [items, total] = await Promise.all([
    WatchHistory.find({ userId: req.user._id })
      .sort({ watchedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "contentId",
        match: { status: "published" },
        select: "title type description thumbnailUrl thumbnailAssetId mediaUrl mediaPublicId publishedAt viewCount creatorId categoryIds mediaAssetId",
        populate: [
          { path: "creatorId", select: "displayName avatar" },
          { path: "categoryIds", select: "name slug" },
          { path: "thumbnailAssetId", select: "secureUrl" },
          { path: "mediaAssetId", select: "mediaType metadata" },
        ],
      }),
    WatchHistory.countDocuments({ userId: req.user._id }),
  ]);
  return sendResponse(res, 200, "Watch history retrieved", {
    items: items.filter((item) => item.contentId).map(serializeHistoryItem),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const upsertWatchHistory = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const content = await Content.findOne({
    _id: req.params.contentId,
    status: "published",
  });
  if (!content) throw new ApiError(404, "Content not found");
  const progress = Number(req.body.progress ?? 0);
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    throw new ApiError(400, "progress must be between 0 and 100");
  }
  const item = await WatchHistory.findOneAndUpdate(
    { userId: req.user._id, contentId: content._id },
    { $set: { progress, watchedAt: new Date() } },
    { new: true, upsert: true, runValidators: true }
  ).populate("contentId", "title type thumbnailUrl mediaUrl");
  return sendResponse(res, 200, "Watch history updated", { item });
});

export const clearWatchHistory = asyncHandler(async (req, res) => {
  const result = await WatchHistory.deleteMany({ userId: req.user._id });
  return sendResponse(res, 200, "Watch history cleared", {
    deletedCount: result.deletedCount,
  });
});

export const deleteWatchHistoryItem = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const result = await WatchHistory.deleteOne({
    userId: req.user._id,
    contentId: req.params.contentId,
  });
  if (!result.deletedCount)
    throw new ApiError(404, "Watch history item not found");
  return sendResponse(res, 200, "Watch history item deleted");
});
