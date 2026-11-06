import mongoose from "mongoose";

const contentDeletionLockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("ContentDeletionLock", contentDeletionLockSchema);
