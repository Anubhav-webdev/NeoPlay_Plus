import { Router } from "express";
import {
  createReport,
  listReports,
  updateReportStatus,
} from "../controllers/reportController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = Router();

// Users submit reports; only administrators can review and resolve them.
router.post("/content/:contentId", authenticate, createReport);
router.get("/", authenticate, allowRoles("admin"), listReports);
router.patch(
  "/:reportId",
  authenticate,
  allowRoles("admin"),
  updateReportStatus
);

export default router;
