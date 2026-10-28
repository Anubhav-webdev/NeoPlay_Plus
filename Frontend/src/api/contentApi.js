const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function readApiResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `Request failed (${response.status})`);
  }
  return body;
}

export async function getPublishedContent(type, { signal, creatorId } = {}) {
  const query = new URLSearchParams({ limit: "50" });
  if (type) query.set("type", type);
  if (creatorId) query.set("creatorId", creatorId);
  const response = await fetch(`${API_BASE_URL}/content?${query}`, { signal });
  const result = await readApiResponse(response);
  return result.data.items;
}

export async function getPublishedContentById(contentId, { signal } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/content/${encodeURIComponent(contentId)}`,
    { signal },
  );
  const result = await readApiResponse(response);
  return result.data.content;
}

export async function getPublishedCreators({ signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/creators?limit=50`, { signal });
  const result = await readApiResponse(response);
  return result.data.creators;
}

export async function getPublishedCreatorById(creatorId, { signal } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/creators/${encodeURIComponent(creatorId)}`,
    { signal },
  );
  const result = await readApiResponse(response);
  return result.data.creator;
}
