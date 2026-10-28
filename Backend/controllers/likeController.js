import Like from "../models/Like.js";
import Content from "../models/Content.js";
import Creator from "../models/Creator.js";
import Notification from "../models/Notification.js";
import ApiError from "../scripts/utils/ApiError.js";
import asyncHandler from "../scripts/utils/asyncHandler.js";
import sendResponse from "../scripts/utils/sendResponse.js";
import validateObjectId from "../scripts/utils/validateObjectId.js";

// Like creation is idempotent, enforced both here and by the compound index.
export const likeContent = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const content = await Content.findOne({
    _id: req.params.contentId,
    status: "published",
  });
  if (!content) throw new ApiError(404, "Content not found");
  const update = await Like.updateOne(
    { userId: req.user._id, contentId: content._id },
    { $setOnInsert: { userId: req.user._id, contentId: content._id } },
    { upsert: true }
  );
  const creator = await Creator.findById(content.creatorId);
  if (
    update.upsertedCount &&
    creator &&
    String(creator.userId) !== String(req.user._id)
  ) {
    await Notification.create({
      userId: creator.userId,
      type: "like",
      message: "Someone liked your content",
    });
  }
  const likes = await Like.countDocuments({ contentId: content._id });
  return sendResponse(res, 200, "Content liked", { liked: true, likes });
});

export const unlikeContent = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  await Like.deleteOne({
    userId: req.user._id,
    contentId: req.params.contentId,
  });
  const likes = await Like.countDocuments({ contentId: req.params.contentId });
  return sendResponse(res, 200, "Content unliked", { liked: false, likes });
});

export const getLikeStatus = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const [liked, likes] = await Promise.all([
    req.user
      ? Like.exists({ userId: req.user._id, contentId: req.params.contentId })
      : Promise.resolve(null),
    Like.countDocuments({ contentId: req.params.contentId }),
  ]);
  return sendResponse(res, 200, "Like status retrieved", {
    liked: Boolean(liked),
    likes,
  });
});
