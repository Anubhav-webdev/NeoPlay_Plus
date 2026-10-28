import mongoose from "mongoose";

const playlistNoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, trim: true, maxlength: 5000, default: "" },
  },
  { timestamps: true },
);

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: { type: String, trim: true, maxlength: 2000, default: "" },

    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    notes: { type: [playlistNoteSchema], default: [] },

    contentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content",
      },
    ],
  },
  {
    timestamps: true,
  }
);

playlistSchema.index({
  userId: 1,
  createdAt: -1,
});

export default mongoose.model("Playlist", playlistSchema);
