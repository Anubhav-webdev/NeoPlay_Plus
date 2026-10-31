import mongoose from "mongoose";

const creatorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    creatorId: {
      type: String,
      trim: true,
      lowercase: true,
      immutable: true,
      unique: true,
      sparse: true,
      match: /^[a-z0-9]{7,30}$/,
      maxlength: 30,
    },

    avatar: {
      type: String,
      default: null,
    },

    avatarPublicId: {
      type: String,
      default: null,
      select: false,
    },

    banner: {
      type: String,
      default: null,
    },

    bannerPublicId: {
      type: String,
      default: null,
      select: false,
    },

    tagline: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },

    about: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
      index: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    isMonetized: {
      type: Boolean,
      default: false,
    },

    stripeAccountId: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Creator", creatorSchema);
