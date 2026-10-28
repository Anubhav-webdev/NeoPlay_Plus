import { Router } from "express";
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// Notifications are always read or modified within the current user's scope.
router.use(authenticate);
router.get("/", listNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:notificationId/read", markNotificationRead);
router.delete("/:notificationId", deleteNotification);

export default router;
