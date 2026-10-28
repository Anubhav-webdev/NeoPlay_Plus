import { Router } from "express";
import {
  archiveContent,
  createContent,
  getContent,
  incrementView,
  listContent,
  listMyContent,
  publishContent,
  updateContent,
} from "../controllers/contentController.js";
import {
  authenticate,
  optionalAuthenticate,
} from "../middlewares/authMiddleware.js";
import { requireApprovedCreator } from "../middlewares/roleMiddleware.js";

const router = Router();

// Specific paths are registered before /:contentId to avoid route collisions.
router.get("/", listContent);
router.get("/mine", authenticate, listMyContent);
router.post("/", authenticate, requireApprovedCreator, createContent);
router.get("/:contentId", optionalAuthenticate, getContent);
router.post("/:contentId/view", incrementView);
router.patch("/:contentId", authenticate, updateContent);
router.post("/:contentId/publish", authenticate, publishContent);
router.delete("/:contentId", authenticate, archiveContent);

export default router;
