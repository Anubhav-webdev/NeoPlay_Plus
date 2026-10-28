import User from "../models/users.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import {
  createAccessToken,
  createRefreshToken,
  hashPassword,
  hashRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from "../services/authService.js";

const refreshCookieName = "neoplay_refresh";
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function publicUser(user) {
  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phoneNumber,
    role: user.role,
    isVerified: user.isVerified,
  };
}

async function issueTokens(user, res) {
  const refreshToken = createRefreshToken(user);
  user.refreshTokenHash = hashRefreshToken(refreshToken);
  await user.save();
  res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);
  return createAccessToken(user);
}

// Signup accepts the current frontend's username/phone field names.
export const signup = asyncHandler(async (req, res) => {
  const { username, email, phone, phoneNumber, password } = req.body;
  const name = String(req.body.name || username || "").trim();
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const normalizedUsername = String(username || "")
    .trim()
    .toLowerCase();
  const normalizedPhone = String(phoneNumber || phone || "").trim();

  if (name.length < 2 || name.length > 100) {
    throw new ApiError(400, "Name must be between 2 and 100 characters");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new ApiError(400, "A valid email is required");
  }
  if (!/^\+?[0-9]{7,15}$/.test(normalizedPhone)) {
    throw new ApiError(400, "Phone must contain 7 to 15 digits");
  }
  if (normalizedUsername && !/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
    throw new ApiError(
      400,
      "Username must be 3-30 letters, numbers, or underscores"
    );
  }
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new ApiError(400, "Password must be between 8 and 128 characters");
  }

  const duplicate = await User.findOne({
    $or: [
      { email: normalizedEmail },
      { phoneNumber: normalizedPhone },
      ...(normalizedUsername ? [{ username: normalizedUsername }] : []),
    ],
  });
  if (duplicate)
    throw new ApiError(409, "Email, phone, or username is already registered");

  const user = await User.create({
    name,
    username: normalizedUsername || undefined,
    email: normalizedEmail,
    phoneNumber: normalizedPhone,
    passwordHash: await hashPassword(password),
  });
  const accessToken = await issueTokens(user, res);
  return res.status(201).json({
    success: true,
    message: "Account created",
    user: publicUser(user),
    accessToken,
  });
});

// Login accepts email or username as the frontend identifier.
export const login = asyncHandler(async (req, res) => {
  const identifier = String(
    req.body.identifier || req.body.email || req.body.username || ""
  )
    .trim()
    .toLowerCase();
  const { password } = req.body;
  if (!identifier || typeof password !== "string" || password.length > 128) {
    throw new ApiError(400, "Identifier and password are required");
  }
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select("+passwordHash");
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email/username or password");
  }

  const accessToken = await issueTokens(user, res);
  return res.status(200).json({
    success: true,
    message: "Login successful",
    user: publicUser(user),
    accessToken,
  });
});

// Rotate the one active refresh token for this account.
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[refreshCookieName];
  if (!token) throw new ApiError(401, "Refresh token is required");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
  if (payload.type !== "refresh")
    throw new ApiError(401, "Invalid refresh token");
  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user || user.refreshTokenHash !== hashRefreshToken(token)) {
    throw new ApiError(401, "Refresh token has been revoked");
  }

  const accessToken = await issueTokens(user, res);
  return sendResponse(res, 200, "Token refreshed", {
    user: publicUser(user),
    accessToken,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[refreshCookieName];
  if (token) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      // An expired token is already unusable; clearing its cookie completes logout.
    }
    if (payload?.type === "refresh") {
      await User.findByIdAndUpdate(payload.sub, {
        $unset: { refreshTokenHash: 1 },
      });
    }
  }
  const { maxAge, ...clearOptions } = refreshCookieOptions;
  res.clearCookie(refreshCookieName, clearOptions);
  return sendResponse(res, 200, "Logged out");
});

export const me = asyncHandler(async (req, res) =>
  sendResponse(res, 200, "Current user", { user: publicUser(req.user) })
);
