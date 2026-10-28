import { Router } from "express";
import {
  applyAsCreator,
  getCreator,
  getMyCreatorProfile,
  listCreators,
  updateMyCreatorProfile,
} from "../controllers/creatorController.js";
import { getCreatorAnalytics } from "../controllers/creatorAnalyticsController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requireApprovedCreator } from "../middlewares/roleMiddleware.js";

const router = Router();

// Public discovery endpoints precede the signed-in creator dashboard endpoints.
router.get("/", listCreators);
router.post("/apply", authenticate, applyAsCreator);
router.get("/me", authenticate, getMyCreatorProfile);
router.patch("/me", authenticate, updateMyCreatorProfile);
router.get(
  "/me/analytics",
  authenticate,
  requireApprovedCreator,
  getCreatorAnalytics
);
router.get("/:creatorId", getCreator);

export default router;
