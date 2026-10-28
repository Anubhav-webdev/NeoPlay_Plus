import { Router } from "express";
import {
  getLikeStatus,
  likeContent,
  unlikeContent,
} from "../controllers/likeController.js";
import {
  authenticate,
  optionalAuthenticate,
} from "../middlewares/authMiddleware.js";

const router = Router();

// Likes are stored per user/content pair and can be safely repeated.
router.get("/:contentId/status", optionalAuthenticate, getLikeStatus);
router.put("/:contentId", authenticate, likeContent);
router.delete("/:contentId", authenticate, unlikeContent);

export default router;
