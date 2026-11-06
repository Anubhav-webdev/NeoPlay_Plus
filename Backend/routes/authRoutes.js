import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  login,
  logout,
  me,
  refresh,
  signup,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many unsuccessful login attempts; try again later",
  },
});
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Signup limit reached; try again later",
  },
});

// Public account creation and sign-in; refresh/logout use the HttpOnly cookie.
router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
