import { fileTypeFromFile } from "file-type";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
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

function getChunkPath(asset, index) {
  return path.join(asset.chunkDirectory, `${index}.part`);
}

export const initiateMediaUpload = asyncHandler(async (req, res) => {
  const { fileName, fileSize, mimeType } = req.body || {};
  const mediaType = mimeToKind.get(mimeType);
  if (
    typeof fileName !== "string" ||
    !fileName.trim() ||
    !Number.isSafeInteger(fileSize) ||
    fileSize < 1 ||
    fileSize > mediaConfig.maxBytes ||
    !mediaType ||
    !validateMediaType(mimeType, fileName, mediaType)
  ) {
    throw new ApiError(400, "Invalid file name, size, or media type");
  }
  const creatorId = req.creator?._id;
  if (!creatorId) throw new ApiError(403, "An approved creator account is required");

  const asset = new MediaAsset({
    ownerId: req.user._id,
    creatorId,
    mediaType,
    status: "receiving",
    originalName: safeOriginalName(fileName),
    detectedMimeType: mimeType,
    uploadSize: fileSize,
    uploadChunkSize: mediaConfig.uploadChunkBytes,
    receivedChunks: [],
  });
  asset.stagedPath = path.join(mediaConfig.tempDir, `${asset.id}.upload`);
  asset.chunkDirectory = path.join(mediaConfig.tempDir, `${asset.id}.chunks`);
  try {
    await fs.mkdir(asset.chunkDirectory, { recursive: true });
    await asset.save();
  } catch (error) {
    await fs.rm(asset.chunkDirectory, { recursive: true, force: true });
    throw error;
  }

  return sendResponse(res, 201, "Resumable upload initialized", {
    uploadId: asset.id,
    status: asset.status,
    chunkSize: asset.uploadChunkSize,
    totalChunks: Math.ceil(fileSize / asset.uploadChunkSize),
    receivedChunks: asset.receivedChunks,
  });
});

