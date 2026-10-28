import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = Router();

// Browsing categories is public; category management is admin-only.
router.get("/", listCategories);
router.post("/", authenticate, allowRoles("admin"), createCategory);
router.patch("/:categoryId", authenticate, allowRoles("admin"), updateCategory);
router.delete(
  "/:categoryId",
  authenticate,
  allowRoles("admin"),
  deleteCategory
);

export default router;
