import { Router } from "express";
import {
  createComment,
  createReply,
  deleteComment,
  deleteReply,
  listComments,
  listMyCreatorComments,
  listReplies,
} from "../controllers/commentController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// Reading comments/replies is public; writing and deleting requires a login.
router.get("/content/:contentId", listComments);
router.get("/mine", authenticate, listMyCreatorComments);
router.post("/content/:contentId", authenticate, createComment);
router.get("/:commentId/replies", listReplies);
router.post("/:commentId/replies", authenticate, createReply);
router.delete("/replies/:replyId", authenticate, deleteReply);
router.delete("/:commentId", authenticate, deleteComment);

export default router;
