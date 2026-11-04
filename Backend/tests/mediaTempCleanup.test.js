import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { removeOrphanedTempFiles } from "../services/mediaTempCleanup.js";

test("removes only old temporary entries with no active staged-file reference", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "neoplay-temp-cleanup-"));
  try {
    const oldOrphan = path.join(tempDir, "old-orphan.upload");
    const activeStagedFile = path.join(tempDir, "active.upload");
    const recentFile = path.join(tempDir, "recent.webp");
    const oldDirectory = path.join(tempDir, "frames-old");
    const oldNestedFile = path.join(oldDirectory, "frame.jpg");
    const activeDirectory = path.join(tempDir, "frames-active");
    const activeNestedFile = path.join(activeDirectory, "frame.jpg");
    const referencedChunkDirectory = path.join(tempDir, "upload.chunks");
    const chunkFile = path.join(referencedChunkDirectory, "0.part");
    await fs.mkdir(oldDirectory);
    await fs.mkdir(activeDirectory);
    await fs.mkdir(referencedChunkDirectory);
    await Promise.all([
      fs.writeFile(oldOrphan, "orphan"),
      fs.writeFile(activeStagedFile, "active"),
      fs.writeFile(recentFile, "recent"),
      fs.writeFile(oldNestedFile, "frame"),
      fs.writeFile(activeNestedFile, "active frame"),
      fs.writeFile(chunkFile, "chunk"),
    ]);

    const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await Promise.all([
      fs.utimes(oldOrphan, oldTime, oldTime),
      fs.utimes(activeStagedFile, oldTime, oldTime),
      fs.utimes(oldNestedFile, oldTime, oldTime),
      fs.utimes(oldDirectory, oldTime, oldTime),
      fs.utimes(activeNestedFile, oldTime, oldTime),
      fs.utimes(activeDirectory, oldTime, oldTime),
      fs.utimes(chunkFile, oldTime, oldTime),
      fs.utimes(referencedChunkDirectory, oldTime, oldTime),
    ]);

    const removed = await removeOrphanedTempFiles(
      tempDir,
      [activeStagedFile, activeNestedFile, referencedChunkDirectory],
      Date.now() - 60 * 60 * 1000,
    );

    assert.equal(removed, 2);
    await assert.rejects(fs.access(oldOrphan));
    await assert.rejects(fs.access(oldDirectory));
    await fs.access(activeStagedFile);
    await fs.access(activeNestedFile);
    await fs.access(chunkFile);
    await fs.access(recentFile);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("treats a missing temporary directory as already clean", async () => {
  const missingDir = path.join(
    os.tmpdir(),
    `neoplay-missing-temp-${Date.now()}-${Math.random()}`,
  );
  assert.equal(await removeOrphanedTempFiles(missingDir, [], Date.now()), 0);
});
