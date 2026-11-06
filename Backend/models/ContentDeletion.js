import mongoose from "mongoose";

const deletionTargetSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "video"], required: true },
    secureUrl: { type: String, default: null },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaAsset",
      default: null,
    },
  },
  { _id: false },
);

const contentDeletionSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "retrying", "completed"],
      default: "queued",
      index: true,
    },
    targets: { type: [deletionTargetSchema], default: [] },
    deletableAssetIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "MediaAsset" }],
      default: [],
    },
    commentIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
      default: [],
    },
    lockKeys: { type: [String], default: [] },
    attempts: { type: Number, default: 0, min: 0 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    leaseUntil: { type: Date, default: null },
    workerToken: { type: String, default: null },
    lastError: { type: String, default: null, maxlength: 1000 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

contentDeletionSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });
contentDeletionSchema.index({ status: 1, leaseUntil: 1 });

export default mongoose.model("ContentDeletion", contentDeletionSchema);
