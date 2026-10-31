import { randomInt, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileTypeFromFile } from "file-type";
import sharp from "sharp";
import mongoose from "mongoose";
import Creator from "../models/Creator.js";
import User from "../models/users.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import validateObjectId from "../utils/validateObjectId.js";
import { mediaConfig } from "../config/media.js";
import { deleteCloudinaryAsset, uploadBuffer } from "../services/cloudinaryService.js";

const PROFILE_IMAGE_TYPES = {
  avatar: { urlField: "avatar", publicIdField: "avatarPublicId", width: 512, height: 512 },
  banner: { urlField: "banner", publicIdField: "bannerPublicId", width: 1920, height: 720 },
};
const PROFILE_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PROFILE_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function creatorIdStem(displayName) {
  const normalized = displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const stem = /[a-z]/.test(normalized) ? normalized : `creator${normalized}`;
  return stem.slice(0, 24) || "creator";
}

async function generateCreatorId(displayName) {
  const stem = creatorIdStem(displayName);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = `${stem}${randomInt(100000, 1000000)}`;
    if (!(await Creator.exists({ creatorId: candidate }))) return candidate;
  }
  throw new ApiError(503, "Could not generate a unique Creator ID. Please try again.");
}

async function ensureCreatorId(creator) {
  if (creator.creatorId) return creator;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = await generateCreatorId(creator.displayName);
    try {
      const result = await Creator.collection.updateOne(
        { _id: creator._id, creatorId: { $exists: false } },
        { $set: { creatorId: candidate } },
      );
      const savedCreator = await Creator.findById(creator._id);
      if (savedCreator?.creatorId) return savedCreator;
      if (result.matchedCount === 0) continue;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  throw new ApiError(503, "Could not assign a unique Creator ID. Please try again.");
}

function readCreatorProfile(body) {
  const displayName = String(body.displayName || body.channelName || "").trim();
  const tagline = body.tagline === undefined ? "" : body.tagline;
  const about = body.about === undefined ? "" : body.about;
  if (displayName.length < 2 || displayName.length > 100) {
    throw new ApiError(400, "Channel name must be between 2 and 100 characters");
  }
  if (typeof tagline !== "string" || tagline.trim().length > 160) {
    throw new ApiError(400, "Tagline must be text with at most 160 characters");
  }
  if (typeof about !== "string" || about.trim().length > 2000) {
    throw new ApiError(400, "Description must be text with at most 2000 characters");
  }
  return { displayName, tagline: tagline.trim(), about: about.trim() };
}

// Creator directory contains approved profiles only.
export const listCreators = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
  );
  const filter = { applicationStatus: "approved" };
  const [creators, total] = await Promise.all([
    Creator.find(filter)
      .select("creatorId displayName avatar banner tagline about userId createdAt")
      .populate("userId", "username name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Creator.countDocuments(filter),
  ]);
  return sendResponse(res, 200, "Creators retrieved", {
    creators,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const applyAsCreator = asyncHandler(async (req, res) => {
  const profile = readCreatorProfile(req.body);
  const existing = await Creator.findOne({ userId: req.user._id });
  if (existing) {
    if (existing.applicationStatus !== "rejected") {
      throw new ApiError(409, "A creator application already exists");
    }
    const persistentCreator = await ensureCreatorId(existing);
    persistentCreator.displayName = profile.displayName;
    persistentCreator.tagline = profile.tagline;
    persistentCreator.about = profile.about;
    persistentCreator.applicationStatus = "pending";
    persistentCreator.approvedAt = null;
    await persistentCreator.save();
    return sendResponse(res, 200, "Creator application resubmitted", {
      creator: persistentCreator,
    });
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const creator = await Creator.create({
        userId: req.user._id,
        creatorId: await generateCreatorId(profile.displayName),
        ...profile,
      });
      return sendResponse(res, 201, "Creator application submitted", { creator });
    } catch (error) {
      if (error.code !== 11000) throw error;
      if (await Creator.exists({ userId: req.user._id })) {
        throw new ApiError(409, "A creator application already exists");
      }
    }
  }
  throw new ApiError(503, "Could not generate a unique Creator ID. Please try again.");
});

export const getMyCreatorProfile = asyncHandler(async (req, res) => {
  let creator = await Creator.findOne({ userId: req.user._id });
  if (creator) creator = await ensureCreatorId(creator);
  return sendResponse(res, 200, "Creator application retrieved", { creator });
});

export const updateMyCreatorProfile = asyncHandler(async (req, res) => {
  let creator = await Creator.findOne({ userId: req.user._id });
  if (!creator) throw new ApiError(404, "Creator profile not found");
  creator = await ensureCreatorId(creator);
  if (req.body.displayName !== undefined) {
    if (typeof req.body.displayName !== "string") {
      throw new ApiError(400, "Display name must be text");
    }
    const displayName = req.body.displayName.trim();
    if (displayName.length < 2 || displayName.length > 100) {
      throw new ApiError(400, "Display name must be between 2 and 100 characters");
    }
    creator.displayName = displayName;
  }
  for (const [field, maxLength, label] of [
    ["tagline", 160, "Tagline"],
    ["about", 2000, "Description"],
  ]) {
    if (req.body[field] === undefined) continue;
    if (typeof req.body[field] !== "string") {
      throw new ApiError(400, label + " must be text");
    }
    const value = req.body[field].trim();
    if (value.length > maxLength) {
      throw new ApiError(400, label + " cannot exceed " + maxLength + " characters");
    }
    creator[field] = value;
  }
  await creator.save();
  return sendResponse(res, 200, "Creator profile updated", { creator });
});

export const uploadCreatorProfileImage = asyncHandler(async (req, res) => {
  const filePath = req.file?.path;
  let uploadedAsset;
  let profileSaved = false;
  let preservePreviousPublicId = false;
  try {
    const imageType = PROFILE_IMAGE_TYPES[req.params.imageType];
    if (!imageType) throw new ApiError(400, "Image type must be avatar or banner");
    if (!req.file) throw new ApiError(400, "A file field named file is required");

    const detectedType = await fileTypeFromFile(filePath);
    const extension = path.extname(req.file.originalname || "").toLowerCase();
    if (
      !detectedType ||
      !PROFILE_IMAGE_MIMES.has(detectedType.mime) ||
      !PROFILE_IMAGE_EXTENSIONS.has(extension) ||
      (detectedType.mime === "image/jpeg" && ![".jpg", ".jpeg"].includes(extension)) ||
      (detectedType.mime === "image/png" && extension !== ".png") ||
      (detectedType.mime === "image/webp" && extension !== ".webp")
    ) {
      throw new ApiError(415, "Choose a JPEG, PNG, or WebP image with a matching extension");
    }

    const image = sharp(filePath, {
      limitInputPixels: mediaConfig.maxImagePixels,
      failOn: "error",
    });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new ApiError(415, "The selected file is not a valid image");
    }
    const buffer = await image
      .rotate()
      .resize(imageType.width, imageType.height, {
        fit: "cover",
        withoutEnlargement: true,
      })
      .webp({ quality: 86, effort: 4 })
      .toBuffer();

    uploadedAsset = await uploadBuffer(buffer, {
      folder: "neoplay/creators/" + req.creator._id,
      publicId: req.params.imageType + "-" + randomUUID(),
      resourceType: "image",
      tags: ["neoplay-creator-profile", req.params.imageType],
    });
    const creator = await Creator.findById(req.creator._id).select(
      "+avatarPublicId +bannerPublicId"
    );
    if (!creator) throw new ApiError(404, "Creator profile not found");
    const previousPublicId = creator[imageType.publicIdField];
    creator[imageType.urlField] = uploadedAsset.secure_url;
    creator[imageType.publicIdField] = uploadedAsset.public_id;
    await creator.save();
    profileSaved = true;
    if (req.params.imageType === "avatar") {
      try {
        const user = await User.findById(creator.userId).select("+avatarPublicId");
        if (user) {
          const previousUserAvatarId = user.avatarPublicId;
          user.avatar = uploadedAsset.secure_url;
          user.avatarPublicId = uploadedAsset.public_id;
          await user.save();
          if (previousUserAvatarId && previousUserAvatarId !== previousPublicId) {
            await deleteCloudinaryAsset(previousUserAvatarId, "image").catch((error) => {
              console.error("Could not remove replaced user avatar", { userId: user.id, error });
            });
          }
        }
      } catch (error) {
        preservePreviousPublicId = true;
        console.error("Could not sync creator photo to user profile", { creatorId: creator.id, error });
      }
    }
    if (previousPublicId && !preservePreviousPublicId) {
      await deleteCloudinaryAsset(previousPublicId, "image").catch((error) => {
        console.error("Could not remove replaced creator profile image", {
          creatorId: creator.id,
          error,
        });
      });
    }
    const result = creator.toObject();
    delete result.avatarPublicId;
    delete result.bannerPublicId;
    return sendResponse(res, 200, "Creator profile image updated", { creator: result });
  } finally {
    if (filePath) await fs.rm(filePath, { force: true }).catch(() => {});
    if (uploadedAsset && !profileSaved) {
      await deleteCloudinaryAsset(uploadedAsset.public_id, "image").catch(() => {});
    }
  }
});
export const getCreator = asyncHandler(async (req, res) => {
  const requestedId = String(req.params.creatorId || "").trim().toLowerCase();
  const fields = "creatorId displayName avatar banner tagline about createdAt";
  let creator = await Creator.findOne({
    creatorId: requestedId,
    applicationStatus: "approved",
  }).select(fields);
  if (!creator && mongoose.isValidObjectId(requestedId)) {
    creator = await Creator.findOne({
      _id: requestedId,
      applicationStatus: "approved",
    }).select(fields);
  }
  if (!creator) throw new ApiError(404, "Creator not found");
  return sendResponse(res, 200, "Creator retrieved", { creator });
});

export const setCreatorDecision = async (creatorId, status) => {
  validateObjectId(creatorId, "creatorId");
  const creator = await Creator.findById(creatorId);
  if (!creator) throw new ApiError(404, "Creator application not found");
  creator.applicationStatus = status;
  creator.approvedAt = status === "approved" ? new Date() : null;
  await creator.save();
  await User.findByIdAndUpdate(creator.userId, {
    role: status === "approved" ? "creator" : "user",
  });
  return creator;
};
