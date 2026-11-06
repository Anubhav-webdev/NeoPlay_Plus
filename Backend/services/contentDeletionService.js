import { randomUUID } from "node:crypto";
import Content from "../models/Content.js";
import ContentDeletion from "../models/ContentDeletion.js";
import ContentDeletionLock from "../models/ContentDeletionLock.js";
import MediaAsset from "../models/MediaAsset.js";
import Comment from "../models/Comment.js";
import ReplyComment from "../models/ReplyComment.js";
import Like from "../models/Like.js";
import Playlist from "../models/Playlist.js";
import Report from "../models/Report.js";
import WatchHistory from "../models/WatchHistory.js";
import Wishlist from "../models/Wishlist.js";
import MediaDuplicateEvent from "../models/MediaDuplicateEvent.js";
import ApiError from "../utils/ApiError.js";
import { deleteCloudinaryAsset } from "./cloudinaryService.js";

const MUTATION_LOCK_MS = 10 * 60 * 1000;
const WORKER_LEASE_MS = 15 * 60 * 1000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

export async function initializeContentDeletionStorage() {
  await Promise.all([
    ContentDeletion.createIndexes(),
    ContentDeletionLock.createIndexes(),
  ]);
}

export function contentLockKey(contentId) {
  return `content:${contentId}`;
}

export function assetLockKeys(asset) {
  const keys = [`asset:${asset._id}`];
  const publicId = asset.publicId || asset.pendingCloudinaryPublicId;
  const resourceType = asset.resourceType || asset.mediaType;
  if (publicId && resourceType) {
    keys.push(`cloudinary:${resourceType}:${publicId}`);
  }
  return keys;
}

export function cloudinaryLockKey(resourceType, publicId) {
  return `cloudinary:${resourceType}:${publicId}`;
}

function targetLockKeys(target) {
  return [
    ...(target.assetId ? [`asset:${target.assetId}`] : []),
    cloudinaryLockKey(target.resourceType, target.publicId),
  ];
}

