const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function readResponse(response, failureLabel = "Request failed") {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || `${failureLabel} (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function publicApiFetch(path, options = {}, failureLabel) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  return readResponse(response, failureLabel);
}

let refreshInProgress;

async function refreshAccessToken() {
  if (!refreshInProgress) {
    refreshInProgress = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(readResponse)
      .then((result) => {
        const token = result.data?.accessToken || result.accessToken;
        if (!token) throw new Error("Session refresh returned no access token.");
        sessionStorage.setItem("accessToken", token);
        return token;
      })
      .catch((error) => {
        sessionStorage.removeItem("accessToken");
        throw error;
      })
      .finally(() => {
        refreshInProgress = undefined;
      });
  }
  return refreshInProgress;
}

export async function apiFetch(path, options = {}) {
  const { onUploadProgress, ...requestOptions } = options;
  let token =
    sessionStorage.getItem("accessToken") || (await refreshAccessToken());
  const send = () => {
    const headers = {
      ...requestOptions.headers,
      Authorization: `Bearer ${token}`,
    };
    if (!onUploadProgress) {
      return fetch(`${API_BASE_URL}${path}`, {
        ...requestOptions,
        credentials: "include",
        headers,
      });
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const signal = requestOptions.signal;
      const cleanup = () => {
        signal?.removeEventListener("abort", abortRequest);
      };
      const abortRequest = () => xhr.abort();

      xhr.open(requestOptions.method || "GET", `${API_BASE_URL}${path}`);
      xhr.withCredentials = true;
      for (const [name, value] of Object.entries(headers)) {
        xhr.setRequestHeader(name, value);
      }
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      xhr.addEventListener("load", () => {
        cleanup();
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          json: async () => {
            try {
              return JSON.parse(xhr.responseText || "{}");
            } catch {
              return {};
            }
          },
        });
      });
      xhr.addEventListener("error", () => {
        cleanup();
        reject(new Error("Network error while uploading the file."));
      });
      xhr.addEventListener("abort", () => {
        cleanup();
        const error = new Error("The upload was cancelled.");
        error.name = "AbortError";
        reject(error);
      });
      if (signal?.aborted) {
        abortRequest();
        return;
      }
      signal?.addEventListener("abort", abortRequest, { once: true });
      xhr.send(requestOptions.body ?? null);
    });
  };

  let response = await send();
  if (response.status === 401) {
    sessionStorage.removeItem("accessToken");
    token = await refreshAccessToken();
    response = await send();
  }
  return readResponse(response);
}

export async function getMyCreatorProfile({ signal } = {}) {
  const result = await apiFetch("/creators/me", { signal });
  return result.data.creator;
}

export async function updateMyCreatorProfile(profile) {
  const result = await apiFetch("/creators/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  return result.data.creator;
}

export async function uploadUserAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFetch("/users/me/avatar", { method: "POST", body: formData });
  return result.data.user;
}

export async function uploadCreatorProfileImage(file, imageType) {
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFetch(
    "/creators/me/images/" + encodeURIComponent(imageType),
    { method: "POST", body: formData },
  );
  return result.data.creator;
}

export async function getMyCreatorAnalytics({ signal } = {}) {
  const result = await apiFetch("/creators/me/analytics", { signal });
  return result.data;
}

export async function applyAsCreator(profile) {
  const result = await apiFetch("/creators/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  return result.data.creator;
}

const uploadResumeKey = (file) =>
  `neoplay:media-upload:${encodeURIComponent(file.name)}:${file.size}:${file.lastModified}`;

async function hashChunk(chunk) {
  const digest = await crypto.subtle.digest("SHA-256", await chunk.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function uploadMediaInChunks(file, onProgress) {
  const resumeKey = uploadResumeKey(file);
  let uploadId = localStorage.getItem(resumeKey);
  let upload;
  if (uploadId) {
    try {
      const result = await apiFetch(
        `/media/uploads/${encodeURIComponent(uploadId)}`,
        { cache: "no-store" },
      );
      upload = result.data.upload;
      if (upload.status === "failed") {
        localStorage.removeItem(resumeKey);
        upload = null;
        uploadId = null;
      }
      if (upload && upload.status !== "receiving") {
        return { uploadId };
      }
      if (upload && upload.uploadSize !== file.size) {
        upload = null;
      }
    } catch (error) {
      if (error.status !== 404) throw error;
      upload = null;
    }
    if (!upload) {
      localStorage.removeItem(resumeKey);
      uploadId = null;
    }
  }

  if (!uploadId) {
    const result = await apiFetch("/media/uploads/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }),
    });
    upload = result.data;
    uploadId = upload.uploadId;
    localStorage.setItem(resumeKey, uploadId);
  }

  const chunkSize = upload.uploadChunkSize || upload.chunkSize;
  const totalChunks = upload.totalChunks || Math.ceil(file.size / chunkSize);
  const received = new Set(upload.receivedChunks || []);
  const receivedHashes = new Map(
    (upload.chunkHashes || []).map(({ index, sha256 }) => [index, sha256]),
  );
  let restartUpload = false;

  for (let index = 0; index < totalChunks; index += 1) {
    const start = index * chunkSize;
    const chunk = file.slice(start, Math.min(file.size, start + chunkSize));
    const sha256 = await hashChunk(chunk);
    if (received.has(index)) {
      if (receivedHashes.get(index) === sha256) continue;
      restartUpload = true;
      break;
    }

    await apiFetch(
      `/media/uploads/${encodeURIComponent(uploadId)}/chunks/${index}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Chunk-SHA256": sha256,
        },
        body: chunk,
        onUploadProgress: (chunkPercent) => {
          const percent = Math.floor(
            ((index + chunkPercent / 100) / totalChunks) * 100,
          );
          onProgress?.({
            percent,
            chunkIndex: index + 1,
            totalChunks,
            mode: "chunked",
          });
        },
      },
    );
    received.add(index);
    receivedHashes.set(index, sha256);
    onProgress?.({
      percent: Math.floor((received.size / totalChunks) * 100),
      chunkIndex: index + 1,
      totalChunks,
      mode: "chunked",
    });
  }

  if (restartUpload) {
    await apiFetch(`/media/uploads/${encodeURIComponent(uploadId)}`, {
      method: "DELETE",
    });
    localStorage.removeItem(resumeKey);
    return uploadMediaInChunks(file, onProgress);
  }

  await apiFetch(`/media/uploads/${encodeURIComponent(uploadId)}/finalize`, {
    method: "POST",
  });
  return { uploadId, resumeKey };
}

