import { apiFetch } from "./mediaApi";

export async function getCreatorSubscriptionStatus(creatorId, { signal } = {}) {
  const result = await apiFetch(
    `/subscriptions/${encodeURIComponent(creatorId)}/status`,
    { signal },
  );
  return result.data;
}

export async function getMySubscriptions({ signal } = {}) {
  const result = await apiFetch("/subscriptions", { signal });
  return result.data.subscriptions;
}

export async function setCreatorSubscribed(creatorId, subscribed) {
  const result = await apiFetch(
    `/subscriptions/${encodeURIComponent(creatorId)}`,
    { method: subscribed ? "POST" : "DELETE" },
  );
  return result.data;
}
