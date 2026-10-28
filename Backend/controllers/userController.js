import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileTypeFromFile } from "file-type";
import sharp from "sharp";
import User from "../models/users.js";
import { mediaConfig } from "../config/media.js";
import { deleteCloudinaryAsset, uploadBuffer } from "../services/cloudinaryService.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";

// User endpoints expose only profile fields, never password or token hashes.
export const getProfile = asyncHandler(async (req, res) =>
  sendResponse(res, 200, "Profile retrieved", { user: req.user })
);

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (name.length < 2 || name.length > 100) {
      throw new ApiError(400, "Name must be between 2 and 100 characters");
    }
    updates.name = name;
  }
  if (req.body.username !== undefined) {
    const username = String(req.body.username).trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      throw new ApiError(
        400,
        "Username must be 3-30 letters, numbers, or underscores"
      );
    }
    updates.username = username;
  }
  if (req.body.phone !== undefined || req.body.phoneNumber !== undefined) {
    const phone = String(req.body.phoneNumber || req.body.phone).trim();
    if (!/^\+?[0-9]{7,15}$/.test(phone)) {
      throw new ApiError(400, "Phone must contain 7 to 15 digits");
    }
    updates.phoneNumber = phone;
  }
  if (req.body.email !== undefined) {
    const email = String(req.body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "A valid email is required");
    }
    updates.email = email;
  }
  if (!Object.keys(updates).length)
    throw new ApiError(400, "No profile fields provided");

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
    select:
      "_id name username email phoneNumber role avatar isVerified createdAt updatedAt",
  });
  return sendResponse(res, 200, "Profile updated", { user });
});

const AVATAR_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const AVATAR_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export const uploadUserAvatar = asyncHandler(async (req, res) => {
  const filePath = req.file?.path;
  let uploadedAsset;
  let profileSaved = false;
  try {
    if (!req.file) throw new ApiError(400, "A file field named file is required");
    const detectedType = await fileTypeFromFile(filePath);
    const extension = path.extname(req.file.originalname || "").toLowerCase();
    if (!detectedType || !AVATAR_MIMES.has(detectedType.mime) || !AVATAR_EXTENSIONS.has(extension)) {
      throw new ApiError(415, "Choose a JPEG, PNG, or WebP profile image");
    }
    if ((detectedType.mime === "image/jpeg" && ![".jpg", ".jpeg"].includes(extension)) ||
        (detectedType.mime === "image/png" && extension !== ".png") ||
        (detectedType.mime === "image/webp" && extension !== ".webp")) {
      throw new ApiError(415, "The image extension must match its file type");
    }
    const image = sharp(filePath, { limitInputPixels: mediaConfig.maxImagePixels, failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) throw new ApiError(415, "The selected file is not a valid image");
    const buffer = await image.rotate().resize(512, 512, { fit: "cover", withoutEnlargement: true }).webp({ quality: 86, effort: 4 }).toBuffer();
    uploadedAsset = await uploadBuffer(buffer, {
      folder: "neoplay/users/" + req.user.id,
      publicId: "avatar-" + randomUUID(),
      resourceType: "image",
      tags: ["neoplay-user-profile", "avatar"],
    });
    const user = await User.findById(req.user._id).select("+avatarPublicId");
    if (!user) throw new ApiError(404, "User account not found");
    const previousPublicId = user.avatarPublicId;
    user.avatar = uploadedAsset.secure_url;
    user.avatarPublicId = uploadedAsset.public_id;
    await user.save();
    profileSaved = true;
    if (previousPublicId) {
      await deleteCloudinaryAsset(previousPublicId, "image").catch((error) => {
        console.error("Could not remove replaced user avatar", { userId: user.id, error });
      });
    }
    const result = user.toObject();
    delete result.avatarPublicId;
    return sendResponse(res, 200, "Profile image updated", { user: result });
  } finally {
    if (filePath) await fs.rm(filePath, { force: true }).catch(() => {});
    if (uploadedAsset && !profileSaved) {
      await deleteCloudinaryAsset(uploadedAsset.public_id, "image").catch(() => {});
    }
  }
});
