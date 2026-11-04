import fs from "node:fs/promises";
import path from "node:path";

function isWithinDirectory(directory, filePath) {
  const relativePath = path.relative(directory, filePath);
  return relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath);
}

async function inspectEntry(entryPath, referencedPaths) {
  let stat;
  try {
    stat = await fs.lstat(entryPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return { latestModifiedAt: 0, containsReference: false };
    }
    throw error;
  }
  if (stat.isSymbolicLink()) {
    return { latestModifiedAt: stat.mtimeMs, containsReference: false };
  }
  if (!stat.isDirectory()) {
    return {
      latestModifiedAt: stat.mtimeMs,
      containsReference: referencedPaths.has(path.resolve(entryPath)),
    };
  }

  let latestModifiedAt = stat.mtimeMs;
  const resolvedEntry = path.resolve(entryPath);
  let containsReference = referencedPaths.has(resolvedEntry) ||
    [...referencedPaths].some((referencedPath) =>
      isWithinDirectory(resolvedEntry, referencedPath),
    );
  let children;
  try {
    children = await fs.readdir(entryPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return { latestModifiedAt: 0, containsReference: false };
    }
    throw error;
  }
  for (const child of children) {
    const childPath = path.join(entryPath, child);
    const childResult = await inspectEntry(childPath, referencedPaths);
    latestModifiedAt = Math.max(latestModifiedAt, childResult.latestModifiedAt);
    containsReference ||= childResult.containsReference;
  }
  return { latestModifiedAt, containsReference };
}

export async function removeOrphanedTempFiles(
  tempDir,
  referencedPaths,
  olderThan,
) {
  const root = path.resolve(tempDir);
  const referenced = new Set(
    referencedPaths.map((filePath) => path.resolve(filePath)),
  );
  let entries;
  try {
    entries = await fs.readdir(root);
  } catch (error) {
    if (error.code === "ENOENT") return 0;
    throw error;
  }

  let removed = 0;
  for (const entry of entries) {
    const entryPath = path.resolve(root, entry);
    if (!isWithinDirectory(root, entryPath)) continue;
    const inspection = await inspectEntry(entryPath, referenced);
    if (
      !inspection.containsReference &&
      inspection.latestModifiedAt < olderThan
    ) {
      await fs.rm(entryPath, { recursive: true, force: true });
      removed += 1;
    }
  }
  return removed;
}
