import Creator from "../models/Creator.js";
import User from "../models/users.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import validateObjectId from "../utils/validateObjectId.js";

// Creator directory contains approved profiles only.
export const listCreators = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
  );
  const filter = { applicationStatus: "approved" };
  const [creators, total] = await Promise.all([
    Creator.find(filter)
      .select("displayName avatar userId createdAt")
      .populate("userId", "username name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Creator.countDocuments(filter),
  ]);
  return sendResponse(res, 200, "Creators retrieved", {
    creators,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const applyAsCreator = asyncHandler(async (req, res) => {
  const displayName = String(req.body.displayName || "").trim();
  if (displayName.length < 2 || displayName.length > 100) {
    throw new ApiError(
      400,
      "Display name must be between 2 and 100 characters"
    );
  }
  const existing = await Creator.findOne({ userId: req.user._id });
  if (existing) {
    if (existing.applicationStatus !== "rejected") {
      throw new ApiError(409, "A creator application already exists");
    }
    existing.displayName = displayName;
    existing.applicationStatus = "pending";
    existing.approvedAt = null;
    await existing.save();
    return sendResponse(res, 200, "Creator application resubmitted", {
      creator: existing,
    });
  }
  const creator = await Creator.create({ userId: req.user._id, displayName });
  return sendResponse(res, 201, "Creator application submitted", { creator });
});

export const getMyCreatorProfile = asyncHandler(async (req, res) => {
  const creator = await Creator.findOne({ userId: req.user._id });
  return sendResponse(res, 200, "Creator application retrieved", { creator });
});

export const updateMyCreatorProfile = asyncHandler(async (req, res) => {
  const creator = await Creator.findOne({ userId: req.user._id });
  if (!creator) throw new ApiError(404, "Creator profile not found");
  if (req.body.displayName !== undefined) {
    const displayName = String(req.body.displayName).trim();
    if (displayName.length < 2 || displayName.length > 100) {
      throw new ApiError(
        400,
        "Display name must be between 2 and 100 characters"
      );
    }
    creator.displayName = displayName;
  }
  if (req.body.avatar !== undefined) creator.avatar = req.body.avatar;
  await creator.save();
  return sendResponse(res, 200, "Creator profile updated", { creator });
});

export const getCreator = asyncHandler(async (req, res) => {
  validateObjectId(req.params.creatorId, "creatorId");
  const creator = await Creator.findOne({
    _id: req.params.creatorId,
    applicationStatus: "approved",
  }).select("displayName avatar createdAt");
  if (!creator) throw new ApiError(404, "Creator not found");
  return sendResponse(res, 200, "Creator retrieved", { creator });
});

export const setCreatorDecision = async (creatorId, status) => {
  validateObjectId(creatorId, "creatorId");
  const creator = await Creator.findById(creatorId);
  if (!creator) throw new ApiError(404, "Creator application not found");
  creator.applicationStatus = status;
  creator.approvedAt = status === "approved" ? new Date() : null;
  await creator.save();
  await User.findByIdAndUpdate(creator.userId, {
    role: status === "approved" ? "creator" : "user",
  });
  return creator;
};
