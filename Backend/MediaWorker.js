import "./config/env.js";
import mongoose from "mongoose";
import IORedis from "ioredis";
import { Worker } from "bullmq";
import { DB_NAME } from "./Constents.js";
import { MEDIA_QUEUE_NAME } from "./services/mediaQueue.js";
import MediaAsset from "./models/MediaAsset.js";
import MediaDuplicateEvent from "./models/MediaDuplicateEvent.js";
import { mediaConfig } from "./config/media.js";
import {
  deleteStagedAsset,
  failMediaAsset,
  processMediaAsset,
} from "./services/mediaProcessingService.js";
import { deleteCloudinaryAsset } from "./services/cloudinaryService.js";
import { removeOrphanedTempFiles } from "./services/mediaTempCleanup.js";
import {
  initializeContentDeletionStorage,
  processNextContentDeletion,
  releaseCompletedDeletionLocks,
} from "./services/contentDeletionService.js";

if (!process.env.DB_URL) throw new Error("DB_URL is required by the media worker");
if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required by the media worker");

await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`);
console.log(`✅ Media worker connected to MongoDB (${mongoose.connection.host})`);
await initializeContentDeletionStorage();

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});
const worker = new Worker(
  MEDIA_QUEUE_NAME,
  async (job) => processMediaAsset(job.data.assetId, job.data),
  {
    connection,
    concurrency: Math.max(1, Math.min(4, Number(process.env.MEDIA_WORKER_CONCURRENCY) || 2)),
    lockDuration: (mediaConfig.maxProcessingSeconds + 60) * 1000,
    stalledInterval: 60_000,
    maxStalledCount: 1,
  },
);

worker.on("completed", (job, asset) => {
  console.log("Media job completed", {
    jobId: job.id,
    assetId: asset.id,
    status: asset.status,
  });
});

worker.on("failed", async (job, error) => {
  console.error("Media job attempt failed", {
    jobId: job?.id,
    assetId: job?.data?.assetId,
    attemptsMade: job?.attemptsMade,
    error,
  });
  if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
    try {
      await failMediaAsset(job.data.assetId, error);
    } catch (failureError) {
      console.error("Could not persist final media failure", failureError);
    }
  }
});

worker.on("error", (error) => {
  console.error("Media worker runtime error", error);
});

// Remove staged files when moderator review has expired or an upload has aged out.
async function cleanExpiredMedia() {
  const now = new Date();
  const expiredReviews = await MediaAsset.find({
    status: "review_required",
    expiresAt: { $lte: now },
  }).select("+stagedPath +chunkDirectory");
  for (const asset of expiredReviews) {
    await deleteStagedAsset(asset);
    await asset.deleteOne();
  }

  const uploadCutoff = new Date(now.getTime() - mediaConfig.uploadMaxAgeMs);
  const expiredUploads = await MediaAsset.find({
    status: {
      $in: ["receiving", "queued", "checking", "processing", "failed"],
    },
    createdAt: { $lte: uploadCutoff },
  }).select("+stagedPath +chunkDirectory +pendingCloudinaryPublicId");
  for (const asset of expiredUploads) {
    try {
      await deleteStagedAsset(asset);
      const publicId =
        asset.pendingCloudinaryPublicId ||
        asset.publicId ||
        `neoplay/media/${asset.ownerId}/${asset._id}`;
      if (
        asset.pendingCloudinaryPublicId ||
        asset.publicId ||
        asset.status === "processing"
      ) {
        await deleteCloudinaryAsset(publicId, asset.mediaType);
      }
      await MediaDuplicateEvent.updateMany(
        {
          $or: [
            { uploadAssetId: asset._id },
            { matchAssetId: asset._id },
          ],
        },
        { $unset: { uploadAssetId: 1, matchAssetId: 1 } },
      );
      await MediaAsset.deleteOne({
        _id: asset._id,
        status: asset.status,
        createdAt: { $lte: uploadCutoff },
      });
    } catch (error) {
      console.error("Could not permanently delete expired media upload", {
        assetId: asset.id,
        error,
      });
    }
  }

  const stagedAssets = await MediaAsset.find({
    stagedPath: { $exists: true, $ne: null },
  })
    .select("+stagedPath +chunkDirectory")
    .lean();
  const removedFiles = await removeOrphanedTempFiles(
    mediaConfig.tempDir,
    stagedAssets.flatMap((asset) =>
      [asset.stagedPath, asset.chunkDirectory].filter(Boolean),
    ),
    Date.now() - Math.max(60 * 60 * 1000, mediaConfig.maxProcessingSeconds * 2000),
  );
  if (removedFiles) {
    console.log("Removed orphaned temporary media entries", { count: removedFiles });
  }
}

await cleanExpiredMedia();
const cleanupTimer = setInterval(() => {
  cleanExpiredMedia().catch((error) => console.error("Media cleanup failed", error));
}, 10 * 60 * 1000);
cleanupTimer.unref();

let contentDeletionSweepRunning = false;
async function processContentDeletions() {
  if (contentDeletionSweepRunning) return;
  contentDeletionSweepRunning = true;
  try {
    await releaseCompletedDeletionLocks();
    for (let count = 0; count < 5; count += 1) {
      try {
        if (!(await processNextContentDeletion())) break;
      } catch (error) {
        console.error("Content deletion cleanup will be retried", error);
        break;
      }
    }
  } catch (error) {
    console.error("Content deletion worker sweep failed", error);
  } finally {
    contentDeletionSweepRunning = false;
  }
}

await processContentDeletions();
const contentDeletionTimer = setInterval(() => {
  processContentDeletions().catch((error) =>
    console.error("Content deletion worker failed", error),
  );
}, 10_000);
contentDeletionTimer.unref();

async function shutdown(signal) {
  console.log(`Received ${signal}; stopping media worker`);
  clearInterval(cleanupTimer);
  clearInterval(contentDeletionTimer);
  await worker.close();
  await connection.quit();
  await mongoose.disconnect();
  process.exit(0);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
