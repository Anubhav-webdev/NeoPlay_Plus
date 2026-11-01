import React from "react";

/**
 * Converts a date string or timestamp to a human-readable relative string.
 * @param {string | number | Date} dateInput
 * @returns {string}
 */
export function formatTimeAgo(dateInput) {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 30) return "Just now";

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

export default function FormatDate({ date, className = "" }) {
  return <span className={className}>{formatTimeAgo(date)}</span>;
}