import { Router } from "express";
import mongoose from "mongoose";
import adminRoutes from "./adminRoutes.js";
import authRoutes from "./authRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import commentRoutes from "./commentRoutes.js";
import contentRoutes from "./contentRoutes.js";
import creatorRoutes from "./creatorRoutes.js";
import likeRoutes from "./likeRoutes.js";
import mediaRoutes from "./mediaRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import playlistRoutes from "./playlistRoutes.js";
import reportRoutes from "./reportRoutes.js";
import subscriptionRoutes from "./subscriptionRoutes.js";
import userRoutes from "./userRoutes.js";
import watchHistoryRoutes from "./watchHistoryRoutes.js";
import wishlistRoutes from "./wishlistRoutes.js";

const router = Router();

// Keep every feature's endpoints under one stable API namespace.
router.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  return res.status(connected ? 200 : 503).json({
    success: connected,
    database: connected ? "connected" : "disconnected",
  });
});
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/content", contentRoutes);
router.use("/categories", categoryRoutes);
router.use("/creators", creatorRoutes);
router.use("/comments", commentRoutes);
router.use("/likes", likeRoutes);
router.use("/media", mediaRoutes);
router.use("/watch-history", watchHistoryRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/playlists", playlistRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/reports", reportRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

export default router;
