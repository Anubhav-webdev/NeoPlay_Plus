import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import MediaAsset from "../models/MediaAsset.js";
import MediaDuplicateEvent from "../models/MediaDuplicateEvent.js";
import { mediaConfig } from "../config/media.js";
import {
  decideSimilarity,
  fingerprintBands,
  fingerprintImage,
  fingerprintVideo,
  imageSimilarity,
  probeVideo,
  validateMediaType,
  videoSimilarity,
} from "./mediaFingerprint.js";
import { deleteCloudinaryAsset, uploadFile } from "./cloudinaryService.js";

export function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function sanitizedFileName(name) {
  return path
    .basename(String(name || "upload"))
    .replace(/[^\w.-]/g, "_")
    .slice(-255);
}

async function inspectImage(filePath) {
  const metadata = await sharp(filePath, {
    limitInputPixels: mediaConfig.maxImagePixels,
    failOn: "error",
  }).metadata();
  const width = Number(metadata.width);
  const height = Number(metadata.height);
  if (
    !["jpeg", "png", "webp"].includes(metadata.format) ||
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width * height > mediaConfig.maxImagePixels
  ) {
    throw new Error("Image format or dimensions are unsupported");
  }
  return {
    width,
    height,
    format: metadata.format,
    hasAlpha: Boolean(metadata.hasAlpha),
    pages: metadata.pages || 1,
  };
}

async function findBestMatch(asset, fingerprints, bands) {
  const candidates = await MediaAsset.aggregate([
    {
      $match: {
        _id: { $ne: asset._id },
        status: "ready",
        mediaType: asset.mediaType,
        fingerprintBands: { $in: bands },
      },
    },
    {
      $addFields: {
        _bandMatches: {
          $size: {
            $setIntersection: ["$fingerprintBands", bands],
          },
        },
      },
    },
    { $sort: { _bandMatches: -1, createdAt: -1 } },
    { $limit: mediaConfig.candidateLimit },
    { $project: { _bandMatches: 0 } },
  ]);

  let bestMatch = null;
  for (const candidate of candidates) {
    const score =
      asset.mediaType === "image"
        ? imageSimilarity(fingerprints, candidate.fingerprints)
        : videoSimilarity(fingerprints, candidate.fingerprints);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { asset: candidate, score };
    }
  }
  return bestMatch;
}

async function convertImage(sourcePath, assetId) {
  await fs.mkdir(mediaConfig.tempDir, { recursive: true });
  const targetPath = path.join(
    mediaConfig.tempDir,
    `${assetId}-${randomUUID()}.webp`
  );
  await sharp(sourcePath, {
    limitInputPixels: mediaConfig.maxImagePixels,
    failOn: "error",
  })
    .rotate()
    .webp({ quality: 88, effort: 4 })
    .toFile(targetPath);
  return { path: targetPath, format: "webp", resourceType: "image" };
}

async function transcodeVideo(sourcePath, assetId) {
  await fs.mkdir(mediaConfig.tempDir, { recursive: true });
  const targetPath = path.join(
    mediaConfig.tempDir,
    `${assetId}-${randomUUID()}.mp4`
  );
  const { spawn } = await import("node:child_process");
  await new Promise((resolve, reject) => {
    const child = spawn(
      mediaConfig.ffmpegPath,
      [
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        sourcePath,
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:v",
        "libx264",
        "-preset",
        process.env.MEDIA_VIDEO_PRESET || "veryfast",
        "-crf",
        process.env.MEDIA_VIDEO_CRF || "28",
        "-threads",
        "2",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-y",
        targetPath,
      ],
      { stdio: ["ignore", "ignore", "pipe"], windowsHide: true }
    );
    let stderr = "";
    const timer = setTimeout(
      () => child.kill("SIGKILL"),
      mediaConfig.maxProcessingSeconds * 1000
    );
    child.stderr.on("data", (chunk) => {
      if (stderr.length < 8000) stderr += chunk.toString();
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(
          new Error(`FFmpeg video processing failed: ${stderr.slice(0, 1000)}`)
        );
      } else resolve();
    });
  });
  return { path: targetPath, format: "mp4", resourceType: "video" };
}

async function markDuplicate(asset, match, outcome, reason, method) {
  const now = new Date();
  await MediaDuplicateEvent.findOneAndUpdate(
    { uploadAssetId: asset._id },
    {
      $setOnInsert: {
        ownerId: asset.ownerId,
        uploadAssetId: asset._id,
        mediaType: asset.mediaType,
        sha256: asset.sha256,
        matchAssetId: match.asset._id,
        score: match.score,
        method,
        outcome,
        reason,
      },
    },
    { upsert: true }
  );

  asset.duplicateDecision = {
    outcome,
    reason,
    matchAssetId: match.asset._id,
    method,
    score: match.score,
    decidedAt: now,
  };
  if (outcome === "block") {
    asset.status = "duplicate";
    asset.failureReason = reason;
    asset.sha256 = undefined;
    asset.stagedPath = undefined;
  } else {
    asset.status = "review_required";
    asset.expiresAt = new Date(
      Date.now() + mediaConfig.reviewRetentionHours * 60 * 60 * 1000
    );
  }
  await asset.save();
}

