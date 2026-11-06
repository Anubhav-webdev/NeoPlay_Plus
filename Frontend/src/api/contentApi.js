import { publicApiFetch } from "./mediaApi.js";

export async function getPublishedContent(type, { signal, creatorId } = {}) {
  const query = new URLSearchParams({ limit: "50" });
  if (type) query.set("type", type);
  if (creatorId) query.set("creatorId", creatorId);
  const result = await publicApiFetch(`/content?${query}`, { signal });
  return result.data.items;
}

export async function getPublishedContentById(contentId, { signal } = {}) {
  const result = await publicApiFetch(
    `/content/${encodeURIComponent(contentId)}`,
    { signal },
  );
  return result.data.content;
}

export async function recordPublishedContentView(contentId) {
  const result = await publicApiFetch(
    `/content/${encodeURIComponent(contentId)}/view`,
    { method: "POST" },
  );
  return result.data.viewCount;
}

export async function getPublishedCreators({ signal } = {}) {
  const result = await publicApiFetch("/creators?limit=50", { signal });
  return result.data.creators;
}

export async function getPublishedCreatorById(creatorId, { signal } = {}) {
  const result = await publicApiFetch(
    `/creators/${encodeURIComponent(creatorId)}`,
    { signal },
  );
  return result.data.creator;
}
