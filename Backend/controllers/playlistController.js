import Playlist from "../models/Playlist.js";
import Content from "../models/Content.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import validateObjectId from "../utils/validateObjectId.js";

export const listPlaylists = asyncHandler(async (req, res) => {
  const playlists = await Playlist.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .populate({
      path: "contentIds",
      match: { status: "published" },
      select: "title type thumbnailUrl mediaUrl publishedAt",
    });
  return sendResponse(res, 200, "Playlists retrieved", { playlists });
});

export const getPlaylist = asyncHandler(async (req, res) => {
  validateObjectId(req.params.playlistId, "playlistId");
  const playlist = await Playlist.findById(req.params.playlistId).populate({
    path: "contentIds",
    match: { status: "published" },
    select: "title type thumbnailUrl mediaUrl publishedAt",
  });
  if (
    !playlist ||
    (!playlist.isPublic && String(playlist.userId) !== String(req.user?._id))
  ) {
    throw new ApiError(404, "Playlist not found");
  }
  return sendResponse(res, 200, "Playlist retrieved", { playlist });
});

export const createPlaylist = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name || name.length > 150)
    throw new ApiError(400, "Playlist name is required (max 150)");
  const playlist = await Playlist.create({
    name,
    isPublic: req.body.isPublic !== false,
    userId: req.user._id,
  });
  return sendResponse(res, 201, "Playlist created", { playlist });
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  validateObjectId(req.params.playlistId, "playlistId");
  const playlist = await Playlist.findOne({
    _id: req.params.playlistId,
    userId: req.user._id,
  });
  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name || name.length > 150)
      throw new ApiError(400, "Playlist name is invalid");
    playlist.name = name;
  }
  if (req.body.isPublic !== undefined) {
    if (typeof req.body.isPublic !== "boolean") {
      throw new ApiError(400, "isPublic must be a boolean");
    }
    playlist.isPublic = req.body.isPublic;
  }
  await playlist.save();
  await playlist.populate({
    path: "contentIds",
    match: { status: "published" },
    select: "title type thumbnailUrl mediaUrl publishedAt",
  });
  return sendResponse(res, 200, "Playlist updated", { playlist });
});

export const addPlaylistItem = asyncHandler(async (req, res) => {
  validateObjectId(req.params.playlistId, "playlistId");
  validateObjectId(req.params.contentId, "contentId");
  const [playlist, content] = await Promise.all([
    Playlist.findOne({ _id: req.params.playlistId, userId: req.user._id }),
    Content.findOne({ _id: req.params.contentId, status: "published" }),
  ]);
  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (!content) throw new ApiError(404, "Published content not found");
  if (!playlist.contentIds.some((id) => String(id) === String(content._id))) {
    playlist.contentIds.push(content._id);
    await playlist.save();
  }
  await playlist.populate({
    path: "contentIds",
    match: { status: "published" },
    select: "title type thumbnailUrl mediaUrl publishedAt",
  });
  return sendResponse(res, 200, "Content added to playlist", { playlist });
});

export const removePlaylistItem = asyncHandler(async (req, res) => {
  validateObjectId(req.params.playlistId, "playlistId");
  validateObjectId(req.params.contentId, "contentId");
  const playlist = await Playlist.findOneAndUpdate(
    { _id: req.params.playlistId, userId: req.user._id },
    { $pull: { contentIds: req.params.contentId } },
    { new: true }
  );
  if (!playlist) throw new ApiError(404, "Playlist not found");
  await playlist.populate({
    path: "contentIds",
    match: { status: "published" },
    select: "title type thumbnailUrl mediaUrl publishedAt",
  });
  return sendResponse(res, 200, "Content removed from playlist", { playlist });
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  validateObjectId(req.params.playlistId, "playlistId");
  const result = await Playlist.deleteOne({
    _id: req.params.playlistId,
    userId: req.user._id,
  });
  if (!result.deletedCount) throw new ApiError(404, "Playlist not found");
  return sendResponse(res, 200, "Playlist deleted");
});
