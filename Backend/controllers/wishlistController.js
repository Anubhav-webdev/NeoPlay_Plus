import Wishlist from "../models/Wishlist.js";
import Content from "../models/Content.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import validateObjectId from "../utils/validateObjectId.js";

export const listWishlist = asyncHandler(async (req, res) => {
  const savedItems = await Wishlist.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: "contentId",
      match: { status: "published" },
      select: "title type thumbnailUrl mediaUrl publishedAt",
    });
  return sendResponse(res, 200, "Wishlist retrieved", {
    items: savedItems.filter((item) => item.contentId),
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
