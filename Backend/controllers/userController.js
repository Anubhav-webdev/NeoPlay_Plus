import User from "../models/users.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";

// User endpoints expose only profile fields, never password or token hashes.
export const getProfile = asyncHandler(async (req, res) =>
  sendResponse(res, 200, "Profile retrieved", { user: req.user })
);

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (name.length < 2 || name.length > 100) {
      throw new ApiError(400, "Name must be between 2 and 100 characters");
    }
    updates.name = name;
  }
  if (req.body.username !== undefined) {
    const username = String(req.body.username).trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      throw new ApiError(
        400,
        "Username must be 3-30 letters, numbers, or underscores"
      );
    }
    updates.username = username;
  }
  if (req.body.phone !== undefined || req.body.phoneNumber !== undefined) {
    const phone = String(req.body.phoneNumber || req.body.phone).trim();
    if (!/^\+?[0-9]{7,15}$/.test(phone)) {
      throw new ApiError(400, "Phone must contain 7 to 15 digits");
    }
    updates.phoneNumber = phone;
  }
  if (req.body.email !== undefined) {
    const email = String(req.body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "A valid email is required");
    }
    updates.email = email;
  }
  if (!Object.keys(updates).length)
    throw new ApiError(400, "No profile fields provided");

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
    select:
      "_id name username email phoneNumber role isVerified createdAt updatedAt",
  });
  return sendResponse(res, 200, "Profile updated", { user });
});
