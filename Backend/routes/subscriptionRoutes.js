import { Router } from "express";
import {
  getSubscriptionStatus,
  listSubscriptions,
  subscribe,
  unsubscribe,
} from "../controllers/subscriptionController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// Subscription management is account-specific and requires authentication.
router.use(authenticate);
router.get("/", listSubscriptions);
router.get("/:creatorId/status", getSubscriptionStatus);
router.post("/:creatorId", subscribe);
router.delete("/:creatorId", unsubscribe);

export default router;
