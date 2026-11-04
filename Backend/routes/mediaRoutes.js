import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  createMediaUpload,
  cancelMediaUpload,
  finalizeMediaUpload,
  getMediaUploadLimits,
  getMediaUploadStatus,
  initiateMediaUpload,
  listDuplicateReviews,
  listMyMediaUploads,
  receiveMediaUploadChunk,
  reviewDuplicate,
} from "../controllers/mediaController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles, requireApprovedCreator } from "../middlewares/roleMiddleware.js";
import {
  receiveMediaFile,
  receiveMediaChunk,
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
router.get("/limits", authenticate, getMediaUploadLimits);
const initiateUploadHandlers = [
  authenticate,
  requireApprovedCreator,
  uploadLimiter,
  initiateMediaUpload,
];
router.post("/uploads/initiate", ...initiateUploadHandlers);
router.post("/uploads/initiatiate", ...initiateUploadHandlers);
router.put(
  "/uploads/:uploadId/chunks/:chunkIndex",
  authenticate,
  requireApprovedCreator,
  receiveMediaChunk,
  receiveMediaUploadChunk,
);
router.post(
  "/uploads/:uploadId/finalize",
  authenticate,
  requireApprovedCreator,
  finalizeMediaUpload,
);
router.delete("/uploads/:uploadId", authenticate, cancelMediaUpload);
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
