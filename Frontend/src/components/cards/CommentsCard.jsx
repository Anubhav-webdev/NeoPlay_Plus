import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown, FiChevronRight, FiSend } from "react-icons/fi";
import { useSelector } from "react-redux";
import {
  addCommentReply,
  addContentComment,
  getCommentReplies,
  getContentComments,
} from "../../api/commentsApi";

function displayComment(comment) {
  const author = comment.userId || {};
  return {
    id: comment._id,
    user: author.name || author.username || "User",
    handle: author.username ? `@${author.username}` : "",
    text: comment.text,
    time: comment.createdAt,
    replies: [],
  };
}

function displayReply(reply) {
  const author = reply.userId || {};
  return {
    id: reply._id,
    user: author.name || author.username || "User",
    handle: author.username ? `@${author.username}` : "",
    text: reply.text,
    time: reply.createdAt,
  };
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

export default function CommentsCard({ contentId, onCountChange }) {
  const user = useSelector((state) => state.auth.user);
  const [comments, setComments] = useState([]);
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [loadedContentId, setLoadedContentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!contentId) return undefined;
    const controller = new AbortController();
    getContentComments(contentId, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setComments(result.map(displayComment));
        onCountChange?.(result.length);
        setError("");
      })
      .catch((loadError) => {
        if (!controller.signal.aborted && loadError.name !== "AbortError") {
          setError(loadError.message || "Could not load comments.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedContentId(contentId);
      });
    return () => controller.abort();
  }, [contentId, onCountChange]);
  const loading = Boolean(contentId && loadedContentId !== contentId);

  const handleAddComment = async (event) => {
    event.preventDefault();
    if (!contentId || !inputText.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const comment = await addContentComment(contentId, inputText.trim());
      setComments((current) => {
        const updated = [displayComment(comment), ...current];
        onCountChange?.(updated.length);
        return updated;
      });
      setInputText("");
    } catch (submitError) {
      setError(submitError.message || "Could not post your comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReplies = async (commentId) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies((current) => {
        const next = new Set(current);
        next.delete(commentId);
        return next;
      });
      return;
    }
    setExpandedReplies((current) => new Set(current).add(commentId));
    try {
      const replies = await getCommentReplies(commentId);
      setComments((current) => current.map((comment) => (
        comment.id === commentId
          ? { ...comment, replies: replies.map(displayReply) }
          : comment
      )));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load replies.");
    }
  };

  const handleAddReply = async (event, commentId) => {
    event.preventDefault();
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const reply = await addCommentReply(commentId, replyText.trim());
      setComments((current) => current.map((comment) => (
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, displayReply(reply)] }
          : comment
      )));
      setExpandedReplies((current) => new Set(current).add(commentId));
      setReplyText("");
      setReplyingTo(null);
    } catch (submitError) {
      setError(submitError.message || "Could not post your reply.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!contentId) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-[#0f121d] p-5 text-sm text-slate-400">
        Comments are available on published content.
      </section>
    );
  }

  return (
    <section className="w-full max-w-5xl rounded-3xl border border-slate-800/80 bg-[#0f121d] p-5 shadow-2xl sm:p-8">
      <h2 className="mb-5 text-lg font-bold text-white">
        Comments <span className="text-sm font-medium text-slate-500">({comments.length})</span>
      </h2>

      {user ? (
        <form onSubmit={handleAddComment} className="mb-6 flex gap-3">
          <input
            type="text"
            value={inputText}
            maxLength={2000}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="Write a comment..."
            aria-label="Write a comment"
            className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-[#121522] px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || submitting}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSend aria-hidden="true" />
            <span className="hidden sm:inline">Post</span>
          </button>
        </form>
      ) : (
        <p className="mb-6 text-sm text-slate-400">
          <Link to="/signup" className="text-cyan-300 hover:underline">Sign in</Link> to join the conversation.
        </p>
      )}

      {error && <p role="alert" className="mb-4 text-sm text-red-300">{error}</p>}
      {loading ? (
        <p className="py-6 text-sm text-slate-400">Loading comments...</p>
      ) : comments.length === 0 && !error ? (
        <p className="py-6 text-sm text-slate-400">No comments yet. Start the conversation.</p>
      ) : comments.length > 0 ? (
        <div className="space-y-5">
          {comments.map((comment) => {
            const repliesExpanded = expandedReplies.has(comment.id);
            return (
              <article key={comment.id} className="border-b border-slate-800/60 pb-5 last:border-0">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-sm font-bold text-white">
                    {comment.user.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-xs">
                      <span className="font-bold text-slate-200">{comment.user}</span>
                      {comment.handle && <span className="text-slate-500">{comment.handle}</span>}
                      <time className="text-slate-600">{formatTime(comment.time)}</time>
                    </div>
                    <p className="mt-1.5 break-words text-sm leading-relaxed text-slate-300">{comment.text}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500">
                      <button
                        type="button"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="hover:text-cyan-300"
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center gap-1 hover:text-cyan-300"
                      >
                        {repliesExpanded ? <FiChevronDown /> : <FiChevronRight />}
                        {repliesExpanded ? "Hide replies" : "View replies"}
                      </button>
                    </div>

                    {replyingTo === comment.id && (
                      user ? (
                        <form onSubmit={(event) => handleAddReply(event, comment.id)} className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            maxLength={2000}
                            onChange={(event) => setReplyText(event.target.value)}
                            placeholder="Write a reply..."
                            aria-label="Write a reply"
                            className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-[#121522] px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                          />
                          <button type="submit" disabled={!replyText.trim() || submitting} className="rounded-lg bg-slate-800 px-3 text-xs font-semibold text-white disabled:opacity-50">
                            Reply
                          </button>
                        </form>
                      ) : (
                        <p className="mt-3 text-xs text-slate-400"><Link to="/signup" className="text-cyan-300 hover:underline">Sign in</Link> to reply.</p>
                      )
                    )}

                    {repliesExpanded && (
                      <div className="mt-4 space-y-3 border-l-2 border-slate-800 pl-4">
                        {comment.replies.length === 0 ? (
                          <p className="text-xs text-slate-500">No replies yet.</p>
                        ) : comment.replies.map((reply) => (
                          <div key={reply.id}>
                            <div className="flex flex-wrap items-center gap-x-2 text-xs">
                              <span className="font-semibold text-slate-300">{reply.user}</span>
                              {reply.handle && <span className="text-slate-500">{reply.handle}</span>}
                              <time className="text-slate-600">{formatTime(reply.time)}</time>
                            </div>
                            <p className="mt-1 break-words text-sm text-slate-400">{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
