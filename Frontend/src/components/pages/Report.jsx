import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getPublishedContent } from "../../api/contentApi";
import { reportContent } from "../../api/reportsApi";

const REASONS = [
  ["spam", "Spam"],
  ["harassment", "Harassment"],
  ["hate", "Hate or abusive content"],
  ["violence", "Violence"],
  ["copyright", "Copyright infringement"],
  ["sexual", "Sexual content"],
  ["misinformation", "Misinformation"],
  ["other", "Other"],
];

export default function Report() {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [contentId, setContentId] = useState("");
  const [reason, setReason] = useState("spam");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getPublishedContent(undefined, { signal: controller.signal })
      .then(setItems)
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const submitReport = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate("/signup");
      return;
    }
    if (!contentId) {
      setError("Choose the content you want to report.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await reportContent(contentId, reason);
      setSuccess("Your report was submitted for review.");
      setContentId("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-[70vh] max-w-2xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold">Report content</h1>
      <p className="mt-2 text-sm text-gray-400">
        Choose published content and a reason. Reports are sent to the moderation queue.
      </p>
      <form onSubmit={submitReport} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <label className="block text-sm">
          Content
          <select
            value={contentId}
            onChange={(event) => setContentId(event.target.value)}
            disabled={loading}
            className="mt-2 block w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-white"
          >
            <option value="">{loading ? "Loading published content..." : "Select content"}</option>
            {items.map((item) => (
              <option key={item._id} value={item._id}>
                {item.title} ({item.type})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Reason
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-white"
          >
            {REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        {success && <p role="status" className="text-sm text-emerald-300">{success}</p>}
        <button
          type="submit"
          disabled={submitting || loading || !items.length}
          className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit report"}
        </button>
        {!loading && !items.length && !error && (
          <p className="text-sm text-gray-400">There is no published content to report right now.</p>
        )}
      </form>
    </main>
  );
}
