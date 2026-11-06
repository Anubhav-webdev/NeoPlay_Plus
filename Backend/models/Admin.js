import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    nameEncrypted: { type: String, required: true, select: false },
    usernameEncrypted: { type: String, default: null, select: false },
    emailEncrypted: { type: String, required: true, select: false },
    phoneNumberEncrypted: { type: String, required: true, select: false },
    usernameLookup: { type: String, unique: true, sparse: true, select: false },
    emailLookup: { type: String, required: true, unique: true, select: false },
    phoneLookup: { type: String, required: true, unique: true, select: false },
    previousRole: {
      type: String,
      enum: ["user", "creator"],
      default: "user",
      select: false,
    },
    passwordHash: { type: String, required: true, select: false },
    refreshTokenHash: { type: String, select: false },
    avatar: { type: String, default: null },
    avatarPublicId: { type: String, default: null, select: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
