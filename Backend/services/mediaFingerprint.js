import { spawn } from "node:child_process";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { mediaConfig } from "../config/media.js";

const execFileAsync = promisify(execFile);
const DCT_SIZE = 32;
const HASH_SIZE = 8;
const COSINES = Array.from({ length: DCT_SIZE }, (_, coordinate) =>
  Array.from({ length: HASH_SIZE }, (_, frequency) =>
    Math.cos(((2 * coordinate + 1) * frequency * Math.PI) / (2 * DCT_SIZE))
  )
);
const IMAGE_EXTENSIONS = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
]);
const VIDEO_EXTENSIONS = new Map([
  ["video/mp4", new Set([".mp4", ".m4v"])],
  ["video/quicktime", new Set([".mov"])],
  ["video/webm", new Set([".webm"])],
  ["video/x-matroska", new Set([".mkv"])],
]);

export function validateMediaType(mimeType, extension, kind) {
  const candidates = kind === "image" ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS;
  const extensions = candidates.get(mimeType);
  return Boolean(extensions?.has(path.extname(extension).toLowerCase()));
}

export function perceptualHashFromPixels(
  pixels,
  width = DCT_SIZE,
  height = DCT_SIZE
) {
  if (
    width !== DCT_SIZE ||
    height !== DCT_SIZE ||
    pixels.length !== width * height
  ) {
    throw new Error(
      `Perceptual hash expects ${DCT_SIZE}x${DCT_SIZE} grayscale pixels`
    );
  }

  const coefficients = [];
  for (let vertical = 0; vertical < HASH_SIZE; vertical += 1) {
    for (let horizontal = 0; horizontal < HASH_SIZE; horizontal += 1) {
      let sum = 0;
      for (let y = 0; y < DCT_SIZE; y += 1) {
        for (let x = 0; x < DCT_SIZE; x += 1) {
          sum +=
            pixels[y * DCT_SIZE + x] *
            COSINES[x][horizontal] *
            COSINES[y][vertical];
        }
      }
      coefficients.push(sum);
    }
  }
  const medianValues = coefficients.slice(1).sort((a, b) => a - b);
  const median = medianValues[Math.floor(medianValues.length / 2)];
  let hash = 0n;
  coefficients.forEach((coefficient, index) => {
    if (coefficient > median) hash |= 1n << BigInt(63 - index);
  });
  return hash.toString(16).padStart(16, "0");
}

function hashBands(hash) {
  return [0, 4, 8, 12].map((offset) => `ph:${hash.slice(offset, offset + 4)}`);
}

export function fingerprintBands(fingerprints) {
  const hashes =
    fingerprints.kind === "image" ? fingerprints.hashes : fingerprints.frames;
  return [...new Set(hashes.flatMap(hashBands))];
}

export function hammingDistance(left, right) {
  let value = BigInt(`0x${left}`) ^ BigInt(`0x${right}`);
  let count = 0;
  while (value) {
    count += 1;
    value &= value - 1n;
  }
  return count;
}

export function imageSimilarity(left, right) {
  let minDistance = 64;
  for (let i = 0; i < left.hashes.length; i += 1) {
    for (let j = 0; j < right.hashes.length; j += 1) {
      // Flat regions carry little identity and otherwise cause unrelated logos/blank
      // backgrounds to appear identical under a perceptual hash.
      if (Math.min(left.texture[i], right.texture[j]) < 5) continue;
      minDistance = Math.min(
        minDistance,
        hammingDistance(left.hashes[i], right.hashes[j])
      );
    }
  }
  if (minDistance < 64) return (64 - minDistance) / 64;
  const colorDistance = Math.sqrt(
    left.averageColor.reduce(
      (sum, channel, index) => sum + (channel - right.averageColor[index]) ** 2,
      0
    )
  );
  return Math.max(0, 1 - colorDistance / 441.7);
}

