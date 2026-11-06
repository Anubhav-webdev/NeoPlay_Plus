import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptAdminValue,
  encryptAdminValue,
  hashAdminIdentifier,
  normalizeAdminIdentifier,
} from "../services/adminDataService.js";
import Admin from "../models/Admin.js";

process.env.ADMIN_DATA_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.ADMIN_LOOKUP_HMAC_KEY =
  "test-admin-lookup-key-with-at-least-32-characters";

test("admin identifiers can be decrypted but are encrypted at rest", () => {
  const plaintext = "admin@example.com";
  const encrypted = encryptAdminValue(plaintext);

  assert.notEqual(encrypted, plaintext);
  assert.equal(decryptAdminValue(encrypted), plaintext);
  assert.notEqual(encryptAdminValue(plaintext), encrypted);
});

test("admin encryption accepts a 32-byte base64url key", () => {
  const previousKey = process.env.ADMIN_DATA_ENCRYPTION_KEY;
  process.env.ADMIN_DATA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
    "base64url"
  );
  try {
    const encrypted = encryptAdminValue("admin@example.com");
    assert.equal(decryptAdminValue(encrypted), "admin@example.com");
  } finally {
    process.env.ADMIN_DATA_ENCRYPTION_KEY = previousKey;
  }
});

test("admin identifier lookup hashes are stable after normalization", () => {
  assert.equal(
    normalizeAdminIdentifier(" Admin@Example.com "),
    "admin@example.com"
  );
  assert.equal(
    hashAdminIdentifier(" Admin@Example.com "),
    hashAdminIdentifier("admin@example.com")
  );
  assert.notEqual(
    hashAdminIdentifier("admin@example.com"),
    hashAdminIdentifier("other@example.com")
  );
});

test("admin model uses its own collection without plaintext identifiers", () => {
  assert.equal(Admin.collection.collectionName, "admins");
  for (const field of ["name", "username", "email", "phoneNumber"]) {
    assert.equal(Admin.schema.path(field), undefined);
  }
  for (const field of [
    "nameEncrypted",
    "usernameEncrypted",
    "emailEncrypted",
    "phoneNumberEncrypted",
  ]) {
    assert.equal(Admin.schema.path(field).options.select, false);
  }
});
