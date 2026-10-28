import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

likeSchema.index(
  {
    userId: 1,
    contentId: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model("Like", likeSchema);