// Use whole-frame and overlapping crop hashes at four orientations for crop resistance.
export async function fingerprintImage(filePath) {
  const rotationHashes = [];
  const texture = [];
  for (const angle of [0, 90, 180, 270]) {
    const { data, info } = await sharp(filePath, {
      limitInputPixels: mediaConfig.maxImagePixels,
      failOn: "error",
    })
      .rotate(angle)
      .resize(512, 512, { fit: "cover" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const regions = [
      [0, 0, 512],
      [0, 0, 320],
      [192, 0, 320],
      [0, 192, 320],
      [192, 192, 320],
      [96, 96, 320],
    ];
    for (const [left, top, size] of regions) {
      const pixels = Buffer.alloc(DCT_SIZE * DCT_SIZE);
      for (let y = 0; y < DCT_SIZE; y += 1) {
        const sourceY = top + Math.floor((y * size) / DCT_SIZE);
        for (let x = 0; x < DCT_SIZE; x += 1) {
          const sourceX = left + Math.floor((x * size) / DCT_SIZE);
          pixels[y * DCT_SIZE + x] = data[sourceY * info.width + sourceX];
        }
      }
      rotationHashes.push(perceptualHashFromPixels(pixels));
      const average =
        pixels.reduce((sum, value) => sum + value, 0) / pixels.length;
      const variance =
        pixels.reduce((sum, value) => sum + (value - average) ** 2, 0) /
        pixels.length;
      texture.push(Math.sqrt(variance));
    }
  }
  const { data: rgb } = await sharp(filePath, {
    limitInputPixels: mediaConfig.maxImagePixels,
    failOn: "error",
  })
    .rotate()
    .resize(32, 32, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const averageColor = [0, 1, 2].map((channel) => {
    let sum = 0;
    for (let index = channel; index < rgb.length; index += 3) sum += rgb[index];
    return sum / (rgb.length / 3);
  });
  return { kind: "image", hashes: rotationHashes, texture, averageColor };
}

function runBounded(command, args, timeoutMs, maxBuffer = 1024 * 1024) {
  return execFileAsync(command, args, {
    timeout: timeoutMs,
    maxBuffer,
    windowsHide: true,
  });
}

export async function probeVideo(filePath) {
  const { stdout } = await runBounded(
    mediaConfig.ffprobePath,
    ["-v", "error", "-show_streams", "-show_format", "-of", "json", filePath],
    15_000
  );
  const data = JSON.parse(stdout);
  const video = data.streams?.find((stream) => stream.codec_type === "video");
  if (!video) throw new Error("The file does not contain a video stream");
  const duration = Number(data.format?.duration || video.duration);
  const width = Number(video.width);
  const height = Number(video.height);
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration > mediaConfig.maxVideoDurationSeconds
  ) {
    throw new Error(
      `Video duration must be between 0 and ${mediaConfig.maxVideoDurationSeconds} seconds`
    );
  }
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 16 ||
    height < 16 ||
    width * height > mediaConfig.maxImagePixels
  ) {
    throw new Error(
      "Video dimensions are unsupported or exceed the configured pixel limit"
    );
  }
  return {
    duration,
    width,
    height,
    videoCodec: video.codec_name,
    hasAudio: data.streams.some((stream) => stream.codec_type === "audio"),
    audioCodecs: data.streams
      .filter((stream) => stream.codec_type === "audio")
      .map((stream) => stream.codec_name),
  };
}

async function extractVideoFrames(filePath, outputDir, duration) {
  await fs.mkdir(outputDir, { recursive: true });
  const count = Math.max(
    2,
    Math.min(mediaConfig.videoSampleCount, Math.ceil(duration))
  );
  const outputPattern = path.join(outputDir, "frame-%03d.jpg");
  const fps = `${count}/${duration}`;
  await new Promise((resolve, reject) => {
    const child = spawn(
      mediaConfig.ffmpegPath,
      [
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        filePath,
        "-vf",
        `fps=${fps},scale=256:256:force_original_aspect_ratio=decrease`,
        "-frames:v",
        String(count),
        "-q:v",
        "5",
        outputPattern,
      ],
      { stdio: ["ignore", "ignore", "pipe"], windowsHide: true }
    );
    let stderr = "";
    const timer = setTimeout(
      () => child.kill("SIGKILL"),
      mediaConfig.maxProcessingSeconds * 1000
    );
    child.stderr.on("data", (chunk) => {
      if (stderr.length < 8000) stderr += chunk.toString();
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code !== 0)
        reject(
          new Error(`FFmpeg frame extraction failed: ${stderr.slice(0, 1000)}`)
        );
      else resolve();
    });
  });
  const files = (await fs.readdir(outputDir))
    .filter((name) => /^frame-\d{3}\.jpg$/.test(name))
    .sort();
  if (files.length < 2)
    throw new Error("Could not extract enough video frames");
  const hashes = [];
  for (const name of files) {
    const { data } = await sharp(path.join(outputDir, name))
      .resize(DCT_SIZE, DCT_SIZE, { fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    hashes.push(perceptualHashFromPixels(data));
  }
  return hashes;
}

export async function fingerprintVideo(filePath, metadata) {
  await fs.mkdir(mediaConfig.tempDir, { recursive: true });
  const tempDir = await fs.mkdtemp(path.join(mediaConfig.tempDir, "frames-"));
  try {
    const frames = await extractVideoFrames(
      filePath,
      tempDir,
      metadata.duration
    );
    return { kind: "video", frames, duration: metadata.duration };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

// Ordered LCS matching detects reused clips despite intro/outro or edge trims.
export function videoSimilarity(
  left,
  right,
  maxFrameDistance = mediaConfig.videoFrameDistance
) {
  const rows = left.frames.length + 1;
  const columns = right.frames.length + 1;
  const table = Array.from({ length: rows }, () => new Uint16Array(columns));
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < columns; j += 1) {
      table[i][j] =
        hammingDistance(left.frames[i - 1], right.frames[j - 1]) <=
        maxFrameDistance
          ? table[i - 1][j - 1] + 1
          : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  const denominator = Math.min(left.frames.length, right.frames.length);
  return denominator ? table[rows - 1][columns - 1] / denominator : 0;
}

export function decideSimilarity(mediaType, score) {
  const blockThreshold =
    mediaType === "image"
      ? mediaConfig.imageBlockThreshold
      : mediaConfig.videoBlockThreshold;
  const reviewThreshold =
    mediaType === "image"
      ? mediaConfig.imageReviewThreshold
      : mediaConfig.videoReviewThreshold;
  if (score >= blockThreshold) return "block";
  if (score >= reviewThreshold) return "review";
  return "allow";
}
