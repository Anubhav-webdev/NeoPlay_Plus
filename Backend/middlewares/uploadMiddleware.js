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

const profileImageParser = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 1,
    fieldNameSize: 100,
  },
});

function receiveSingleFile(uploadParser, maxBytes) {
  const parseFile = uploadParser.single("file");
  return (req, res, next) => {
    parseFile(req, res, (error) => {
      if (!error) return next();
      const isMulterError = error instanceof multer.MulterError;
      const statusCode = isMulterError
        ? error.code === "LIMIT_FILE_SIZE" ? 413 : 400
        : undefined;
      const message = isMulterError
        ? error.code === "LIMIT_FILE_SIZE"
          ? "File exceeds the " + Math.round(maxBytes / (1024 * 1024)) + " MB upload limit"
          : "Invalid multipart upload"
        : undefined;
      if (req.file?.path) {
        fs.rm(req.file.path, { force: true }).catch(() => {});
      }
      if (statusCode) return next(new ApiError(statusCode, message));
      return next(error);
    });
  };
}

// Upload metadata is untrusted; the route verifies file signatures after parsing.
export const receiveMediaFile = receiveSingleFile(parser, mediaConfig.maxBytes);
export const receiveProfileImageFile = receiveSingleFile(
  profileImageParser,
  5 * 1024 * 1024,
);

export function requireReceivedMedia(req, res, next) {
  if (!req.file) return next(new ApiError(400, "A file field named 'file' is required"));
  next();
}
