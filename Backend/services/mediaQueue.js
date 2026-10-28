import { Queue } from "bullmq";
import IORedis from "ioredis";

export const MEDIA_QUEUE_NAME = "neoplay-media-processing";
let queue;
let redis;

export function getMediaQueue() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is required for media processing");
  }
  if (!queue) {
    redis = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
    queue = new Queue(MEDIA_QUEUE_NAME, { connection: redis });
  }
  return queue;
}

export async function enqueueMediaProcessing(assetId, options = {}) {
  const mediaQueue = getMediaQueue();
  return mediaQueue.add(
    "process-upload",
    { assetId: String(assetId), ...options },
    {
      jobId: `${assetId}-${Date.now()}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 7 * 24 * 60 * 60, count: 1000 },
      removeOnFail: { age: 30 * 24 * 60 * 60, count: 5000 },
    },
  );
}

export async function closeMediaQueue() {
  await queue?.close();
  await redis?.quit();
  queue = undefined;
  redis = undefined;
}
