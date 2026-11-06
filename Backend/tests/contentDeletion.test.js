import assert from "node:assert/strict";
import mongoose from "mongoose";
import test from "node:test";
import ContentDeletion from "../models/ContentDeletion.js";
import ContentDeletionLock from "../models/ContentDeletionLock.js";
import {
  assetLockKeys,
  cloudinaryLockKey,
  contentLockKey,
} from "../services/contentDeletionService.js";

test("resource lock keys are stable and include Cloudinary identity", () => {
  const asset = {
    _id: "asset-id",
    publicId: "neoplay/media/user/asset-id",
    resourceType: "video",
    mediaType: "video",
  };

  assert.equal(contentLockKey("content-id"), "content:content-id");
  assert.equal(
    cloudinaryLockKey("video", asset.publicId),
    `cloudinary:video:${asset.publicId}`,
  );
  assert.deepEqual(assetLockKeys(asset), [
    "asset:asset-id",
    `cloudinary:video:${asset.publicId}`,
  ]);
});

test("content deletion outbox validates retry state and saved targets", async () => {
  const job = new ContentDeletion({
    contentId: new mongoose.Types.ObjectId(),
    targets: [
      {
        publicId: "neoplay/media/user/asset",
        resourceType: "image",
        secureUrl: "https://res.cloudinary.com/demo/image/upload/asset.webp",
      },
    ],
    lockKeys: ["content:content-id", "asset:asset-id"],
  });

  assert.equal(job.status, "queued");
  assert.equal(job.attempts, 0);
  assert.equal(job.targets[0].resourceType, "image");
  await job.validate();
});

test("deletion lock records require unique resource ownership", async () => {
  const lock = new ContentDeletionLock({
    key: "content:content-id",
    ownerId: "content-deletion:job-id",
  });

  assert.equal(lock.expiresAt, null);
  await lock.validate();
});
