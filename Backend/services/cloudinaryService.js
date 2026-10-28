import cloudinary from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import path from "node:path";

function assertConfigured() {
  const required = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new ApiError(
      503,
      `Cloudinary is not configured (${missing.join(", ")})`
    );
  }
}

// Stream upload buffers directly to Cloudinary instead of writing user media to disk.
export function uploadBuffer(
  buffer,
  { folder = "neoplay", resourceType = "auto" } = {}
) {
  assertConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        if (!result)
          return reject(new Error("Cloudinary returned no upload result"));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function deleteCloudinaryAsset(publicId, resourceType = "image") {
  if (!publicId) return;
  assertConfigured();
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
  if (!["ok", "not found"].includes(result.result)) {
    throw new Error(`Cloudinary asset deletion failed: ${result.result}`);
  }
}

// Deterministic IDs make retries idempotent if Cloudinary succeeds but MongoDB does not.
export async function uploadFile(filePath, { folder, publicId, resourceType }) {
  assertConfigured();
  try {
    return await cloudinary.uploader.upload(filePath, {
      folder,
      public_id: publicId,
      resource_type: resourceType,
      overwrite: false,
      unique_filename: false,
      use_filename: false,
      timeout: 120_000,
      tags: ["neoplay-media-asset"],
    });
  } catch (error) {
    if (!/already exists|public_id.*already/i.test(error.message || "")) throw error;
    return cloudinary.api.resource(path.posix.join(folder, publicId), {
      resource_type: resourceType,
    });
  }
}
