import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
import Admin from "../models/Admin.js";
import Creator from "../models/Creator.js";
import User from "../models/users.js";
import { hashPassword } from "./authService.js";

function getEncryptionKey() {
  const value = process.env.ADMIN_DATA_ENCRYPTION_KEY || "";
  if (/^[\da-f]{64}$/i.test(value)) {
    return Buffer.from(value, "hex");
  }
  if (/^[A-Za-z0-9_-]{43}$/.test(value)) {
    const key = Buffer.from(value, "base64url");
    if (key.length === 32) return key;
  }
  if (/^[A-Za-z0-9+/]{43}=$/.test(value)) {
    const key = Buffer.from(value, "base64");
    if (key.length === 32) return key;
  }
  throw new Error(
    "ADMIN_DATA_ENCRYPTION_KEY must be a 32-byte key encoded as 64 hexadecimal characters or base64/base64url"
  );
}

function getLookupKey() {
  const value = process.env.ADMIN_LOOKUP_HMAC_KEY || "";
  if (value.length < 32) {
    throw new Error(
      "ADMIN_LOOKUP_HMAC_KEY must contain at least 32 characters"
    );
  }
  return value;
}

export function assertAdminDataConfig() {
  getEncryptionKey();
  getLookupKey();
}

export function normalizeAdminIdentifier(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function hashAdminIdentifier(value) {
  return createHmac("sha256", getLookupKey())
    .update(normalizeAdminIdentifier(value))
    .digest("hex");
}

export function encryptAdminValue(value) {
  if (value == null || value === "") return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), ciphertext]
    .map((part) => part.toString("base64"))
    .join(".");
}

export function decryptAdminValue(value) {
  if (!value) return null;
  const [iv, authTag, ciphertext] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

export function toAdminPrincipal(admin) {
  return {
    id: String(admin._id),
    _id: admin._id,
    name: decryptAdminValue(admin.nameEncrypted),
    username: decryptAdminValue(admin.usernameEncrypted),
    email: decryptAdminValue(admin.emailEncrypted),
    phoneNumber: decryptAdminValue(admin.phoneNumberEncrypted),
    role: "admin",
    avatar: admin.avatar || null,
    isVerified: admin.isVerified,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    isAdminAccount: true,
  };
}

function adminDataFromUser(user, previousRole) {
  const username = normalizeAdminIdentifier(user.username);
  const email = normalizeAdminIdentifier(user.email);
  const phoneNumber = normalizeAdminIdentifier(user.phoneNumber);
  return {
    _id: user._id,
    nameEncrypted: encryptAdminValue(user.name),
    ...(username
      ? {
          usernameEncrypted: encryptAdminValue(username),
          usernameLookup: hashAdminIdentifier(username),
        }
      : {}),
    emailEncrypted: encryptAdminValue(email),
    emailLookup: hashAdminIdentifier(email),
    phoneNumberEncrypted: encryptAdminValue(phoneNumber),
    phoneLookup: hashAdminIdentifier(phoneNumber),
    previousRole,
    passwordHash: user.passwordHash,
    refreshTokenHash: user.refreshTokenHash,
    avatar: user.avatar || null,
    avatarPublicId: user.avatarPublicId || null,
    isVerified: user.isVerified,
  };
}

async function anonymizeShadowUser(user) {
  const userId = String(user._id);
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        name: "Administrator",
        email: `admin-shadow-${userId}@invalid.local`,
        phoneNumber: `admin-shadow-${userId}`,
        passwordHash: await hashPassword(randomBytes(32).toString("hex")),
        avatar: null,
        role: "user",
        isVerified: false,
      },
      $unset: { username: 1, refreshTokenHash: 1, avatarPublicId: 1 },
    }
  );
}

export async function promoteUserToAdmin(userId) {
  const currentAdmin = await Admin.findById(userId).select(
    "+nameEncrypted +usernameEncrypted +emailEncrypted +phoneNumberEncrypted"
  );
  if (currentAdmin) {
    const shadowEmail = `admin-shadow-${String(userId)}@invalid.local`;
    const existingUser = await User.findById(userId).select("email");
    if (existingUser && existingUser.email !== shadowEmail) {
      await anonymizeShadowUser(existingUser);
    }
    return toAdminPrincipal(currentAdmin);
  }

  const user = await User.findById(userId).select(
    "+passwordHash +refreshTokenHash +avatarPublicId"
  );
  if (!user) return null;

  const previousRole =
    user.role === "admin"
      ? (await Creator.exists({
          userId: user._id,
          applicationStatus: "approved",
        }))
        ? "creator"
        : "user"
      : user.role;
  const admin = await Admin.create(adminDataFromUser(user, previousRole));
  try {
    await anonymizeShadowUser(user);
  } catch (error) {
    await Admin.deleteOne({ _id: user._id });
    throw error;
  }
  return toAdminPrincipal(admin);
}

