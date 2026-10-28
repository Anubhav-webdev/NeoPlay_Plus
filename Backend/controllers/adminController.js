import User from "../models/users.js";
import Creator from "../models/Creator.js";
import Content from "../models/Content.js";
import Report from "../models/Report.js";
import { setCreatorDecision } from "./creatorController.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import validateObjectId from "../utils/validateObjectId.js";

// Dashboard totals support the admin overview page.
export const getOverview = asyncHandler(async (req, res) => {
  const [users, creatorsPending, content, publishedContent, reportsPending] =
    await Promise.all([
      User.countDocuments(),
      Creator.countDocuments({ applicationStatus: "pending" }),
      Content.countDocuments(),
      Content.countDocuments({ status: "published" }),
      Report.countDocuments({ status: { $in: ["pending", "reviewing"] } }),
    ]);
  return sendResponse(res, 200, "Admin overview", {
    users,
    creatorsPending,
    content,
    publishedContent,
    reportsPending,
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 30)
  );
  const filter = {};
  if (["user", "creator", "admin"].includes(req.query.role))
    filter.role = req.query.role;
  if (req.query.search) {
    const escaped = String(req.query.search)
      .trim()
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { username: { $regex: escaped, $options: "i" } },
    ];
  }
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("_id name username email phoneNumber role isVerified createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);
  return sendResponse(res, 200, "Users retrieved", {
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Admins can demote accounts, but creator privileges only come from approval.
export const updateUserRole = asyncHandler(async (req, res) => {
  validateObjectId(req.params.userId, "userId");
  if (!["user", "admin"].includes(req.body.role)) {
    throw new ApiError(400, "role must be user or admin");
  }
  if (
    String(req.params.userId) === String(req.user._id) &&
    req.body.role !== "admin"
  ) {
    throw new ApiError(400, "You cannot remove your own admin role");
  }
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { role: req.body.role },
    {
      new: true,
      runValidators: true,
      select: "_id name username email role createdAt",
    }
  );
  if (!user) throw new ApiError(404, "User not found");
  return sendResponse(res, 200, "User role updated", { user });
});

export const listCreatorApplications = asyncHandler(async (req, res) => {
  const status = req.query.status || "pending";
  if (!["pending", "approved", "rejected", "suspended"].includes(status)) {
    throw new ApiError(400, "Invalid creator application status");
  }
  const creators = await Creator.find({ applicationStatus: status })
    .populate("userId", "name username email")
    .sort({ createdAt: 1 });
  return sendResponse(res, 200, "Creator applications retrieved", { creators });
});

export const decideCreatorApplication = asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!["approved", "rejected", "suspended"].includes(status)) {
    throw new ApiError(400, "status must be approved, rejected, or suspended");
  }
  const creator = await setCreatorDecision(req.params.creatorId, status);
  return sendResponse(res, 200, "Creator application updated", { creator });
});

export const listContent = asyncHandler(async (req, res) => {
  const filter = {};
  if (
    req.query.status &&
    ["draft", "published", "archived"].includes(req.query.status)
  ) {
    filter.status = req.query.status;
  }
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 30)
  );
  const [items, total] = await Promise.all([
    Content.find(filter)
      .populate("creatorId", "displayName userId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Content.countDocuments(filter),
  ]);
  return sendResponse(res, 200, "Content retrieved", {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const moderateContent = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  if (!["published", "archived"].includes(req.body.status)) {
    throw new ApiError(400, "status must be published or archived");
  }
  const content = await Content.findById(req.params.contentId);
  if (!content) throw new ApiError(404, "Content not found");
  if (
    req.body.status === "published" &&
    content.type !== "Tweet" &&
    !content.mediaUrl
  ) {
    throw new ApiError(
      400,
      "Video and image posts require media before publishing"
    );
  }
  content.status = req.body.status;
  content.publishedAt =
    req.body.status === "published"
      ? content.publishedAt || new Date()
      : content.publishedAt;
  await content.save();
  return sendResponse(res, 200, "Content moderated", { content });
});
