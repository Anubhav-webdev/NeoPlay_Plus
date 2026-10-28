import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import {
  fingerprintBands,
  fingerprintImage,
  hammingDistance,
  imageSimilarity,
  perceptualHashFromPixels,
  validateMediaType,
  videoSimilarity,
} from "../services/mediaFingerprint.js";

const execFileAsync = promisify(execFile);
let tempDir;

before(async () => {
  tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "neoplay-fingerprint-tests-")
  );
});

after(async () => {
  if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
});

async function writePatternImage(filePath, variant = "blocks") {
  const shapes =
    variant === "blocks"
      ? `
      <rect width="512" height="512" fill="#18354d"/>
      <path d="M24 40h190v130H24zM270 28h200v190H270zM80 245h145v215H80zM292 282h176v180H292z" fill="#e8a832"/>
      <circle cx="258" cy="256" r="68" fill="#e95745"/>
      <path d="M20 230L250 20l242 230-242 242z" fill="none" stroke="#f3ead7" stroke-width="13"/>
    `
      : `
      <rect width="512" height="512" fill="#102030"/>
      <circle cx="256" cy="256" r="215" fill="#29a887"/>
      <circle cx="256" cy="256" r="150" fill="#d5d431"/>
      <circle cx="256" cy="256" r="82" fill="#db583e"/>
      <path d="M0 90L512 422M0 422L512 90" stroke="#f3ead7" stroke-width="22"/>
    `;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${shapes}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(filePath);
}

test("perceptual hashes are deterministic and compare with Hamming distance", () => {
  const pixels = Buffer.alloc(32 * 32);
  for (let y = 0; y < 32; y += 1) {
    for (let x = 0; x < 32; x += 1) pixels[y * 32 + x] = (x * 9 + y * 13) % 256;
  }

  const first = perceptualHashFromPixels(pixels);
  const second = perceptualHashFromPixels(pixels);
  assert.equal(first, second);
  assert.equal(hammingDistance(first, second), 0);
  assert.throws(
    () => perceptualHashFromPixels(Buffer.alloc(8)),
    /expects 32x32/
  );
});

test("media type validation requires an allowed matching extension", () => {
  assert.equal(validateMediaType("image/jpeg", "photo.JPG", "image"), true);
  assert.equal(validateMediaType("image/jpeg", "photo.png", "image"), false);
  assert.equal(validateMediaType("video/mp4", "clip.mp4", "video"), true);
  assert.equal(validateMediaType("video/mp4", "clip.mov", "video"), false);
});

test("resized and re-encoded versions retain more image similarity than a different scene", async () => {
  const originalPath = path.join(tempDir, "original.png");
  const compressedPath = path.join(tempDir, "renamed-resized.jpg");
  const otherPath = path.join(tempDir, "other.png");
  await writePatternImage(originalPath);
  await writePatternImage(otherPath, "circles");
  await sharp(originalPath)
    .resize(320, 320)
    .jpeg({ quality: 72 })
    .toFile(compressedPath);

  const original = await fingerprintImage(originalPath);
  const compressed = await fingerprintImage(compressedPath);
  const other = await fingerprintImage(otherPath);
  const transformedScore = imageSimilarity(original, compressed);
  const differentScore = imageSimilarity(original, other);

  assert.ok(Number.isFinite(transformedScore));
  assert.ok(transformedScore > differentScore);
  assert.ok(transformedScore >= 0 && transformedScore <= 1);
  assert.ok(fingerprintBands(original).length > 0);
});

test("cropped image fingerprints keep measurable similarity to their source", async () => {
  const originalPath = path.join(tempDir, "crop-source.png");
  const croppedPath = path.join(tempDir, "crop-edit.png");
  const otherPath = path.join(tempDir, "crop-unrelated.png");
  await writePatternImage(originalPath);
  await sharp(originalPath)
    .extract({ left: 45, top: 45, width: 422, height: 422 })
    .png()
    .toFile(croppedPath);
  await writePatternImage(otherPath, "circles");

  const original = await fingerprintImage(originalPath);
  const cropped = await fingerprintImage(croppedPath);
  const other = await fingerprintImage(otherPath);
  const score = imageSimilarity(original, cropped);

  assert.ok(Number.isFinite(score));
  assert.ok(score > imageSimilarity(original, other));
});

test("video frame-sequence similarity tolerates re-encoding and edge trims", () => {
  const sequence = [
    "0000000000000000",
    "1111111111111111",
    "3333333333333333",
    "7777777777777777",
    "ffffffffffffffff",
  ];
  const reencodedAndTrimmed = {
    frames: [
      "eeeeeeeeeeeeeeee",
      "0000000000000001",
      "1111111111111110",
      "3333333333333332",
      "7777777777777776",
      "fffffffffffffffe",
      "8888888888888888",
    ],
  };
  const unrelated = {
    frames: ["0000000000000000", "ffffffffffffffff", "0000000000000000"],
  };
  const matchedScore = videoSimilarity(
    { frames: sequence },
    reencodedAndTrimmed
  );
  const unrelatedScore = videoSimilarity({ frames: sequence }, unrelated);

  assert.equal(matchedScore, 1);
  assert.ok(unrelatedScore < matchedScore);
});

test("FFmpeg can generate and fingerprint a short synthetic video", async (context) => {
  if (!ffmpegPath) {
    context.skip(
      "ffmpeg-static did not provide an executable for this platform"
    );
    return;
  }

  const videoPath = path.join(tempDir, "synthetic.mp4");
  const transformedPath = path.join(tempDir, "synthetic-trimmed-reencoded.mp4");
  const unrelatedPath = path.join(tempDir, "synthetic-unrelated.mp4");
  try {
    await execFileAsync(
      ffmpegPath,
      [
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        "testsrc2=size=160x120:rate=8:duration=8",
        "-an",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-y",
        videoPath,
      ],
      { timeout: 30_000, windowsHide: true }
    );
  } catch (error) {
    context.skip(
      `Bundled FFmpeg cannot encode the synthetic test video: ${error.message}`
    );
    return;
  }

  const { probeVideo, fingerprintVideo } =
    await import("../services/mediaFingerprint.js");
  const metadata = await probeVideo(videoPath);
  const fingerprint = await fingerprintVideo(videoPath, metadata);
  await execFileAsync(
    ffmpegPath,
    [
      "-nostdin",
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      "2",
      "-i",
      videoPath,
      "-t",
      "6",
      "-c:v",
      "mpeg4",
      "-q:v",
      "5",
      "-y",
      transformedPath,
    ],
    { timeout: 30_000, windowsHide: true }
  );
  await execFileAsync(
    ffmpegPath,
    [
      "-nostdin",
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "smptebars=size=160x120:rate=8:duration=8",
      "-an",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-y",
      unrelatedPath,
    ],
    { timeout: 30_000, windowsHide: true }
  );
  const transformedMetadata = await probeVideo(transformedPath);
  const unrelatedMetadata = await probeVideo(unrelatedPath);
  const transformedFingerprint = await fingerprintVideo(
    transformedPath,
    transformedMetadata
  );
  const unrelatedFingerprint = await fingerprintVideo(
    unrelatedPath,
    unrelatedMetadata
  );
  assert.equal(fingerprint.kind, "video");
  assert.ok(fingerprint.frames.length >= 2);
  assert.equal(videoSimilarity(fingerprint, fingerprint), 1);
  assert.ok(
    videoSimilarity(fingerprint, transformedFingerprint) >
      videoSimilarity(fingerprint, unrelatedFingerprint)
  );
});
