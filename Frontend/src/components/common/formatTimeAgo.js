/**
 * Formats a date into a relative time string.
 * @param {string | Date | number} dateInput
 * @returns {string}
 */
export function formatTimeAgo(dateInput) {
  if (!dateInput) return "";

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    return typeof dateInput === "string" ? dateInput : "";
  }

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) return "Just now";

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}
