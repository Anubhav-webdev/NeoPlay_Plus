import { Router } from "express";
import {
  addPlaylistItem,
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  listPlaylists,
  removePlaylistItem,
  updatePlaylist,
} from "../controllers/playlistController.js";
import {
  authenticate,
  optionalAuthenticate,
} from "../middlewares/authMiddleware.js";

const router = Router();

// Public playlists can be viewed without login; mutation is always owner-only.
router.get("/", authenticate, listPlaylists);
router.post("/", authenticate, createPlaylist);
router.get("/:playlistId", optionalAuthenticate, getPlaylist);
router.patch("/:playlistId", authenticate, updatePlaylist);
router.delete("/:playlistId", authenticate, deletePlaylist);
router.post("/:playlistId/content/:contentId", authenticate, addPlaylistItem);
router.delete(
  "/:playlistId/content/:contentId",
  authenticate,
  removePlaylistItem
);

export default router;
