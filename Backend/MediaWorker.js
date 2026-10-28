import "./config/env.js";
import mongoose from "mongoose";
import IORedis from "ioredis";
import { Worker } from "bullmq";
import { DB_NAME } from "./Constents.js";
import { MEDIA_QUEUE_NAME } from "./services/mediaQueue.js";
import MediaAsset from "./models/MediaAsset.js";
import { mediaConfig } from "./config/media.js";
import {
  deleteStagedAsset,
  failMediaAsset,
  processMediaAsset,
} from "./services/mediaProcessingService.js";
import { deleteCloudinaryAsset } from "./services/cloudinaryService.js";

if (!process.env.DB_URL) throw new Error("DB_URL is required by the media worker");
if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required by the media worker");

await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`);
console.log(`✅ Media worker connected to MongoDB (${mongoose.connection.host})`);

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

// Remove staged files when moderator review has expired or an upload was orphaned.
async function cleanExpiredMedia() {
  const now = new Date();
  const expiredReviews = await MediaAsset.find({
    status: "review_required",
    expiresAt: { $lte: now },
  }).select("+stagedPath");
  for (const asset of expiredReviews) {
    await deleteStagedAsset(asset);
    await asset.deleteOne();
  }

  const orphanedUploads = await MediaAsset.find({
    status: { $in: ["receiving", "queued"] },
    createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  }).select("+stagedPath +sha256");
  for (const asset of orphanedUploads) {
    await deleteStagedAsset(asset);
    asset.status = "failed";
    asset.sha256 = undefined;
    asset.stagedPath = undefined;
    asset.failureReason = "Upload queue was not available before the staging lease expired";
    await asset.save();
  }

  // Deterministic storage IDs let permanent failures remove objects left by interrupted DB writes.
  const failedWithCloudId = await MediaAsset.find({
    status: "failed",
    pendingCloudinaryPublicId: { $exists: true, $ne: null },
  }).select("+pendingCloudinaryPublicId");
  for (const asset of failedWithCloudId) {
    await deleteCloudinaryAsset(asset.pendingCloudinaryPublicId, asset.mediaType);
    asset.pendingCloudinaryPublicId = null;
    await asset.save();
  }
}

await cleanExpiredMedia();
const cleanupTimer = setInterval(() => {
  cleanExpiredMedia().catch((error) => console.error("Media cleanup failed", error));
}, 10 * 60 * 1000);
cleanupTimer.unref();

async function shutdown(signal) {
  console.log(`Received ${signal}; stopping media worker`);
  clearInterval(cleanupTimer);
  await worker.close();
  await connection.quit();
  await mongoose.disconnect();
  process.exit(0);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
