const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function readResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      body.message || `Request failed (${response.status})`,
    );
    error.status = response.status;
    throw error;
  }
  return body;
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
  let token =
    sessionStorage.getItem("accessToken") || (await refreshAccessToken());
  const send = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

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

export async function applyAsCreator(displayName) {
  const result = await apiFetch("/creators/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
  });
  return result.data.creator;
}

export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFetch("/media/uploads", {
    method: "POST",
    body: formData,
  });
  return result.data;
}

// Video work runs in a separate worker, so the UI polls the owner-scoped status endpoint.
export async function waitForMediaUpload(uploadId, onStatus = () => {}) {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    const result = await apiFetch(
      `/media/uploads/${encodeURIComponent(uploadId)}`
    );
    const upload = result.data.upload;
    onStatus(upload.status);

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
    `Upload ${uploadId} is still processing. Check its status later.`
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

export async function getDuplicateReviewQueue({ signal } = {}) {
  const result = await apiFetch("/media/duplicate-reviews", { signal });
  return result.data.uploads;
}

export async function getCreatorApplications({ signal } = {}) {
  const result = await apiFetch("/admin/creator-applications", { signal });
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
