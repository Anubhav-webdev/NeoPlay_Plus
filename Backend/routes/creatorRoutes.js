import { Router } from "express";
import {
  applyAsCreator,
  getCreator,
  getMyCreatorProfile,
  listCreators,
  updateMyCreatorProfile,
  uploadCreatorProfileImage,
} from "../controllers/creatorController.js";
import { getCreatorAnalytics } from "../controllers/creatorAnalyticsController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requireApprovedCreator } from "../middlewares/roleMiddleware.js";
import {
  receiveProfileImageFile,
  requireReceivedMedia,
} from "../middlewares/uploadMiddleware.js";

const router = Router();

// Public discovery endpoints precede the signed-in creator dashboard endpoints.
router.get("/", listCreators);
router.post("/apply", authenticate, applyAsCreator);
router.get("/me", authenticate, getMyCreatorProfile);
router.patch("/me", authenticate, updateMyCreatorProfile);
router.post(
  "/me/images/:imageType",
  authenticate,
  requireApprovedCreator,
  receiveProfileImageFile,
  requireReceivedMedia,
  uploadCreatorProfileImage,
);
router.get(
  "/me/analytics",
  authenticate,
  requireApprovedCreator,
  getCreatorAnalytics
);
router.get("/:creatorId", getCreator);

export default router;
