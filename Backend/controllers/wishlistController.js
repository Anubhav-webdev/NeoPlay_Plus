import Wishlist from "../models/Wishlist.js";
import Content from "../models/Content.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import validateObjectId from "../utils/validateObjectId.js";
import cloudinary from "../config/cloudinary.js";

function serializeWishlistItem(item) {
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

export const listWishlist = asyncHandler(async (req, res) => {
  const savedItems = await Wishlist.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: "contentId",
      match: { status: "published" },
      select: "title type thumbnailUrl thumbnailAssetId mediaUrl mediaPublicId publishedAt description creatorId categoryIds mediaAssetId",
      populate: [
        { path: "thumbnailAssetId", select: "secureUrl" },
        { path: "creatorId", select: "displayName avatar" },
        { path: "categoryIds", select: "name slug" },
        { path: "mediaAssetId", select: "mediaType metadata" },
      ],
    });
  return sendResponse(res, 200, "Wishlist retrieved", {
    items: savedItems.filter((item) => item.contentId).map(serializeWishlistItem),
  });
});

export const addWishlistItem = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const content = await Content.findOne({
    _id: req.params.contentId,
    status: "published",
  });
  if (!content) throw new ApiError(404, "Published content not found");
  await Wishlist.updateOne(
    { userId: req.user._id, contentId: content._id },
    { $setOnInsert: { userId: req.user._id, contentId: content._id } },
    { upsert: true }
  );
  return sendResponse(res, 200, "Content saved to wishlist", { saved: true });
});

export const removeWishlistItem = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const result = await Wishlist.deleteOne({
    userId: req.user._id,
    contentId: req.params.contentId,
  });
  if (!result.deletedCount) throw new ApiError(404, "Wishlist item not found");
  return sendResponse(res, 200, "Content removed from wishlist", {
    saved: false,
  });
});
