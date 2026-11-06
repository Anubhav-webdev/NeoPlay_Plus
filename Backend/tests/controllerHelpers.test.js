import assert from "node:assert/strict";
import test from "node:test";
import {
  serializeContentReference,
  serializeContentWithThumbnail,
} from "../utils/contentSerialization.js";
import { getPagination } from "../utils/pagination.js";

test("pagination keeps endpoint-specific defaults and bounds", () => {
  assert.deepEqual(getPagination({}, { defaultLimit: 20, maxLimit: 50 }), {
    page: 1,
    limit: 20,
    skip: 0,
  });
  assert.deepEqual(
    getPagination(
      { page: "4", limit: "500" },
      { defaultLimit: 30, maxLimit: 100 },
    ),
    { page: 4, limit: 100, skip: 300 },
  );
  assert.deepEqual(
    getPagination(
      { page: "-2", limit: "0" },
      { defaultLimit: 30, maxLimit: 100 },
    ),
    { page: 1, limit: 30, skip: 0 },
  );
});

test("content serialization prioritizes stored and asset thumbnails", () => {
  const cloudinary = {
    url: () => {
      throw new Error("A generated thumbnail should not be needed");
    },
  };
  assert.equal(
    serializeContentWithThumbnail(
      {
        type: "Video",
        mediaPublicId: "video-id",
        thumbnailUrl: "stored-thumbnail",
        thumbnailAssetId: { secureUrl: "asset-thumbnail" },
      },
      cloudinary,
    ).thumbnailUrl,
    "stored-thumbnail",
  );
  assert.equal(
    serializeContentWithThumbnail(
      { type: "Image", thumbnailAssetId: { secureUrl: "asset-thumbnail" } },
      cloudinary,
    ).thumbnailUrl,
    "asset-thumbnail",
  );
});

test("content references share thumbnail serialization without changing item fields", () => {
  const cloudinary = {
    url: (publicId, options) => `${publicId}:${options.format}`,
  };
  const item = {
    progress: 50,
    contentId: { type: "Video", mediaPublicId: "video-id" },
  };
  const serialized = serializeContentReference(item, cloudinary);

  assert.deepEqual(serialized, {
    progress: 50,
    contentId: {
      type: "Video",
      mediaPublicId: "video-id",
      thumbnailUrl: "video-id:jpg",
    },
  });
  assert.equal(serializeContentReference({ contentId: null }, cloudinary).contentId, null);
});
