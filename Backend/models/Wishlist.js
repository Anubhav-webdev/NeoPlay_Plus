import mongoose from "mongoose";

// A separate collection keeps saved items independent from content likes.
const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
    },
  },
  { timestamps: true }
);

wishlistSchema.index({ userId: 1, contentId: 1 }, { unique: true });

export default mongoose.model("Wishlist", wishlistSchema);