async function acquireResourceLock(key, ownerId, persistent) {
  const now = new Date();
  try {
    const lock = await ContentDeletionLock.findOneAndUpdate(
      {
        key,
        $or: [{ ownerId }, { expiresAt: { $lte: now } }],
      },
      {
        $set: {
          ownerId,
          expiresAt: persistent
            ? null
            : new Date(now.getTime() + MUTATION_LOCK_MS),
        },
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );
    return lock?.ownerId === ownerId;
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
}

export async function acquireResourceLocks(
  keys,
  ownerId,
  { persistent = false, retainOnFailure = false } = {},
) {
  const orderedKeys = [...new Set(keys)].sort();
  const acquired = [];
  for (const key of orderedKeys) {
    if (await acquireResourceLock(key, ownerId, persistent)) {
      acquired.push(key);
      continue;
    }
    if (!retainOnFailure) {
      await releaseResourceLocks(acquired, ownerId);
    }
    throw new ApiError(
      409,
      "Content or media is being changed or deleted; retry the request shortly",
    );
  }
  return acquired;
}

export async function releaseResourceLocks(keys, ownerId) {
  if (!keys.length) return;
  await ContentDeletionLock.deleteMany({
    key: { $in: [...new Set(keys)] },
    ownerId,
  });
}

function maintainResourceLocks(keys, ownerId) {
  const timer = setInterval(() => {
    ContentDeletionLock.updateMany(
      { key: { $in: keys }, ownerId, expiresAt: { $ne: null } },
      { $set: { expiresAt: new Date(Date.now() + MUTATION_LOCK_MS) } },
    ).catch((error) =>
      console.error("Could not renew resource locks", { keys, error }),
    );
  }, 30_000);
  timer.unref();
  return () => clearInterval(timer);
}

async function transferResourceLocks(keys, currentOwner, deletionOwner) {
  if (!keys.length) return;
  await ContentDeletionLock.updateMany(
    { key: { $in: [...new Set(keys)] }, ownerId: currentOwner },
    { $set: { ownerId: deletionOwner, expiresAt: null } },
  );
}

export async function withContentMutationLock(contentId, action) {
  const ownerId = `mutation:${randomUUID()}`;
  const key = contentLockKey(contentId);
  await acquireResourceLocks([key], ownerId);
  const stopRenewal = maintainResourceLocks([key], ownerId);
  try {
    return await action();
  } finally {
    stopRenewal();
    await releaseResourceLocks([key], ownerId);
  }
}

export async function withAssetMutationLocks(assets, action) {
  const ownerId = `asset-mutation:${randomUUID()}`;
  const keys = assets.flatMap(assetLockKeys);
  if (!keys.length) return action();
  await acquireResourceLocks(keys, ownerId);
  const stopRenewal = maintainResourceLocks(keys, ownerId);
  try {
    return await action();
  } finally {
    stopRenewal();
    await releaseResourceLocks(keys, ownerId);
  }
}

export async function findContentAssets(content) {
  const queries = [
    ...[content.mediaAssetId, content.thumbnailAssetId]
      .filter(Boolean)
      .map((_id) => ({ _id })),
    ...(content.mediaPublicId ? [{ publicId: content.mediaPublicId }] : []),
    ...[content.mediaUrl, content.thumbnailUrl]
      .filter(Boolean)
      .map((secureUrl) => ({ secureUrl })),
  ];
  if (!queries.length) return [];
  return MediaAsset.find({ $or: queries })
    .select("+pendingCloudinaryPublicId")
    .lean();
}

export function contentResourceKeys(content, assets) {
  const keys = [contentLockKey(content._id)];
  for (const asset of assets) keys.push(...assetLockKeys(asset));
  if (content.mediaPublicId) {
    const resourceType =
      content.type === "Video"
        ? "video"
        : content.type === "Image"
          ? "image"
          : content.mediaUrl?.match(/\/(image|video)\/upload\//)?.[1];
    if (resourceType) {
      keys.push(cloudinaryLockKey(resourceType, content.mediaPublicId));
    }
  }
  return [...new Set(keys)];
}

async function contentUsesAsset(contentId, asset) {
  const references = [
    { mediaAssetId: asset._id },
    { thumbnailAssetId: asset._id },
    ...(asset.publicId ? [{ mediaPublicId: asset.publicId }] : []),
    ...(asset.secureUrl
      ? [{ mediaUrl: asset.secureUrl }, { thumbnailUrl: asset.secureUrl }]
      : []),
  ];
  return Content.exists({
    _id: { $ne: contentId },
    $or: references,
  });
}

async function assetHasDuplicatePublicId(asset) {
  if (!asset.publicId) return false;
  return MediaAsset.exists({
    _id: { $ne: asset._id },
    publicId: asset.publicId,
    resourceType: asset.resourceType || asset.mediaType,
  });
}

async function createDeletionPlan(content) {
  const assets = await findContentAssets(content);
  const deletableAssets = [];
  for (const asset of assets) {
    if (
      !(await contentUsesAsset(content._id, asset)) &&
      !(await assetHasDuplicatePublicId(asset))
    ) {
      deletableAssets.push(asset);
    }
  }

  const targets = new Map();
  for (const asset of assets) {
    const publicId =
      asset.publicId ||
      asset.pendingCloudinaryPublicId ||
      `neoplay/media/${asset.ownerId}/${asset._id}`;
    const resourceType = asset.resourceType || asset.mediaType;
    targets.set(`${resourceType}:${publicId}`, {
      publicId,
      resourceType,
      assetId: asset._id,
    });
  }

  if (
    content.mediaPublicId &&
    !assets.some(
      (asset) =>
        asset.publicId === content.mediaPublicId ||
        String(asset._id) === String(content.mediaAssetId),
    )
  ) {
    const resourceType =
      content.type === "Video"
        ? "video"
        : content.type === "Image"
          ? "image"
          : content.mediaUrl?.match(/\/(image|video)\/upload\//)?.[1];
    if (!resourceType) {
      throw new ApiError(
        409,
        "Unable to determine the media type; content and media were not deleted.",
      );
    }
    targets.set(`${resourceType}:${content.mediaPublicId}`, {
      publicId: content.mediaPublicId,
      resourceType,
      secureUrl: content.mediaUrl || null,
      assetId: null,
    });
  }

  const deletableAssetIds = deletableAssets.map((asset) => asset._id);
  const deletionTargets = [...targets.values()];
  const lockKeys = [
    contentLockKey(content._id),
    ...deletionTargets.flatMap(targetLockKeys),
  ];
  return { assets, deletableAssetIds, targets: deletionTargets, lockKeys };
}

export async function schedulePermanentContentDeletion(contentId) {
  const existing = await ContentDeletion.findOne({ contentId });
  if (existing) {
    if (existing.status !== "completed") {
      await Content.updateOne(
        { _id: contentId, status: { $ne: "archived" } },
        { $set: { status: "archived" } },
      );
    }
    return existing;
  }

  const ownerId = `schedule:${randomUUID()}`;
  const lockedKeys = [];
  const contentKey = contentLockKey(contentId);
  try {
    await acquireResourceLocks([contentKey], ownerId);
  } catch (error) {
    const queued = await ContentDeletion.findOne({ contentId });
    if (queued) return queued;
    throw error;
  }
  lockedKeys.push(contentKey);
  const stopRenewal = maintainResourceLocks(lockedKeys, ownerId);

  try {
    const duplicate = await ContentDeletion.findOne({ contentId });
    if (duplicate) {
      if (duplicate.status !== "completed") {
        await Content.updateOne(
          { _id: contentId, status: { $ne: "archived" } },
          { $set: { status: "archived" } },
        );
      }
      return duplicate;
    }

    const content = await Content.findById(contentId);
    if (!content) throw new ApiError(404, "Content not found");

    let assets = await findContentAssets(content);
    const resourceKeys = contentResourceKeys(content, assets).filter(
      (key) => key !== contentKey,
    );
    lockedKeys.push(
      ...(await acquireResourceLocks(resourceKeys, ownerId)),
    );

    const currentContent = await Content.findById(contentId);
    if (!currentContent) throw new ApiError(404, "Content not found");
    const plan = await createDeletionPlan(currentContent);
    const commentIds = await Comment.distinct("_id", {
      contentId: currentContent._id,
    });
    const job = await ContentDeletion.create({
      contentId: currentContent._id,
      targets: plan.targets,
      deletableAssetIds: plan.deletableAssetIds,
      commentIds,
      lockKeys: plan.lockKeys,
    });
    const persistentOwner = `content-deletion:${job._id}`;
    await transferResourceLocks([contentKey], ownerId, persistentOwner);
    await Content.updateOne(
      { _id: currentContent._id, status: { $ne: "archived" } },
      { $set: { status: "archived" } },
    );
    return job;
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await ContentDeletion.findOne({ contentId });
      if (duplicate) return duplicate;
    }
    throw error;
  } finally {
    stopRenewal();
    await releaseResourceLocks(lockedKeys, ownerId);
  }
}

async function isTargetStillUnshared(target, contentId) {
  if (target.assetId) {
    const asset = await MediaAsset.findById(target.assetId)
      .select("+pendingCloudinaryPublicId")
      .lean();
    if (
      !asset ||
      (await contentUsesAsset(contentId, asset)) ||
      (await assetHasDuplicatePublicId(asset))
    ) {
      return false;
    }
  } else if (
    await Content.exists({
      _id: { $ne: contentId },
      $or: [
        { mediaPublicId: target.publicId },
        ...(target.secureUrl
          ? [
              { mediaUrl: target.secureUrl },
              { thumbnailUrl: target.secureUrl },
            ]
          : []),
      ],
    })
  ) {
    return false;
  }
  return true;
}

async function cleanContentReferences(job) {
  await ReplyComment.deleteMany({ commentId: { $in: job.commentIds } });
  await Comment.deleteMany({ contentId: job.contentId });
  await Like.deleteMany({ contentId: job.contentId });
  await WatchHistory.deleteMany({ contentId: job.contentId });
  await Wishlist.deleteMany({ contentId: job.contentId });
  await Report.deleteMany({ contentId: job.contentId });
  await Playlist.updateMany(
    { contentIds: job.contentId },
    { $pull: { contentIds: job.contentId } },
  );
  await Content.deleteOne({ _id: job.contentId });
}

async function recordRetry(job, workerToken, error) {
  const attempts = job.attempts + 1;
  const delay = Math.min(
    1000 * 2 ** Math.min(attempts, 12),
    MAX_RETRY_DELAY_MS,
  );
  await ContentDeletion.updateOne(
    { _id: job._id, workerToken },
    {
      $set: {
        status: "retrying",
        nextAttemptAt: new Date(Date.now() + delay),
        lastError: String(error?.message || error).slice(0, 1000),
      },
      $inc: { attempts: 1 },
      $unset: { leaseUntil: 1, workerToken: 1 },
    },
  );
}

async function assertDeletionLease(jobId, workerToken) {
  const lease = await ContentDeletion.exists({
    _id: jobId,
    workerToken,
    status: "processing",
    leaseUntil: { $gt: new Date() },
  });
  if (!lease) {
    throw new Error("Content deletion worker lease was lost");
  }
}

export async function processNextContentDeletion() {
  const now = new Date();
  const workerToken = randomUUID();
  const job = await ContentDeletion.findOneAndUpdate(
    {
      $or: [
        {
          status: { $in: ["queued", "retrying"] },
          nextAttemptAt: { $lte: now },
        },
        { status: "processing", leaseUntil: { $lte: now } },
      ],
    },
    {
      $set: {
        status: "processing",
        workerToken,
        leaseUntil: new Date(now.getTime() + WORKER_LEASE_MS),
      },
    },
    { returnDocument: "after", sort: { createdAt: 1 } },
  );
  if (!job) return false;

  const deletionOwner = `content-deletion:${job._id}`;
  const workerOwner = `${deletionOwner}:${workerToken}`;
  const assetLockKeys = job.lockKeys.filter((key) => !key.startsWith("content:"));
  const leaseRenewal = setInterval(() => {
    ContentDeletion.updateOne(
      { _id: job._id, workerToken, status: "processing" },
      { $set: { leaseUntil: new Date(Date.now() + WORKER_LEASE_MS) } },
    ).catch((error) =>
      console.error("Could not renew content deletion worker lease", {
        deletionId: job.id,
        error,
      }),
    );
  }, 30_000);
  leaseRenewal.unref();
  try {
    await ContentDeletionLock.deleteMany({
      key: { $in: assetLockKeys },
      ownerId: { $regex: `^${deletionOwner}:` },
    });
    await acquireResourceLocks([contentLockKey(job.contentId)], deletionOwner, {
      persistent: true,
      retainOnFailure: true,
    });
    await acquireResourceLocks(assetLockKeys, workerOwner, {
      persistent: true,
      retainOnFailure: true,
    });
    await assertDeletionLease(job._id, workerToken);

    await Content.updateOne(
      { _id: job.contentId, status: { $ne: "archived" } },
      { $set: { status: "archived" } },
    );
    const targets = [];
    for (const target of job.targets) {
      if (await isTargetStillUnshared(target, job.contentId)) {
        targets.push(target);
      }
    }
    const candidateLockKeys = new Set(job.targets.flatMap(targetLockKeys));
    const deletionLockKeys = new Set(targets.flatMap(targetLockKeys));
    const sharedLockKeys = [...candidateLockKeys].filter(
      (key) => !deletionLockKeys.has(key),
    );
    await assertDeletionLease(job._id, workerToken);
    await cleanContentReferences(job);
    await releaseResourceLocks(sharedLockKeys, workerOwner);

    const deletableAssetIds = [
      ...new Set(
        targets
          .map((target) => target.assetId)
          .filter(Boolean)
          .map(String),
      ),
    ];
    const planUpdate = await ContentDeletion.updateOne(
      { _id: job._id, workerToken },
      {
        $set: {
          targets,
          deletableAssetIds,
          lockKeys: [contentLockKey(job.contentId), ...deletionLockKeys],
        },
      },
    );
    if (!planUpdate.matchedCount) {
      throw new Error("Content deletion worker lease was lost");
    }
    job.targets = targets;
    job.deletableAssetIds = deletableAssetIds;

    for (const target of job.targets) {
      await assertDeletionLease(job._id, workerToken);
      await deleteCloudinaryAsset(target.publicId, target.resourceType);
    }
    if (job.deletableAssetIds.length) {
      await assertDeletionLease(job._id, workerToken);
      await MediaDuplicateEvent.updateMany(
        {
          $or: [
            { uploadAssetId: { $in: job.deletableAssetIds } },
            { matchAssetId: { $in: job.deletableAssetIds } },
          ],
        },
        { $unset: { uploadAssetId: 1, matchAssetId: 1 } },
      );
      await MediaAsset.deleteMany({ _id: { $in: job.deletableAssetIds } });
    }

    const completion = await ContentDeletion.updateOne(
      { _id: job._id, workerToken },
      {
        $set: { status: "completed", completedAt: new Date(), lastError: null },
        $unset: { leaseUntil: 1, workerToken: 1 },
      },
    );
    if (!completion.modifiedCount) {
      throw new Error("Content deletion worker lease was lost before completion");
    }
    await releaseResourceLocks([...deletionLockKeys], workerOwner);
    await releaseResourceLocks([contentLockKey(job.contentId)], deletionOwner);
    await ContentDeletion.updateOne(
      { _id: job._id, status: "completed" },
      { $set: { lockKeys: [] } },
    );
    return true;
  } catch (error) {
    await recordRetry(job, workerToken, error);
    throw error;
  } finally {
    clearInterval(leaseRenewal);
  }
}

export async function releaseCompletedDeletionLocks() {
  const completed = await ContentDeletion.find({
    status: "completed",
    lockKeys: { $ne: [] },
  })
    .select("_id lockKeys")
    .limit(100);
  for (const job of completed) {
    await releaseResourceLocks(job.lockKeys, `content-deletion:${job._id}`);
    await ContentDeletionLock.deleteMany({
      key: { $in: job.lockKeys },
      ownerId: { $regex: `^content-deletion:${job._id}:` },
    });
    await ContentDeletion.updateOne(
      { _id: job._id, status: "completed" },
      { $set: { lockKeys: [] } },
    );
  }
}