export async function uploadMedia(file, onProgress) {
  if (file.type.startsWith("video/")) {
    return uploadMediaInChunks(file, onProgress);
  }
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFetch("/media/uploads", {
    method: "POST",
    body: formData,
    onUploadProgress: (percent) =>
      onProgress?.({ percent, chunkIndex: 1, totalChunks: 1, mode: "single" }),
  });
  return result.data;
}

export function clearMediaUploadResume(file) {
  if (file?.type.startsWith("video/")) {
    localStorage.removeItem(uploadResumeKey(file));
  }
}

export async function getMediaUploadLimits({ signal } = {}) {
  const result = await apiFetch("/media/limits", { signal });
  return result.data;
}

// Video work runs in a separate worker, so the UI polls the owner-scoped status endpoint.
export async function waitForMediaUpload(uploadId, onStatus = () => {}) {
  const deadline = Date.now() + 60 * 60 * 1000;
  const startedAt = Date.now();
  const statusMessages = {
    receiving: "Upload received; waiting for the media worker.",
    queued: "Upload queued for verification.",
    checking: "Checking the file and looking for duplicates.",
    processing: "Processing media on the server. Large videos can take several minutes.",
  };

  while (Date.now() < deadline) {
    const result = await apiFetch(
      "/media/uploads/" + encodeURIComponent(uploadId),
      { cache: "no-store" },
    );
    const upload = result.data.upload;
    const elapsedMs = Date.now() - startedAt;
    const message = upload.status === "queued" && elapsedMs >= 60_000
      ? "Still queued. The media worker may be offline or busy; keep it running with Redis."
      : statusMessages[upload.status] || upload.status;
    onStatus(message);

    if (upload.status === "ready") return upload;
    if (upload.status === "review_required") {
      return { ...upload, reviewPending: true };
    }
    if (upload.status === "duplicate") {
      const error = new Error(
        "This media matches an existing upload and was not stored."
      );
      error.uploadStatus = upload.status;
      throw error;
    }
    if (upload.status === "failed") {
      const error = new Error(
        upload.failureReason || "Media verification failed."
      );
      error.uploadStatus = upload.status;
      throw error;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 2000));
  }
  throw new Error(
    "Upload is still processing after an hour. Check the media worker logs and Redis before retrying."
  );
}
export async function createContent(payload) {
  const result = await apiFetch("/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data.content;
}

export async function updateContentRecord(contentId, payload) {
  const result = await apiFetch(`/content/${encodeURIComponent(contentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data.content;
}

export async function publishContentRecord(contentId) {
  const result = await apiFetch(`/content/${encodeURIComponent(contentId)}/publish`, {
    method: "POST",
  });
  return result.data.content;
}

export async function archiveContent(contentId) {
  const result = await apiFetch(`/content/${encodeURIComponent(contentId)}`, {
    method: "DELETE",
  });
  return result.data.content;
}

export async function getMyContent({ signal } = {}) {
  const result = await apiFetch("/content/mine", { signal });
  return result.data.items;
}

export async function getContentCategories({ signal } = {}) {
  const result = await apiFetch("/categories", { signal });
  return result.data.categories;
}

export async function getDuplicateReviewQueue({ signal } = {}) {
  const result = await apiFetch("/media/duplicate-reviews", { signal });
  return result.data.uploads;
}

export async function getDuplicateReviewQueuePage({ page = 1, limit = 25, signal } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const result = await apiFetch(`/media/duplicate-reviews?${params}`, { signal });
  return result.data;
}

export async function getCreatorApplications({ status = "pending", signal } = {}) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const result = await apiFetch(`/admin/creator-applications${query}`, { signal });
  return result.data.creators;
}

export async function decideCreatorApplication(creatorId, status) {
  const result = await apiFetch(
    `/admin/creator-applications/${encodeURIComponent(creatorId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  return result.data.creator;
}

export async function decideDuplicateReview(uploadId, decision) {
  const result = await apiFetch(
    `/media/uploads/${encodeURIComponent(uploadId)}/review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    },
  );
  return result.data;
}
