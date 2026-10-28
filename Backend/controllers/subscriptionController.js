import Subscription from "../models/Subscription.js";
import Creator from "../models/Creator.js";
import Notification from "../models/Notification.js";
import ApiError from "../scripts/utils/ApiError.js";
import asyncHandler from "../scripts/utils/asyncHandler.js";
import sendResponse from "../scripts/utils/sendResponse.js";
import validateObjectId from "../scripts/utils/validateObjectId.js";

export const listSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ subscriberId: req.user._id })
    .sort({ createdAt: -1 })
    .populate("creatorId", "displayName avatar applicationStatus");
  return sendResponse(res, 200, "Subscriptions retrieved", {
    subscriptions: subscriptions.filter(
      (subscription) => subscription.creatorId?.applicationStatus === "approved"
    ),
  });
});

export const subscribe = asyncHandler(async (req, res) => {
  validateObjectId(req.params.creatorId, "creatorId");
  const creator = await Creator.findOne({
    _id: req.params.creatorId,
    applicationStatus: "approved",
  });
  if (!creator) throw new ApiError(404, "Creator not found");
  if (String(creator.userId) === String(req.user._id)) {
    throw new ApiError(400, "Creators cannot subscribe to themselves");
  }
  const update = await Subscription.updateOne(
    { subscriberId: req.user._id, creatorId: creator._id },
    { $setOnInsert: { subscriberId: req.user._id, creatorId: creator._id } },
    { upsert: true }
  );
  if (update.upsertedCount) {
    await Notification.create({
      userId: creator.userId,
      type: "subscription",
      message: "Someone subscribed to your creator profile",
    });
  }
  const subscriberCount = await Subscription.countDocuments({
    creatorId: creator._id,
  });
  return sendResponse(res, 200, "Subscribed to creator", {
    subscribed: true,
    subscriberCount,
  });
});

export const unsubscribe = asyncHandler(async (req, res) => {
  validateObjectId(req.params.creatorId, "creatorId");
  await Subscription.deleteOne({
    subscriberId: req.user._id,
    creatorId: req.params.creatorId,
  });
  const subscriberCount = await Subscription.countDocuments({
    creatorId: req.params.creatorId,
  });
  return sendResponse(res, 200, "Unsubscribed from creator", {
    subscribed: false,
    subscriberCount,
  });
});

export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  validateObjectId(req.params.creatorId, "creatorId");
  const [subscription, subscriberCount] = await Promise.all([
    Subscription.exists({
      subscriberId: req.user._id,
      creatorId: req.params.creatorId,
    }),
    Subscription.countDocuments({ creatorId: req.params.creatorId }),
  ]);
  return sendResponse(res, 200, "Subscription status retrieved", {
    subscribed: Boolean(subscription),
    subscriberCount,
  });
});
