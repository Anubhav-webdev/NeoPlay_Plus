import { apiFetch, publicApiFetch } from "./mediaApi";

export async function getContentComments(contentId, { signal } = {}) {
  const result = await publicApiFetch(
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
  const result = await publicApiFetch(
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
