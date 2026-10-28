import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import ApiError from "../utils/ApiError.js";

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || "7d";

function getSecret(name) {
  const secret = process.env[name];
  if (!secret || secret.length < 32) {
    throw new ApiError(
      500,
      `${name} must be configured with at least 32 characters`
    );
  }
  return secret;
}

export function assertAuthConfig() {
  getSecret("ACCESS_TOKEN_SECRET");
  getSecret("REFRESH_TOKEN_SECRET");
}

export function hashRefreshToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    getSecret("ACCESS_TOKEN_SECRET"),
    { expiresIn: ACCESS_TTL }
  );
}

export function createRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: "refresh" },
    getSecret("REFRESH_TOKEN_SECRET"),
    { expiresIn: REFRESH_TTL }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getSecret("ACCESS_TOKEN_SECRET"));
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, getSecret("REFRESH_TOKEN_SECRET"));
}
