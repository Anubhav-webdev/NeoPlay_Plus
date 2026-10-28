import { fileTypeFromFile } from "file-type";
import fs from "node:fs/promises";
import MediaAsset from "../models/MediaAsset.js";
import MediaDuplicateEvent from "../models/MediaDuplicateEvent.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import validateObjectId from "../utils/validateObjectId.js";
import { mediaConfig } from "../config/media.js";
import { enqueueMediaProcessing } from "../services/mediaQueue.js";
import { validateMediaType } from "../services/mediaFingerprint.js";
import {
  deleteStagedAsset,
  hashFile,
  safeOriginalName,
} from "../services/mediaProcessingService.js";

const mimeToKind = new Map([
  ["image/jpeg", "image"],
  ["image/png", "image"],
  ["image/webp", "image"],
  ["video/mp4", "video"],
  ["video/quicktime", "video"],
  ["video/webm", "video"],
  ["video/x-matroska", "video"],
]);

async function removeUploadFile(filePath) {
  if (filePath) await fs.rm(filePath, { force: true });
}

// Receive into a bounded temp file, hash original bytes, then enqueue worker processing.
export const createMediaUpload = asyncHandler(async (req, res) => {
  const filePath = req.file?.path;
  let asset;
  try {
    if (!req.file) throw new ApiError(400, "A file field named 'file' is required");
    const fileType = await fileTypeFromFile(filePath);
    const mediaType = fileType && mimeToKind.get(fileType.mime);
    if (!fileType || !mediaType) {
      throw new ApiError(415, "Unsupported or unrecognized media file contents");
    }
    if (!validateMediaType(fileType.mime, req.file.originalname, mediaType)) {
      throw new ApiError(415, "File extension does not match the actual media contents");
    }

    const creatorId = req.creator?._id;
    if (!creatorId) throw new ApiError(403, "An approved creator account is required");
    const sha256 = await hashFile(filePath);
    const existing = await MediaAsset.findOne({ sha256 }).select("+sha256");
    if (existing) {
      await MediaDuplicateEvent.create({
        ownerId: req.user._id,
        mediaType,
        sha256,
        matchAssetId: existing._id,
        score: 1,
        method: "sha256",
        outcome: "block",
        reason: "Exact duplicate SHA-256 match",
      });
      throw new ApiError(409, "Exact duplicate file detected; it was not stored");
    }

    try {
      asset = await MediaAsset.create({
        ownerId: req.user._id,
        creatorId,
        mediaType,
        status: "receiving",
        sha256,
        originalName: safeOriginalName(req.file.originalname),
        detectedMimeType: fileType.mime,
        stagedPath: filePath,
      });
    } catch (error) {
      if (error.code === 11000) {
        const concurrentMatch = await MediaAsset.findOne({ sha256 }).select("+sha256");
        if (concurrentMatch) {
          await MediaDuplicateEvent.create({
            ownerId: req.user._id,
            mediaType,
            sha256,
            matchAssetId: concurrentMatch._id,
            score: 1,
            method: "sha256",
            outcome: "block",
            reason: "Concurrent upload reserved the same SHA-256 hash first",
          });
          throw new ApiError(409, "Exact duplicate file detected; it was not stored");
        }
      }
      throw error;
    }

    try {
      await enqueueMediaProcessing(asset._id);
    } catch (error) {
      await MediaAsset.deleteOne({ _id: asset._id });
      await removeUploadFile(filePath);
      asset = null;
      throw new ApiError(503, `Media processing queue unavailable: ${error.message}`);
    }

    return sendResponse(res, 202, "Upload received and queued for verification", {
      uploadId: asset.id,
      status: asset.status,
      statusUrl: `/api/media/uploads/${asset.id}`,
      maxBytes: mediaConfig.maxBytes,
    });
  } catch (error) {
    if (!asset) await removeUploadFile(filePath);
    throw error;
  }
});

// Only the uploader (or an administrator) can inspect a pending media asset.
export const getMediaUploadStatus = asyncHandler(async (req, res) => {
  validateObjectId(req.params.uploadId, "uploadId");
  const filter = { _id: req.params.uploadId };
  if (req.user.role !== "admin") filter.ownerId = req.user._id;
  const asset = await MediaAsset.findOne(filter)
    .select("-sha256 -fingerprints -fingerprintBands -stagedPath -pendingCloudinaryPublicId")
    .populate("duplicateDecision.matchAssetId", "mediaType status");
  if (!asset) throw new ApiError(404, "Upload not found");
  return sendResponse(res, 200, "Upload status", {
    upload: asset,
    ready: asset.status === "ready",
  });
});

export const listDuplicateReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  const [uploads, total] = await Promise.all([
    MediaAsset.find({ status: "review_required" })
      .select("-sha256 -fingerprints -fingerprintBands -stagedPath")
      .populate("ownerId", "name username email")
      .populate(
        "duplicateDecision.matchAssetId",
        "mediaType status metadata secureUrl format",
      )
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    MediaAsset.countDocuments({ status: "review_required" }),
  ]);
  return sendResponse(res, 200, "Duplicate review queue", {
    uploads,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Moderator approval resumes processing; rejection removes the staged file and hash reservation.
export const reviewDuplicate = asyncHandler(async (req, res) => {
  validateObjectId(req.params.uploadId, "uploadId");
  if (!["approve", "reject"].includes(req.body.decision)) {
    throw new ApiError(400, "decision must be approve or reject");
  }
  const asset = await MediaAsset.findOne({
    _id: req.params.uploadId,
    status: "review_required",
  }).select("+sha256 +stagedPath");
  if (!asset) throw new ApiError(404, "Pending duplicate review not found");

  if (req.body.decision === "reject") {
    await deleteStagedAsset(asset);
    asset.status = "duplicate";
    asset.failureReason = "Rejected by moderator after duplicate review";
    asset.sha256 = undefined;
    asset.stagedPath = undefined;
    asset.expiresAt = null;
    asset.duplicateDecision.reviewedBy = req.user._id;
    asset.duplicateDecision.reviewedAt = new Date();
    await asset.save();
    await MediaDuplicateEvent.updateOne(
      { uploadAssetId: asset._id },
      {
        $set: {
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
          reviewDecision: "reject",
        },
      },
    );
    return sendResponse(res, 200, "Upload rejected and temporary media removed", {
      uploadId: asset.id,
      status: asset.status,
    });
  }

  if (asset.expiresAt && asset.expiresAt <= new Date()) {
    throw new ApiError(410, "Staged media expired; ask the creator to upload it again");
  }
  asset.status = "receiving";
  asset.duplicateDecision.reviewedBy = req.user._id;
  asset.duplicateDecision.reviewedAt = new Date();
  await asset.save();
  try {
    await enqueueMediaProcessing(asset._id, { bypassSimilarity: true });
  } catch (error) {
    asset.status = "review_required";
    await asset.save();
    throw new ApiError(503, `Media processing queue unavailable: ${error.message}`);
  }
  await MediaDuplicateEvent.updateOne(
    { uploadAssetId: asset._id },
    {
      $set: {
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewDecision: "approve",
      },
    },
  );
  return sendResponse(res, 202, "Upload approved for processing", {
    uploadId: asset.id,
    status: asset.status,
  });
});

export const listMyMediaUploads = asyncHandler(async (req, res) => {
  const uploads = await MediaAsset.find({ ownerId: req.user._id })
    .select("-sha256 -fingerprints -fingerprintBands -stagedPath -pendingCloudinaryPublicId")
    .sort({ createdAt: -1 })
    .limit(50);
  return sendResponse(res, 200, "Your media uploads", { uploads });
});

export { mimeToKind };
