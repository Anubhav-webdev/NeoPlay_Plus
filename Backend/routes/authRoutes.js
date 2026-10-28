import { Router } from "express";
import {
  login,
  logout,
  me,
  refresh,
  signup,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// Public account creation and sign-in; refresh/logout use the HttpOnly cookie.
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
