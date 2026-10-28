import mongoose from "mongoose";

const mediaAssetSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Creator",
      required: true,
      index: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "receiving",
        "checking",
        "processing",
        "ready",
        "review_required",
        "duplicate",
        "failed",
      ],
      default: "receiving",
      index: true,
    },
    sha256: { type: String, select: false },
    fingerprintVersion: { type: Number, default: 1 },
    fingerprints: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      select: false,
    },
    fingerprintBands: { type: [String], default: [], select: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    originalName: { type: String, required: true, maxlength: 255 },
    detectedMimeType: { type: String },
    stagedPath: { type: String, select: false },
    publicId: { type: String, default: null },
    pendingCloudinaryPublicId: { type: String, default: null, select: false },
    resourceType: { type: String, enum: ["image", "video"], default: null },
    secureUrl: { type: String, default: null },
    format: { type: String, default: null },
    duplicateDecision: {
      outcome: {
        type: String,
        enum: ["allow", "review", "block"],
        default: "allow",
      },
      reason: { type: String, default: "No matching fingerprint found" },
      matchAssetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
        default: null,
      },
      method: { type: String, default: null },
      score: { type: Number, min: 0, max: 1, default: null },
      decidedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
    },
    failureReason: { type: String, default: null, maxlength: 1000 },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// The unique hash reservation makes exact-match checks safe under concurrent uploads.
mediaAssetSchema.index(
  { sha256: 1 },
  {
    unique: true,
    partialFilterExpression: { sha256: { $type: "string" } },
  },
);
mediaAssetSchema.index({ status: 1, mediaType: 1, createdAt: -1 });
mediaAssetSchema.index({ fingerprintBands: 1, status: 1, mediaType: 1 });
// The worker must remove staged files before expiring review documents.
mediaAssetSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model("MediaAsset", mediaAssetSchema);
