import { Router } from "express";
import {
  clearWatchHistory,
  deleteWatchHistoryItem,
  listWatchHistory,
  upsertWatchHistory,
} from "../controllers/watchHistoryController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// History is private to the authenticated account.
router.use(authenticate);
router.get("/", listWatchHistory);
router.put("/:contentId", upsertWatchHistory);
router.delete("/", clearWatchHistory);
router.delete("/:contentId", deleteWatchHistoryItem);

export default router;
