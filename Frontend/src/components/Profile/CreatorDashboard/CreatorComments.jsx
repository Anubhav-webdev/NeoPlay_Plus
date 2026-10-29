import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, CornerDownRight } from "lucide-react";

function ProfileAvatar({ avatar, name, className }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={`${name || "User"} profile photo`}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} flex items-center justify-center bg-slate-800 font-bold text-slate-300`}
    >
      {(name || "U").trim().charAt(0).toUpperCase()}
    </span>
  );
}

export default function CreatorComments({
  commentTab,
  setCommentTab,
  filteredComments,
  submitReplyToComment,
}) {
  const [replyDrafts, setReplyDrafts] = useState({});
  const [sendingReplies, setSendingReplies] = useState({});

  const handleReplySubmit = async (event, commentId) => {
    event.preventDefault();
    const draft = (replyDrafts[commentId] || "").trim();
    if (!draft || sendingReplies[commentId]) return;

    setSendingReplies((current) => ({ ...current, [commentId]: true }));
    try {
      const sent = await submitReplyToComment(commentId, draft);
      if (sent) {
        setReplyDrafts((current) => ({ ...current, [commentId]: "" }));
      }
    } finally {
      setSendingReplies((current) => ({ ...current, [commentId]: false }));
    }
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-800/60 bg-slate-900/40 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950/60 p-4 backdrop-blur-md">
        <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
          <MessageSquare className="h-5 w-5 text-blue-400" /> Comments Reply
        </h3>
        <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
          {["all", "video", "image", "tweet"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setCommentTab(tab)}
              className={`rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${commentTab === tab ? "bg-slate-800 text-white" : "text-slate-500"}`}
            >
              {tab === "tweet" ? "Tweets" : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[320px] flex-1 divide-y divide-slate-800/60 overflow-y-auto bg-slate-950/10">
        {filteredComments.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No comments on your published content yet.
          </p>
        ) : (
          filteredComments.map((comment) => (
            <div key={comment.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <ProfileAvatar
                    avatar={comment.avatar}
                    name={comment.author}
                    className="h-8 w-8 flex-shrink-0 rounded-xl border border-slate-800/80 bg-slate-950 text-xs"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        {comment.author}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {comment.handle}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-400">
                      {comment.text}
                    </p>
                  </div>
                </div>
                <span className="max-w-[150px] truncate rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                  {comment.assetTitle}
                </span>
              </div>

              {(comment.replies || []).map((reply) => {
                const replyUser =
                  reply.userId && typeof reply.userId === "object"
                    ? reply.userId
                    : {};
                const replyName =
                  replyUser.name ||
                  replyUser.username ||
                  (reply.isCreatorReply ? "Creator" : "User");
                return (
                  <motion.div
                    key={reply._id || `${comment.id}-${reply.text}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-11 flex items-start gap-2 rounded-xl border border-purple-500/20 bg-slate-950 p-3 text-xs"
                  >
                    <ProfileAvatar
                      avatar={replyUser.avatar}
                      name={replyName}
                      className="h-7 w-7 flex-shrink-0 rounded-full"
                    />
                    <CornerDownRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
                    <div className="min-w-0">
                      <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-widest text-purple-400">
                        {reply.isCreatorReply ? "Creator reply" : replyName}
                      </span>
                      <p className="whitespace-pre-wrap break-words text-slate-300">
                        {reply.text}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              <form
                onSubmit={(event) => handleReplySubmit(event, comment.id)}
                className="ml-11 flex gap-2"
              >
                <input
                  type="text"
                  value={replyDrafts[comment.id] || ""}
                  maxLength={2000}
                  onChange={(event) =>
                    setReplyDrafts((current) => ({
                      ...current,
                      [comment.id]: event.target.value,
                    }))
                  }
                  placeholder="Write a reply..."
                  aria-label={`Reply to ${comment.author}'s comment`}
                  disabled={Boolean(sendingReplies[comment.id])}
                  className="w-full max-w-sm rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-xs text-white transition-colors focus:border-purple-500 focus:outline-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={
                    Boolean(sendingReplies[comment.id]) ||
                    !(replyDrafts[comment.id] || "").trim()
                  }
                  className="rounded-xl border border-purple-500/40 bg-purple-600 px-3.5 text-[9px] font-bold uppercase tracking-widest text-white transition-all hover:bg-purple-500 disabled:cursor-wait disabled:opacity-50"
                >
                  {sendingReplies[comment.id] ? "Sending..." : "Reply"}
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
