import Playlist from "../models/Playlist.js";
import Content from "../models/Content.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import validateObjectId from "../utils/validateObjectId.js";
import cloudinary from "../config/cloudinary.js";

const playlistContentPopulate = {
  path: "contentIds",
  match: { status: "published" },
  select: "title type description thumbnailUrl thumbnailAssetId mediaUrl mediaPublicId publishedAt creatorId",
  populate: [
    { path: "thumbnailAssetId", select: "secureUrl" },
    { path: "creatorId", select: "displayName avatar" },
  ],
};

function serializePlaylist(playlist) {
  const value = playlist.toObject();
  value.contentIds = (playlist.contentIds || []).filter(Boolean).map((content) => {
    const item = content.toObject ? content.toObject() : content;
    const thumbnailUrl = item.thumbnailUrl || item.thumbnailAssetId?.secureUrl ||
      (item.type === "Video" && item.mediaPublicId
        ? cloudinary.url(item.mediaPublicId, {
            resource_type: "video",
            format: "jpg",
            transformation: [{ start_offset: "0" }],
          })
        : null);
    return { ...item, thumbnailUrl };
  });
  return value;
}

async function populatePlaylistContent(playlist) {
  await playlist.populate(playlistContentPopulate);
  return serializePlaylist(playlist);
}

export const listPlaylists = asyncHandler(async (req, res) => {
  const records = await Playlist.find({ userId: req.user._id }).sort({ updatedAt: -1 });
  const playlists = await Promise.all(records.map(populatePlaylistContent));
  return sendResponse(res, 200, "Playlists retrieved", { playlists });
});

export const getPlaylist = asyncHandler(async (req, res) => {
  validateObjectId(req.params.playlistId, "playlistId");
  const playlist = await Playlist.findById(req.params.playlistId).select("-notes");
  const serializedPlaylist = playlist ? await populatePlaylistContent(playlist) : null;
  if (
    !playlist ||
    (!playlist.isPublic && String(playlist.userId) !== String(req.user?._id))
  ) {
    throw new ApiError(404, "Playlist not found");
  }
  return sendResponse(res, 200, "Playlist retrieved", { playlist: serializedPlaylist });
});

export const createPlaylist = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name || name.length > 150)
    throw new ApiError(400, "Playlist name is required (max 150)");
  const description = String(req.body.description || "").trim();
  if (description.length > 2000) throw new ApiError(400, "Playlist description cannot exceed 2000 characters");
  if (req.body.isPublic !== undefined && typeof req.body.isPublic !== "boolean") {
    throw new ApiError(400, "isPublic must be a boolean");
  }
  const playlist = await Playlist.create({
    name,
    description,
    isPublic: req.body.isPublic === true,
    userId: req.user._id,
  });
  return sendResponse(res, 201, "Playlist created", { playlist: playlist.toObject() });
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
  if (req.body.description !== undefined) {
    if (typeof req.body.description !== "string" || req.body.description.length > 2000) {
      throw new ApiError(400, "Playlist description must be text up to 2000 characters");
    }
    playlist.description = req.body.description.trim();
  }
  if (req.body.notes !== undefined) {
    if (!Array.isArray(req.body.notes) || req.body.notes.length > 100) {
      throw new ApiError(400, "A playlist can contain at most 100 notes");
    }
    playlist.notes = req.body.notes.map((note) => {
      const title = String(note?.title || "Untitled note").trim();
      const content = String(note?.content || "");
      if (!title || title.length > 100 || content.length > 5000) {
        throw new ApiError(400, "Note title must be 1-100 characters and content at most 5000");
      }
      const noteId = note?._id || note?.id;
      if (noteId) validateObjectId(noteId, "noteId");
      return { ...(noteId ? { _id: noteId } : {}), title, content };
    });
  }
  await playlist.save();
  const updated = await populatePlaylistContent(playlist);
  return sendResponse(res, 200, "Playlist updated", { playlist: updated });
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
  const updated = await populatePlaylistContent(playlist);
  return sendResponse(res, 200, "Content added to playlist", { playlist: updated });
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
  const updated = await populatePlaylistContent(playlist);
  return sendResponse(res, 200, "Content removed from playlist", { playlist: updated });
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
