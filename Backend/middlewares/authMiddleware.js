import User from "../models/users.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../services/authService.js";

// Verify the bearer access token and load the current role from the database.
export const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.get("authorization") || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Authentication required");
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const user = await User.findById(payload.sub).select(
    "_id name username email phoneNumber role isVerified"
  );
  if (!user) throw new ApiError(401, "Account no longer exists");
  req.user = user;
  next();
});

export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.get("authorization") || "").split(" ");
  if (scheme === "Bearer" && token) {
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new ApiError(401, "Invalid or expired access token");
    }
    const user = await User.findById(payload.sub).select(
      "_id name username email phoneNumber role isVerified"
    );
    if (!user) throw new ApiError(401, "Account no longer exists");
    req.user = user;
  }
  next();
});