export async function demoteAdminToUser(userId) {
  const admin = await Admin.findById(userId).select(
    "+nameEncrypted +usernameEncrypted +emailEncrypted +phoneNumberEncrypted +passwordHash +avatarPublicId +previousRole"
  );
  if (!admin) return null;

  const identity = toAdminPrincipal(admin);
  const userUpdates = {
    name: identity.name,
    email: identity.email,
    phoneNumber: identity.phoneNumber,
    passwordHash: admin.passwordHash,
    avatar: admin.avatar,
    role: admin.previousRole || "user",
    isVerified: admin.isVerified,
  };
  if (identity.username) userUpdates.username = identity.username;

  await User.updateOne(
    { _id: admin._id },
    {
      $set: userUpdates,
      $unset: {
        ...(identity.username ? {} : { username: 1 }),
        refreshTokenHash: 1,
        avatarPublicId: 1,
      },
    }
  );
  await Admin.deleteOne({ _id: admin._id });
  const restoredRole = admin.previousRole || "user";
  return {
    id: String(admin._id),
    _id: admin._id,
    name: identity.name,
    username: identity.username,
    email: identity.email,
    phoneNumber: identity.phoneNumber,
    role: restoredRole,
    avatar: identity.avatar,
    isVerified: identity.isVerified,
    createdAt: identity.createdAt,
    updatedAt: identity.updatedAt,
  };
}

export async function updateAdminIdentity(adminId, updates) {
  const admin = await Admin.findById(adminId).select(
    "+nameEncrypted +usernameEncrypted +emailEncrypted +phoneNumberEncrypted"
  );
  if (!admin) return null;

  const current = toAdminPrincipal(admin);
  const next = {
    name: updates.name ?? current.name,
    username: updates.username ?? current.username,
    email: updates.email ?? current.email,
    phoneNumber: updates.phoneNumber ?? current.phoneNumber,
  };
  const lookups = [
    { model: User, filter: { _id: { $ne: admin._id } } },
    { model: Admin, filter: { _id: { $ne: admin._id } } },
  ];

  for (const [field, lookupField] of [
    ["email", "email"],
    ["username", "username"],
    ["phoneNumber", "phone"],
  ]) {
    if (updates[field] === undefined || !next[field]) continue;
    const lookup = hashAdminIdentifier(next[field]);
    const [userDuplicate, adminDuplicate] = await Promise.all([
      lookups[0].model.exists({
        ...lookups[0].filter,
        [field]: next[field],
      }),
      lookups[1].model.exists({
        ...lookups[1].filter,
        [`${lookupField}Lookup`]: lookup,
      }),
    ]);
    if (userDuplicate || adminDuplicate) {
      const error = new Error(`${field} is already in use`);
      error.code = "DUPLICATE_ADMIN_IDENTITY";
      throw error;
    }
  }

  admin.nameEncrypted = encryptAdminValue(next.name);
  admin.usernameEncrypted = next.username
    ? encryptAdminValue(next.username)
    : null;
  admin.emailEncrypted = encryptAdminValue(next.email);
  admin.phoneNumberEncrypted = encryptAdminValue(next.phoneNumber);
  admin.emailLookup = hashAdminIdentifier(next.email);
  admin.phoneLookup = hashAdminIdentifier(next.phoneNumber);
  if (next.username) admin.usernameLookup = hashAdminIdentifier(next.username);
  else admin.usernameLookup = undefined;
  await admin.save();
  return toAdminPrincipal(admin);
}

export async function findAdminByIdentifier(
  identifier,
  { includeSecrets = false } = {}
) {
  const lookup = hashAdminIdentifier(identifier);
  const query = Admin.findOne({
    $or: [{ emailLookup: lookup }, { usernameLookup: lookup }],
  });
  query.select(
    "+nameEncrypted +usernameEncrypted +emailEncrypted +phoneNumberEncrypted"
  );
  if (includeSecrets)
    query.select("+passwordHash +refreshTokenHash +avatarPublicId");
  return query;
}

export async function getAdminById(adminId, { includeSecrets = false } = {}) {
  const query = Admin.findById(adminId);
  if (includeSecrets) {
    query.select(
      "+nameEncrypted +usernameEncrypted +emailEncrypted +phoneNumberEncrypted +passwordHash +refreshTokenHash +avatarPublicId"
    );
  } else {
    query.select(
      "+nameEncrypted +usernameEncrypted +emailEncrypted +phoneNumberEncrypted"
    );
  }
  return query;
}

export async function migrateLegacyAdmins() {
  const legacyAdmins = await User.find({ role: "admin" }).select(
    "+passwordHash +refreshTokenHash +avatarPublicId"
  );
  for (const user of legacyAdmins) {
    await promoteUserToAdmin(user._id);
  }
  return legacyAdmins.length;
}
