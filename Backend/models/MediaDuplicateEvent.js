import mongoose from "mongoose";

// Audit each duplicate decision without making duplicate hashes collide with assets.
const mediaDuplicateEventSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaAsset",
      default: undefined,
    },
    mediaType: { type: String, enum: ["image", "video"], required: true },
    sha256: { type: String, required: true, index: true },
    matchAssetId: { type: mongoose.Schema.Types.ObjectId, ref: "MediaAsset" },
    score: { type: Number, min: 0, max: 1, default: 1 },
    method: { type: String, required: true },
    outcome: {
      type: String,
      enum: ["block", "review"],
      required: true,
    },
    reason: { type: String, required: true, maxlength: 1000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewDecision: { type: String, enum: ["approve", "reject"] },
  },
  { timestamps: true },
);

mediaDuplicateEventSchema.index({ ownerId: 1, createdAt: -1 });
mediaDuplicateEventSchema.index(
  { uploadAssetId: 1 },
  { unique: true, sparse: true },
);

export default mongoose.model("MediaDuplicateEvent", mediaDuplicateEventSchema);
