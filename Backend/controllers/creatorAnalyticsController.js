import Content from "../models/Content.js";
import Creator from "../models/Creator.js";
import Subscription from "../models/Subscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";

// Return totals owned by the signed-in creator without exposing other creators' data.
export const getCreatorAnalytics = asyncHandler(async (req, res) => {
  const creator = await Creator.findOne({ userId: req.user._id });
  if (!creator)
    return sendResponse(res, 200, "Creator analytics", {
      contentCount: 0,
      publishedCount: 0,
      totalViews: 0,
      subscriberCount: 0,
    });
  const [counts, subscriberCount] = await Promise.all([
    Content.aggregate([
      { $match: { creatorId: creator._id, status: { $ne: "archived" } } },
      {
        $group: {
          _id: null,
          contentCount: { $sum: 1 },
          publishedCount: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          totalViews: { $sum: "$viewCount" },
        },
      },
    ]),
    Subscription.countDocuments({ creatorId: creator._id }),
  ]);
  const totals = counts[0] || {
    contentCount: 0,
    publishedCount: 0,
    totalViews: 0,
  };
  return sendResponse(res, 200, "Creator analytics", {
    ...totals,
    subscriberCount,
  });
});