// Runs inside a BullMQ worker: expensive probes and transcodes never block API traffic.
export async function processMediaAsset(
  assetId,
  { bypassSimilarity = false } = {}
) {
  const asset = await MediaAsset.findById(assetId).select(
    "+sha256 +stagedPath"
  );
  if (!asset) throw new Error(`Media asset ${assetId} no longer exists`);
  if (asset.status === "ready") return asset;
  if (!asset.stagedPath)
    throw new Error("Staged upload file is no longer available");

  const stagedPath = asset.stagedPath;
  let convertedPath;
  let cloudinaryPublicId;
  try {
    asset.status = "checking";
    asset.failureReason = null;
    await asset.save();

    const actualHash = await hashFile(stagedPath);
    if (actualHash !== asset.sha256)
      throw new Error("Staged media changed after upload");

    const fileType = await (
      await import("file-type")
    ).fileTypeFromFile(stagedPath);
    if (
      !fileType ||
      !validateMediaType(fileType.mime, asset.originalName, asset.mediaType) ||
      !validateMediaType(
        fileType.mime,
        `upload.${fileType.ext}`,
        asset.mediaType
      )
    ) {
      throw new Error("File contents, media type, and extension do not match");
    }
    if (asset.detectedMimeType !== fileType.mime) {
      throw new Error("Declared MIME type does not match file contents");
    }

    let metadata;
    let fingerprints;
    if (asset.mediaType === "image") {
      metadata = await inspectImage(stagedPath);
      fingerprints = await fingerprintImage(stagedPath);
    } else {
      metadata = await probeVideo(stagedPath);
      fingerprints = await fingerprintVideo(stagedPath, metadata);
    }

    const bands = fingerprintBands(fingerprints);
    asset.metadata = metadata;
    asset.fingerprints = fingerprints;
    asset.fingerprintBands = bands;
    asset.fingerprintVersion = 1;

    if (!bypassSimilarity) {
      const match = await findBestMatch(asset, fingerprints, bands);
      if (match) {
        const decision = decideSimilarity(asset.mediaType, match.score);
        if (decision !== "allow") {
          const method =
            asset.mediaType === "image"
              ? "sha256+crop-resistant-phash"
              : "sha256+temporal-phash-sequence";
          const reason =
            decision === "block"
              ? "High-confidence perceptual match; permanent storage was not used"
              : "Possible perceptual match requires moderator review";
          await markDuplicate(asset, match, decision, reason, method);
          if (decision === "block") {
            await fs.rm(stagedPath, { force: true });
            return asset;
          }
          return asset;
        }
      }
      asset.duplicateDecision = {
        outcome: "allow",
        reason: "No match met the configured review threshold",
        matchAssetId: null,
        method:
          asset.mediaType === "image"
            ? "crop-resistant-phash"
            : "temporal-phash-sequence",
        score: match?.score ?? null,
        decidedAt: new Date(),
      };
    } else {
      asset.duplicateDecision = {
        ...asset.duplicateDecision.toObject?.(),
        outcome: "allow",
        reason: "Approved by moderator after duplicate review",
        reviewedAt: asset.duplicateDecision.reviewedAt || new Date(),
      };
    }

    asset.status = "processing";
    await asset.save();
    const converted =
      asset.mediaType === "image"
        ? await convertImage(stagedPath, asset.id)
        : await transcodeVideo(stagedPath, asset.id);
    convertedPath = converted.path;

    const expectedPublicId = `${asset.ownerId}/${asset.id}`;
    const cloudinaryResult = await uploadFile(converted.path, {
      folder: "neoplay/media",
      publicId: expectedPublicId,
      resourceType: converted.resourceType,
    });
    cloudinaryPublicId = cloudinaryResult.public_id;
    asset.pendingCloudinaryPublicId = cloudinaryPublicId;
    await asset.save();

    asset.status = "ready";
    asset.secureUrl = cloudinaryResult.secure_url;
    asset.publicId = cloudinaryPublicId;
    asset.resourceType = converted.resourceType;
    asset.format = cloudinaryResult.format || converted.format;
    asset.metadata = {
      ...asset.metadata,
      storedBytes: cloudinaryResult.bytes,
    };
    asset.pendingCloudinaryPublicId = null;
    asset.stagedPath = undefined;
    asset.expiresAt = null;
    await asset.save();
    await fs.rm(stagedPath, { force: true });
    return asset;
  } catch (error) {
    // Retries reuse the deterministic Cloudinary ID; remove only files created locally.
    if (cloudinaryPublicId && error.name === "ValidationError") {
      try {
        await deleteCloudinaryAsset(cloudinaryPublicId, asset.mediaType);
      } catch (cleanupError) {
        console.error("Cloudinary compensation failed", {
          assetId,
          publicId: cloudinaryPublicId,
          cleanupError,
        });
      }
    }
    throw error;
  } finally {
    if (convertedPath) await fs.rm(convertedPath, { force: true });
  }
}

export async function failMediaAsset(assetId, error) {
  const asset = await MediaAsset.findById(assetId).select(
    "+sha256 +stagedPath +pendingCloudinaryPublicId"
  );
  if (!asset) return;

  const cloudinaryPublicId =
    asset.pendingCloudinaryPublicId ||
    `neoplay/media/${asset.ownerId}/${asset._id}`;
  if (cloudinaryPublicId) {
    try {
      await deleteCloudinaryAsset(cloudinaryPublicId, asset.mediaType);
    } catch (cleanupError) {
      console.error("Cloudinary orphan cleanup failed", {
        assetId,
        publicId: cloudinaryPublicId,
        cleanupError,
      });
    }
  }
  if (asset.stagedPath) await fs.rm(asset.stagedPath, { force: true });
  asset.status = "failed";
  asset.failureReason = String(
    error?.message || "Media processing failed"
  ).slice(0, 1000);
  asset.sha256 = undefined;
  asset.stagedPath = undefined;
  asset.pendingCloudinaryPublicId = null;
  asset.expiresAt = null;
  await asset.save();
}

export async function deleteStagedAsset(asset) {
  if (asset.stagedPath) await fs.rm(asset.stagedPath, { force: true });
}

export function safeOriginalName(name) {
  return sanitizedFileName(name);
}
