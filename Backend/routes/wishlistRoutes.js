import { Router } from "express";
import {
  addWishlistItem,
  listWishlist,
  removeWishlistItem,
} from "../controllers/wishlistController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// Wishlist entries are private and do not change the user's like state.
router.use(authenticate);
router.get("/", listWishlist);
router.put("/:contentId", addWishlistItem);
router.delete("/:contentId", removeWishlistItem);

export default router;
