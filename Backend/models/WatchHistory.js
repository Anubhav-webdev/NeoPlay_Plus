import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
    },

    watchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

watchHistorySchema.index(
  {
    userId: 1,
    contentId: 1,
  },
  {
    unique: true,
  }
);

watchHistorySchema.index({
  userId: 1,
  watchedAt: -1,
});

export default mongoose.model("WatchHistory", watchHistorySchema);
