import os from "node:os";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

function positiveNumber(value, fallback, name) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return number;
}

export const mediaConfig = {
  maxBytes: positiveNumber(process.env.MEDIA_MAX_UPLOAD_MB, 100, "MEDIA_MAX_UPLOAD_MB") * 1024 * 1024,
  maxImagePixels: positiveNumber(process.env.MEDIA_MAX_IMAGE_PIXELS, 40_000_000, "MEDIA_MAX_IMAGE_PIXELS"),
  maxVideoDurationSeconds: positiveNumber(process.env.MEDIA_MAX_VIDEO_SECONDS, 3600, "MEDIA_MAX_VIDEO_SECONDS"),
  videoSampleCount: Math.min(48, Math.max(8, Number(process.env.MEDIA_VIDEO_SAMPLE_COUNT) || 24)),
  videoFrameDistance: Math.min(32, Math.max(1, Number(process.env.MEDIA_VIDEO_FRAME_DISTANCE) || 12)),
  imageBlockThreshold: Number(process.env.MEDIA_IMAGE_BLOCK_THRESHOLD ?? 0.98),
  imageReviewThreshold: Number(process.env.MEDIA_IMAGE_REVIEW_THRESHOLD ?? 0.88),
  videoBlockThreshold: Number(process.env.MEDIA_VIDEO_BLOCK_THRESHOLD ?? 0.92),
  videoReviewThreshold: Number(process.env.MEDIA_VIDEO_REVIEW_THRESHOLD ?? 0.65),
  candidateLimit: Math.min(1000, Math.max(10, Number(process.env.MEDIA_CANDIDATE_LIMIT) || 200)),
  reviewRetentionHours: positiveNumber(process.env.MEDIA_REVIEW_RETENTION_HOURS, 24, "MEDIA_REVIEW_RETENTION_HOURS"),
  tempDir: path.resolve(process.env.MEDIA_TEMP_DIR || path.join(os.tmpdir(), "neoplay-media")),
  maxProcessingSeconds: positiveNumber(process.env.MEDIA_PROCESS_TIMEOUT_SECONDS, 180, "MEDIA_PROCESS_TIMEOUT_SECONDS"),
  maxUploadAttemptsPerHour: Math.min(100, Math.max(1, Number(process.env.MEDIA_UPLOADS_PER_HOUR) || 8)),
  ffmpegPath: process.env.FFMPEG_PATH || ffmpegStatic,
  ffprobePath: process.env.FFPROBE_PATH || ffprobeStatic.path,
};

for (const [name, value] of [
  ["MEDIA_IMAGE_BLOCK_THRESHOLD", mediaConfig.imageBlockThreshold],
  ["MEDIA_IMAGE_REVIEW_THRESHOLD", mediaConfig.imageReviewThreshold],
  ["MEDIA_VIDEO_BLOCK_THRESHOLD", mediaConfig.videoBlockThreshold],
  ["MEDIA_VIDEO_REVIEW_THRESHOLD", mediaConfig.videoReviewThreshold],
]) {
  if (value < 0 || value > 1) throw new Error(`${name} must be between 0 and 1`);
}
if (mediaConfig.imageReviewThreshold > mediaConfig.imageBlockThreshold) {
  throw new Error("MEDIA_IMAGE_REVIEW_THRESHOLD cannot exceed the block threshold");
}
if (mediaConfig.videoReviewThreshold > mediaConfig.videoBlockThreshold) {
  throw new Error("MEDIA_VIDEO_REVIEW_THRESHOLD cannot exceed the block threshold");
}
