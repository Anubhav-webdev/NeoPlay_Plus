import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  createMediaUpload,
  getMediaUploadStatus,
  listDuplicateReviews,
  listMyMediaUploads,
  reviewDuplicate,
} from "../controllers/mediaController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles, requireApprovedCreator } from "../middlewares/roleMiddleware.js";
import {
  receiveMediaFile,
  requireReceivedMedia,
} from "../middlewares/uploadMiddleware.js";
import { mediaConfig } from "../config/media.js";

const router = Router();
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: mediaConfig.maxUploadAttemptsPerHour,
  keyGenerator: (req) => String(req.user._id),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Upload limit reached; try again later",
  },
});

// Auth and creator approval happen before multipart parsing writes the staged file.
router.post(
  "/uploads",
  authenticate,
  requireApprovedCreator,
  uploadLimiter,
  receiveMediaFile,
  requireReceivedMedia,
  createMediaUpload,
);
router.get("/uploads", authenticate, listMyMediaUploads);
router.get("/uploads/:uploadId", authenticate, getMediaUploadStatus);

// Only admins can compare possible matches and decide whether to process them.
router.get(
  "/duplicate-reviews",
  authenticate,
  allowRoles("admin"),
  listDuplicateReviews,
);
router.post(
  "/uploads/:uploadId/review",
  authenticate,
  allowRoles("admin"),
  reviewDuplicate,
);

export default router;
