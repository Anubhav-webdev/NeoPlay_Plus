import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// A user's account profile is always scoped to the authenticated identity.
router.use(authenticate);
router.get("/me", getProfile);
router.patch("/me", updateProfile);

export default router;
