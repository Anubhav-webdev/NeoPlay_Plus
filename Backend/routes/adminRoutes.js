import { Router } from "express";
import {
  decideCreatorApplication,
  getOverview,
  listContent,
  listCreatorApplications,
  listUsers,
  moderateContent,
  updateUserRole,
} from "../controllers/adminController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = Router();

// Verify both identity and the current database-backed role for all admin APIs.
router.use(authenticate, allowRoles("admin"));
router.get("/overview", getOverview);
router.get("/users", listUsers);
router.patch("/users/:userId/role", updateUserRole);
router.get("/creator-applications", listCreatorApplications);
router.patch("/creator-applications/:creatorId", decideCreatorApplication);
router.get("/content", listContent);
router.patch("/content/:contentId", moderateContent);

export default router;
