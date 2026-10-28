import { apiFetch } from "./mediaApi";

export async function getMyWatchHistory({ signal } = {}) {
  const result = await apiFetch("/watch-history", { signal });
  return result.data.items || [];
}

export async function upsertWatchHistory(contentId, progress = 0) {
  const result = await apiFetch(
    `/watch-history/${encodeURIComponent(contentId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    },
  );
  return result.data.item;
}

export async function deleteWatchHistoryItem(contentId) {
  await apiFetch(`/watch-history/${encodeURIComponent(contentId)}`, {
    method: "DELETE",
  });
}

export async function clearMyWatchHistory() {
  const result = await apiFetch("/watch-history", { method: "DELETE" });
  return result.data.deletedCount || 0;
}
