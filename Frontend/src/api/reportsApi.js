import { apiFetch } from "./mediaApi";

export async function reportContent(contentId, reason) {
  const result = await apiFetch(
    `/reports/content/${encodeURIComponent(contentId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    },
  );
  return result.data.report;
}
