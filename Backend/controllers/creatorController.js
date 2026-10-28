import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileTypeFromFile } from "file-type";
import sharp from "sharp";
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
      .select("displayName avatar banner tagline about userId createdAt")
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
  const displayName = String(req.body.displayName || "").trim();
  if (displayName.length < 2 || displayName.length > 100) {
    throw new ApiError(
      400,
      "Display name must be between 2 and 100 characters"
    );
  }
  const existing = await Creator.findOne({ userId: req.user._id });
  if (existing) {
    if (existing.applicationStatus !== "rejected") {
      throw new ApiError(409, "A creator application already exists");
    }
    existing.displayName = displayName;
    existing.applicationStatus = "pending";
    existing.approvedAt = null;
    await existing.save();
    return sendResponse(res, 200, "Creator application resubmitted", {
      creator: existing,
    });
  }
  const creator = await Creator.create({ userId: req.user._id, displayName });
  return sendResponse(res, 201, "Creator application submitted", { creator });
});

export const getMyCreatorProfile = asyncHandler(async (req, res) => {
  const creator = await Creator.findOne({ userId: req.user._id });
  return sendResponse(res, 200, "Creator application retrieved", { creator });
});

export const updateMyCreatorProfile = asyncHandler(async (req, res) => {
  const creator = await Creator.findOne({ userId: req.user._id });
  if (!creator) throw new ApiError(404, "Creator profile not found");
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
    if (previousPublicId) {
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
  validateObjectId(req.params.creatorId, "creatorId");
  const creator = await Creator.findOne({
    _id: req.params.creatorId,
    applicationStatus: "approved",
  }).select("displayName avatar banner tagline about createdAt");
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
