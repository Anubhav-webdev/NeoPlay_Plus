import Notification from "../models/Notification.js";
import ApiError from "../scripts/utils/ApiError.js";
import asyncHandler from "../scripts/utils/asyncHandler.js";
import sendResponse from "../scripts/utils/sendResponse.js";
import validateObjectId from "../scripts/utils/validateObjectId.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 30)
  );
  const filter = { userId: req.user._id };
  if (req.query.unread === "true") filter.isRead = false;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);
  return sendResponse(res, 200, "Notifications retrieved", {
    notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  validateObjectId(req.params.notificationId, "notificationId");
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, userId: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, "Notification not found");
  return sendResponse(res, 200, "Notification marked as read", {
    notification,
  });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  );
  return sendResponse(res, 200, "Notifications marked as read", {
    modifiedCount: result.modifiedCount,
  });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  validateObjectId(req.params.notificationId, "notificationId");
  const result = await Notification.deleteOne({
    _id: req.params.notificationId,
    userId: req.user._id,
  });
  if (!result.deletedCount) throw new ApiError(404, "Notification not found");
  return sendResponse(res, 200, "Notification deleted");
});