export const receiveMediaUploadChunk = asyncHandler(async (req, res) => {
  validateObjectId(req.params.uploadId, "uploadId");
  const index = Number(req.params.chunkIndex);
  if (!Number.isSafeInteger(index) || index < 0 || !Buffer.isBuffer(req.body)) {
    throw new ApiError(400, "Invalid upload chunk");
  }
  const asset = await MediaAsset.findOne({
    _id: req.params.uploadId,
    ownerId: req.user._id,
    status: "receiving",
  }).select("+chunkDirectory");
  if (!asset) throw new ApiError(404, "Resumable upload not found");

  const totalChunks = Math.ceil(asset.uploadSize / asset.uploadChunkSize);
  if (index >= totalChunks) throw new ApiError(400, "Chunk index is out of range");
  const expectedSize = Math.min(
    asset.uploadChunkSize,
    asset.uploadSize - index * asset.uploadChunkSize,
  );
  if (req.body.length !== expectedSize) {
    throw new ApiError(400, "Chunk size does not match the expected range");
  }
  const chunkHash = createHash("sha256").update(req.body).digest("hex");
  if (req.get("X-Chunk-SHA256") !== chunkHash) {
    throw new ApiError(400, "Upload chunk checksum does not match");
  }

  const chunkPath = getChunkPath(asset, index);
  if (!asset.receivedChunks.includes(index)) {
    await fs.mkdir(asset.chunkDirectory, { recursive: true });
    const temporaryPath = `${chunkPath}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporaryPath, req.body, { flag: "wx" });
      await fs.link(temporaryPath, chunkPath);
    } catch (error) {
      if (error.code !== "EEXIST") {
        await fs.rm(temporaryPath, { force: true });
        throw error;
      }
      const existing = await fs.readFile(chunkPath);
      const existingHash = createHash("sha256").update(existing).digest("hex");
      if (existing.length !== expectedSize || existingHash !== chunkHash) {
        await fs.rm(temporaryPath, { force: true });
        throw new ApiError(409, "Chunk conflicts with a previously received part");
      }
    }
    await fs.rm(temporaryPath, { force: true });
    await MediaAsset.updateOne(
      { _id: asset._id, ownerId: req.user._id, status: "receiving" },
      {
        $addToSet: {
          receivedChunks: index,
          chunkHashes: { index, sha256: chunkHash },
        },
      },
    );
  } else {
    const storedHash = asset.chunkHashes
      ?.find((chunk) => chunk.index === index)?.sha256;
    if (storedHash !== chunkHash) {
      throw new ApiError(409, "Chunk differs from the previously uploaded file");
    }
  }

  return sendResponse(res, 200, "Upload chunk received", {
    uploadId: asset.id,
    chunkIndex: index,
  });
});

export const cancelMediaUpload = asyncHandler(async (req, res) => {
  validateObjectId(req.params.uploadId, "uploadId");
  const asset = await MediaAsset.findOne({
    _id: req.params.uploadId,
    ownerId: req.user._id,
    status: "receiving",
  }).select("+stagedPath +chunkDirectory");
  if (!asset) throw new ApiError(404, "Active resumable upload not found");
  await deleteStagedAsset(asset);
  await MediaAsset.deleteOne({ _id: asset._id, status: "receiving" });
  return sendResponse(res, 200, "Resumable upload cancelled", {
    uploadId: asset.id,
  });
});

export const getMediaUploadLimits = asyncHandler(async (req, res) => {
  return sendResponse(res, 200, "Media upload limits", {
    maxBytes: mediaConfig.maxBytes,
    maxVideoDurationSeconds: mediaConfig.maxVideoDurationSeconds,
    largeVideoCompressionThresholdBytes:
      mediaConfig.largeVideoCompressionThresholdBytes,
  });
});

async function queueReceivedMedia(req, res, file, existingAsset = null) {
  const filePath = file?.path;
  let asset = existingAsset;
  try {
    if (!file) throw new ApiError(400, "A file field named 'file' is required");

    const fileType = await fileTypeFromFile(filePath);
    const mediaType = fileType && mimeToKind.get(fileType.mime);

    if (!fileType || !mediaType) {
      throw new ApiError(415, "Unsupported or unrecognized media file contents");
    }

    if (
      file.mimetype !== fileType.mime ||
      !validateMediaType(fileType.mime, file.originalname, mediaType)
    ) {
      throw new ApiError(415, "File extension and declared MIME type must match the actual file");
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

    if (asset) {
      asset.status = "queued";
      asset.sha256 = sha256;
      asset.originalName = safeOriginalName(file.originalname);
      asset.detectedMimeType = fileType.mime;
      asset.receivedChunks = [];
      asset.chunkHashes = [];
      asset.uploadSize = null;
      asset.uploadChunkSize = null;
      asset.chunkDirectory = undefined;
      try {
        await asset.save();
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
    } else {
      try {
        asset = await MediaAsset.create({
          ownerId: req.user._id,
          creatorId,
          mediaType,
          status: "queued",
          sha256,
          originalName: safeOriginalName(file.originalname),
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
    }

    try {
      await enqueueMediaProcessing(asset._id);
    } catch (error) {
      throw new ApiError(503, `Media processing queue unavailable: ${error.message}`);
    }
    return sendResponse(res, 202, "Upload received and queued for verification", {
      uploadId: asset.id,
      status: asset.status,
      statusUrl: `/api/media/uploads/${asset.id}`,
      maxBytes: mediaConfig.maxBytes,
    });
  } catch (error) {
    if (asset) {
      if (asset.chunkDirectory) {
        await fs.rm(asset.chunkDirectory, { recursive: true, force: true });
      }
      await MediaAsset.deleteOne({ _id: asset._id });
    }
    await removeUploadFile(filePath);
    throw error;
  }
}

// Receive into a bounded temp file, hash original bytes, then enqueue worker processing.
export const createMediaUpload = asyncHandler(async (req, res) => {
  return queueReceivedMedia(req, res, req.file);
});

export const finalizeMediaUpload = asyncHandler(async (req, res) => {
  validateObjectId(req.params.uploadId, "uploadId");
  let asset = await MediaAsset.findOne({
    _id: req.params.uploadId,
    ownerId: req.user._id,
    status: "receiving",
  }).select("+stagedPath +chunkDirectory");
  if (!asset) {
    const existing = await MediaAsset.findOne({
      _id: req.params.uploadId,
      ownerId: req.user._id,
      status: { $in: ["queued", "checking", "processing", "ready"] },
    });
    if (existing) {
      return sendResponse(res, 202, "Upload already finalized", {
        uploadId: existing.id,
        status: existing.status,
      });
    }
    throw new ApiError(404, "Resumable upload not found");
  }

  const totalChunks = Math.ceil(asset.uploadSize / asset.uploadChunkSize);
  const received = new Set(asset.receivedChunks);
  const missingCount = Array.from({ length: totalChunks }, (_, index) => index)
    .filter((index) => !received.has(index)).length;
  if (missingCount) {
    throw new ApiError(409, `Upload is missing ${missingCount} chunk(s)`);
  }

  const claimed = await MediaAsset.findOneAndUpdate(
    { _id: asset._id, ownerId: req.user._id, status: "receiving" },
    { $set: { status: "checking" } },
    { returnDocument: "after" },
  ).select("+stagedPath +chunkDirectory");
  if (!claimed) throw new ApiError(409, "Upload finalization is already in progress");
  asset = claimed;

  let stagedFile;
  try {
    const output = await fs.open(asset.stagedPath, "w");
    try {
      for (let index = 0; index < totalChunks; index += 1) {
        const chunk = await fs.readFile(getChunkPath(asset, index));
        const expectedSize = Math.min(
          asset.uploadChunkSize,
          asset.uploadSize - index * asset.uploadChunkSize,
        );
        if (chunk.length !== expectedSize) {
          throw new ApiError(400, `Upload chunk ${index + 1} is incomplete`);
        }
        await output.write(chunk);
      }
    } finally {
      await output.close();
    }
    if ((await fs.stat(asset.stagedPath)).size !== asset.uploadSize) {
      throw new ApiError(400, "Assembled upload size does not match the original file");
    }
    stagedFile = {
      path: asset.stagedPath,
      originalname: asset.originalName,
      mimetype: asset.detectedMimeType,
    };
    await fs.rm(asset.chunkDirectory, { recursive: true, force: true });
    asset.chunkDirectory = undefined;
    await asset.save();
  } catch (error) {
    asset.status = "receiving";
    await asset.save();
    throw error;
  }
  return queueReceivedMedia(req, res, stagedFile, asset);
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
  
  res.set("Cache-Control", "no-store");
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
  
  asset.status = "queued";
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
    .select("-sha256 -fingerprints -fingerprintBands -stagedPath -chunkDirectory -chunkHashes -pendingCloudinaryPublicId")
    .sort({ createdAt: -1 })
    .limit(50);
    
  return sendResponse(res, 200, "Your media uploads", { uploads });
});

export { mimeToKind };