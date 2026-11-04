import { apiFetch } from "./mediaApi.js";

function queryString(values = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (key !== "signal" && value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getAdminOverview({ signal } = {}) {
  const result = await apiFetch("/admin/overview", { signal });
  return result.data;
}

export async function getAdminUsers(options = {}) {
  const result = await apiFetch(`/admin/users${queryString(options)}`, {
    signal: options.signal,
  });
  return result.data;
}

export async function setAdminUserRole(userId, role) {
  const result = await apiFetch(
    `/admin/users/${encodeURIComponent(userId)}/role`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  return result.data.user;
}

export async function getAdminContent(options = {}) {
  const result = await apiFetch(`/admin/content${queryString(options)}`, {
    signal: options.signal,
  });
  return result.data;
}

export async function updateAdminContent(contentId, status) {
  const result = await apiFetch(
    `/admin/content/${encodeURIComponent(contentId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  return result.data.content;
}

export async function permanentlyDeleteAdminContent(contentId) {
  const result = await apiFetch(
    `/admin/content/${encodeURIComponent(contentId)}/permanent`,
    { method: "DELETE" },
  );
  return result.data;
}

export async function getAdminReports(options = {}) {
  const result = await apiFetch(`/reports${queryString(options)}`, {
    signal: options.signal,
  });
  return result.data;
}

export async function updateAdminReport(reportId, status) {
  const result = await apiFetch(`/reports/${encodeURIComponent(reportId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return result.data.report;
}
