import multer from "multer";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import ApiError from "../scripts/utils/ApiError.js";
import { mediaConfig } from "../config/media.js";

const storage = multer.diskStorage({
  destination: async (req, file, callback) => {
    try {
      await fs.mkdir(mediaConfig.tempDir, { recursive: true });
      callback(null, mediaConfig.tempDir);
    } catch (error) {
      callback(error);
    }
  },
  filename: (req, file, callback) => {
    callback(null, `${randomUUID()}.upload`);
  },
});

const parser = multer({
  storage,
  limits: {
    fileSize: mediaConfig.maxBytes,
    files: 1,
    fields: 10,
    parts: 11,
    fieldNameSize: 100,
    fieldSize: 16 * 1024,
  },
});

// Upload metadata is untrusted; the route verifies file signatures after parsing.
export const receiveMediaFile = parser.single("file");

export function requireReceivedMedia(req, res, next) {
  if (!req.file) return next(new ApiError(400, "A file field named 'file' is required"));
  next();
}
