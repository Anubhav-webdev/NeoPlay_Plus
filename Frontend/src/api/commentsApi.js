import { apiFetch } from "./mediaApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function publicGet(path, { signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return result;
}

export async function getContentComments(contentId, { signal } = {}) {
  const result = await publicGet(
    `/comments/content/${encodeURIComponent(contentId)}`,
    { signal },
  );
  return result.data.comments;
}

export async function getMyCreatorComments({ signal } = {}) {
  const result = await apiFetch("/comments/mine?limit=100", { signal });
  return result.data.comments;
}

export async function addContentComment(contentId, text) {
  const result = await apiFetch(
    `/comments/content/${encodeURIComponent(contentId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    },
  );
  return result.data.comment;
}

export async function getCommentReplies(commentId, { signal } = {}) {
  const result = await publicGet(
    `/comments/${encodeURIComponent(commentId)}/replies`,
    { signal },
  );
  return result.data.replies;
}

export async function addCommentReply(commentId, text) {
  const result = await apiFetch(
    `/comments/${encodeURIComponent(commentId)}/replies`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    },
  );
  return result.data.reply;
}
