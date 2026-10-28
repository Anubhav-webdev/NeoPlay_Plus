import Comment from "../models/Comment.js";
import Content from "../models/Content.js";
import Creator from "../models/Creator.js";
import Notification from "../models/Notification.js";
import ReplyComment from "../models/ReplyComment.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import validateObjectId from "../utils/validateObjectId.js";

export const listComments = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const content = await Content.findOne({
    _id: req.params.contentId,
    status: "published",
  });
  if (!content) throw new ApiError(404, "Content not found");
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 30)
  );
  const [comments, total] = await Promise.all([
    Comment.find({ contentId: content._id })
      .populate("userId", "name username avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Comment.countDocuments({ contentId: content._id }),
  ]);
  return sendResponse(res, 200, "Comments retrieved", {
    comments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const listMyCreatorComments = asyncHandler(async (req, res) => {
  const creator = await Creator.findOne({ userId: req.user._id });
  if (!creator) {
    return sendResponse(res, 200, "Creator comments retrieved", {
      comments: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
    });
  }
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
  const contentIds = await Content.find({
    creatorId: creator._id,
    status: "published",
  }).distinct("_id");
  const filter = { contentId: { $in: contentIds } };
  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .populate("userId", "name username avatar")
      .populate("contentId", "title type")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Comment.countDocuments(filter),
  ]);
  const replies = await ReplyComment.find({
    commentId: { $in: comments.map((comment) => comment._id) },
  })
    .populate("userId", "name username avatar")
    .sort({ createdAt: 1 });
  const repliesByComment = new Map();
  for (const reply of replies) {
    const key = String(reply.commentId);
    const existing = repliesByComment.get(key) || [];
    existing.push(reply);
    repliesByComment.set(key, existing);
  }
  return sendResponse(res, 200, "Creator comments retrieved", {
    comments: comments.map((comment) => ({
      ...comment.toObject(),
      replies: repliesByComment.get(String(comment._id)) || [],
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const createComment = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const content = await Content.findOne({
    _id: req.params.contentId,
    status: "published",
  });
  if (!content) throw new ApiError(404, "Content not found");
  const text = String(req.body.text || "").trim();
  if (!text || text.length > 2000)
    throw new ApiError(400, "Comment must be 1-2000 characters");
  const comment = await Comment.create({
    contentId: content._id,
    userId: req.user._id,
    text,
  });
  const creator = await Creator.findById(content.creatorId);
  if (creator && String(creator.userId) !== String(req.user._id)) {
    await Notification.create({
      userId: creator.userId,
      type: "comment",
      message: "Someone commented on your content",
    });
  }
  await comment.populate("userId", "name username avatar");
  return sendResponse(res, 201, "Comment created", { comment });
});

export const createReply = asyncHandler(async (req, res) => {
  validateObjectId(req.params.commentId, "commentId");
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw new ApiError(404, "Comment not found");
  const text = String(req.body.text || "").trim();
  if (!text || text.length > 2000)
    throw new ApiError(400, "Reply must be 1-2000 characters");
  const reply = await ReplyComment.create({
    commentId: comment._id,
    userId: req.user._id,
    text,
  });
  if (String(comment.userId) !== String(req.user._id)) {
    await Notification.create({
      userId: comment.userId,
      type: "reply",
      message: "Someone replied to your comment",
    });
  }
  await reply.populate("userId", "name username avatar");
  return sendResponse(res, 201, "Reply created", { reply });
});

export const listReplies = asyncHandler(async (req, res) => {
  validateObjectId(req.params.commentId, "commentId");
  const replies = await ReplyComment.find({ commentId: req.params.commentId })
    .populate("userId", "name username avatar")
    .sort({ createdAt: 1 });
  return sendResponse(res, 200, "Replies retrieved", { replies });
});

export const deleteComment = asyncHandler(async (req, res) => {
  validateObjectId(req.params.commentId, "commentId");
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (
    req.user.role !== "admin" &&
    String(comment.userId) !== String(req.user._id)
  ) {
    throw new ApiError(403, "You cannot delete this comment");
  }
  await Promise.all([
    ReplyComment.deleteMany({ commentId: comment._id }),
    comment.deleteOne(),
  ]);
  return sendResponse(res, 200, "Comment deleted");
});

export const deleteReply = asyncHandler(async (req, res) => {
  validateObjectId(req.params.replyId, "replyId");
  const reply = await ReplyComment.findById(req.params.replyId);
  if (!reply) throw new ApiError(404, "Reply not found");
  if (
    req.user.role !== "admin" &&
    String(reply.userId) !== String(req.user._id)
  ) {
    throw new ApiError(403, "You cannot delete this reply");
  }
  await reply.deleteOne();
  return sendResponse(res, 200, "Reply deleted");
});
