import { apiFetch, publicApiFetch } from "./mediaApi";

export async function getContentLikeStatus(contentId, { signal } = {}) {
  if (!sessionStorage.getItem("accessToken")) {
    const result = await publicApiFetch(
      `/likes/${encodeURIComponent(contentId)}/status`,
      { signal },
    );
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
