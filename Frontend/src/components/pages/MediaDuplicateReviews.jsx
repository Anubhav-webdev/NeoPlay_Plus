import { useCallback, useEffect, useState } from "react";
import {
  decideCreatorApplication,
  decideDuplicateReview,
  getCreatorApplications,
  getDuplicateReviewQueue,
} from "../../api/mediaApi";

export default function MediaDuplicateReviews() {
  const [activeTab, setActiveTab] = useState("creators");
  const [reviews, setReviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const reloadQueues = useCallback(async (signal) => {
    try {
      const [uploads, creatorApplications] = await Promise.all([
        getDuplicateReviewQueue({ signal }),
        getCreatorApplications({ signal }),
      ]);
      if (!signal?.aborted) {
        setReviews(uploads);
        setApplications(creatorApplications);
        setError("");
      }
    } catch (loadError) {
      if (!signal?.aborted && loadError.name !== "AbortError") {
        setError(loadError.message || "Could not load admin review queues.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getDuplicateReviewQueue({ signal: controller.signal }),
      getCreatorApplications({ signal: controller.signal }),
    ])
      .then(([uploads, creatorApplications]) => {
        if (!controller.signal.aborted) {
          setReviews(uploads);
          setApplications(creatorApplications);
          setError("");
        }
      })
      .catch((loadError) => {
        if (!controller.signal.aborted && loadError.name !== "AbortError") {
          setError(loadError.message || "Could not load admin review queues.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const refresh = () => {
    setIsLoading(true);
    setError("");
    setNotice("");
    reloadQueues();
  };

  const handleDuplicateDecision = async (uploadId, decision) => {
    setActiveReviewId(uploadId);
    setError("");
    setNotice("");
    try {
      const result = await decideDuplicateReview(uploadId, decision);
      setReviews((current) => current.filter((upload) => upload._id !== uploadId));
      setNotice(
        decision === "approve"
          ? `Approved. Upload status: ${result.status}.`
          : "Rejected and removed the staged upload.",
      );
    } catch (reviewError) {
      setError(reviewError.message || "Could not save the review decision.");
    } finally {
      setActiveReviewId(null);
    }
  };

  const handleCreatorDecision = async (creatorId, status) => {
    setActiveReviewId(creatorId);
    setError("");
    setNotice("");
    try {
      const creator = await decideCreatorApplication(creatorId, status);
      setApplications((current) =>
        current.filter((application) => application._id !== creatorId),
      );
      setNotice(
        status === "approved"
          ? `${creator.displayName} is now an approved creator.`
          : `Application from ${creator.displayName} was rejected.`,
      );
    } catch (decisionError) {
      setError(decisionError.message || "Could not update creator application.");
    } finally {
      setActiveReviewId(null);
    }
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-72px)] max-w-5xl px-4 py-8 text-slate-100">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
            Admin moderation
          </p>
          <h1 className="mt-2 text-2xl font-bold">Admin review queues</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Review creator applications and possible duplicate uploads.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
        >
          Refresh queues
        </button>
      </header>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">
          {notice}
        </p>
      )}

      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Admin review queues">
        <button
          type="button"
          onClick={() => setActiveTab("creators")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === "creators" ? "bg-amber-500 text-slate-950" : "border border-slate-700 text-slate-300 hover:bg-slate-800"}`}
        >
          Creator applications ({applications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("duplicates")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === "duplicates" ? "bg-amber-500 text-slate-950" : "border border-slate-700 text-slate-300 hover:bg-slate-800"}`}
        >
          Duplicate uploads ({reviews.length})
        </button>
      </nav>

      {isLoading ? (
        <p role="status" className="py-12 text-center text-sm text-slate-400">
          Loading admin review queues…
        </p>
      ) : error ? null : activeTab === "creators" ? (
        applications.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
            No creator applications are waiting for approval.
          </p>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const isReviewing = activeReviewId === application._id;
              return (
                <article
                  key={application._id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">{application.displayName}</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {application.userId?.name || application.userId?.username || "User"}
                        {application.userId?.username ? ` · @${application.userId.username}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Applied {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200">
                      Pending
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleCreatorDecision(application._id, "approved")}
                      disabled={isReviewing}
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {isReviewing ? "Saving..." : "Approve creator"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreatorDecision(application._id, "rejected")}
                      disabled={isReviewing}
                      className="rounded-lg border border-red-500/40 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-200 hover:bg-red-950/40 disabled:opacity-50"
                    >
                      Reject application
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : reviews.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
          No uploads are waiting for duplicate review.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((upload) => {
            const match = upload.duplicateDecision?.matchAssetId;
            const score = upload.duplicateDecision?.score;
            const isReviewing = activeReviewId === upload._id;
            return (
              <article
                key={upload._id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="break-all font-semibold">{upload.originalName}</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {upload.mediaType} · uploaded by{" "}
                      {upload.ownerId?.username || upload.ownerId?.name || "unknown user"}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200">
                    {typeof score === "number" ? `${(score * 100).toFixed(1)}% match score` : "Possible match"}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-300">
                  {upload.duplicateDecision?.reason || "Possible duplicate requires review."}
                </p>
                {match && (
                  <div className="mt-3 rounded-lg bg-slate-950/70 p-3 text-xs text-slate-400">
                    Match asset: {String(match._id)} · {match.mediaType} · {match.status}
                    {match.secureUrl && (
                      <a href={match.secureUrl} target="_blank" rel="noreferrer" className="ml-2 text-cyan-300 underline">
                        View existing asset
                      </a>
                    )}
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleDuplicateDecision(upload._id, "approve")}
                    disabled={isReviewing}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {isReviewing ? "Saving..." : "Approve processing"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicateDecision(upload._id, "reject")}
                    disabled={isReviewing}
                    className="rounded-lg border border-red-500/40 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-200 hover:bg-red-950/40 disabled:opacity-50"
                  >
                    Reject upload
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
