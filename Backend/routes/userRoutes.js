import { Router } from "express";
import { getProfile, updateProfile, uploadUserAvatar } from "../controllers/userController.js";
import { receiveProfileImageFile, requireReceivedMedia } from "../middlewares/uploadMiddleware.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// A user's account profile is always scoped to the authenticated identity.
router.use(authenticate);
router.get("/me", getProfile);
router.patch("/me", updateProfile);
router.post("/me/avatar", receiveProfileImageFile, requireReceivedMedia, uploadUserAvatar);

export default router;
