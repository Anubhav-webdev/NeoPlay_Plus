import { apiFetch } from "./mediaApi";

export async function getContentLikeStatus(contentId, { signal } = {}) {
  if (!sessionStorage.getItem("accessToken")) {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    const response = await fetch(
      `${API_BASE_URL}/likes/${encodeURIComponent(contentId)}/status`,
      { signal },
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }
    return result.data;
  }
  const result = await apiFetch(
    `/likes/${encodeURIComponent(contentId)}/status`,
    { signal },
  );
  return result.data;
}

export async function setContentLiked(contentId, liked) {
  const result = await apiFetch(`/likes/${encodeURIComponent(contentId)}`, {
    method: liked ? "PUT" : "DELETE",
  });
  return result.data;
}
