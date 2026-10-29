import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { formatTimeAgo } from "../common/formatTimeAgo";
import {
  FiMessageCircle,
  FiHeart,
  FiShare2,
  FiMoreHorizontal,
  FiFlag,
  FiCheckCircle,
} from "react-icons/fi";
import { FaHeart as FaHeartSolid, FaTwitter } from "react-icons/fa";

import CommentsCard from "../cards/CommentsCard";
import ReportCard from "../cards/ReportCard";
import { getContentLikeStatus, setContentLiked } from "../../api/likesApi";
import {
  getCreatorSubscriptionStatus,
  setCreatorSubscribed,
} from "../../api/subscriptionsApi";
import { reportContent } from "../../api/reportsApi";

// Helper function to format timestamp as relative time (e.g., "3d ago", "2h ago")

export default function TweetCard({ tweet }) {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.likes || 0);
  const [likeError, setLikeError] = useState("");
  const [isSavingLike, setIsSavingLike] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followError, setFollowError] = useState("");
  const [isSavingFollow, setIsSavingFollow] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(tweet.commentCount || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!tweet.isBackendContent) return undefined;
    const controller = new AbortController();
    getContentLikeStatus(tweet.id, { signal: controller.signal })
      .then((status) => {
        if (!controller.signal.aborted) {
          setIsLiked(status.liked);
          setLikeCount(status.likes);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLikeError(error.message);
      });
    return () => controller.abort();
  }, [tweet.id, tweet.isBackendContent, user]);

  useEffect(() => {
    if (!tweet.creatorId || !user) return undefined;
    const controller = new AbortController();
    getCreatorSubscriptionStatus(tweet.creatorId, { signal: controller.signal })
      .then((status) => {
        if (!controller.signal.aborted) setIsFollowing(status.subscribed);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setFollowError(error.message);
      });
    return () => controller.abort();
  }, [tweet.creatorId, user]);

  const toggleLike = async () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setIsSavingLike(true);
    setLikeError("");
    try {
      const result = await setContentLiked(tweet.id, !isLiked);
      setIsLiked(result.liked);
      setLikeCount(result.likes);
    } catch (error) {
      setLikeError(error.message || "Could not update like.");
    } finally {
      setIsSavingLike(false);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    if (!tweet.creatorId) return;
    setIsSavingFollow(true);
    setFollowError("");
    try {
      const result = await setCreatorSubscribed(tweet.creatorId, !isFollowing);
      setIsFollowing(result.subscribed);
      setShowMenu(false);
    } catch (error) {
      setFollowError(error.message || "Could not update subscription.");
    } finally {
      setIsSavingFollow(false);
    }
  };

  return (
    <>
      <div className="group relative bg-[#0b0e17]/90 backdrop-blur-2xl rounded-3xl p-6 border border-purple-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_35px_rgba(168,85,247,0.15)] mt-4 overflow-hidden">
        
        {/* Vibrant Ambient Glow Accent in Background */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-purple-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/30 transition-all duration-500" />

        {/* Subtle Background Twitter/X Logo Watermark */}
        <FaTwitter className="absolute -right-6 -bottom-6 text-purple-500/10 text-[150px] pointer-events-none select-none z-0 transform -rotate-12 transition-transform duration-500 group-hover:scale-105" />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-3.5">
            <img
              src={tweet.avatar}
              alt={tweet.name}
              className="h-12 w-12 rounded-2xl object-cover ring-2 ring-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            />

            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-100 text-sm tracking-wide">
                  {tweet.name}
                </span>
                {tweet.verified && (
                  <FiCheckCircle className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" size={14} />
                )}
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                <span className="text-slate-500">@{tweet.handle}</span>
                <span className="text-slate-700">•</span>
                <span className="font-medium text-slate-400">
                  {formatTimeAgo(tweet.time || tweet.createdAt)}
                </span>
                <span className="text-slate-700">•</span>

                <button
                  onClick={toggleFollow}
                  disabled={isSavingFollow || !tweet.creatorId}
                  className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 active:scale-95 ${
                    isFollowing
                      ? "bg-slate-900 text-slate-400 border border-slate-700 hover:border-red-500/50 hover:text-red-400"
                      : "bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white shadow-sm"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            </div>
          </div>

          {/* Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="More Options"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              <FiMoreHorizontal size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-[#131722]/95 backdrop-blur-2xl rounded-2xl border border-purple-500/20 shadow-2xl z-20 overflow-hidden py-1.5">
                {isFollowing && (
                  <button
                    onClick={toggleFollow}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[0.06] transition"
                  >
                    Unfollow @{tweet.handle}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowReport(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left flex items-center space-x-2 px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition"
                >
                  <FiFlag size={13} />
                  <span>Report Post</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="mt-4 text-sm leading-relaxed text-slate-200 font-normal relative z-10">
          {tweet.content}
        </p>

        {/* Media / Preview container */}
        {tweet.mediaUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-purple-500/20 bg-black/40 relative z-10 shadow-inner">
            {tweet.mediaType === "video" ? (
              <video
                controls
                preload="metadata"
                src={tweet.mediaUrl}
                className="max-h-[460px] w-full bg-black object-contain"
              />
            ) : (
              <img
                src={tweet.mediaUrl}
                alt=""
                loading="lazy"
                className="max-h-[460px] w-full object-contain"
              />
            )}
          </div>
        ) : (
          tweet.hasPreview && (
            <div className="mt-4 rounded-2xl border border-purple-500/20 bg-purple-950/10 overflow-hidden flex flex-col sm:flex-row group/preview cursor-pointer hover:border-purple-500/50 transition relative z-10">
              <div className="h-32 sm:h-auto sm:w-28 flex-shrink-0 bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                N+
              </div>
              <div className="p-3.5 flex flex-col justify-center">
                <h4 className="text-xs font-bold text-slate-200 group-hover/preview:text-purple-400 transition">
                  #NeoPlus Support Deep Dives
                </h4>
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                  Explore updated FAQs and grid settings.
                </p>
              </div>
            </div>
          )
        )}

        {/* Actions Bar - Perfectly Aligned Icons */}
        <div className="mt-5 flex items-center justify-between border-t border-purple-500/10 pt-3 relative z-10">
          
          {/* Comment Action */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`group/btn inline-flex items-center space-x-2 text-xs font-medium transition ${
              showComments ? "text-cyan-400" : "text-slate-400 hover:text-cyan-400"
            }`}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-950/20 group-hover/btn:bg-cyan-500/15 transition shadow-sm">
              <FiMessageCircle size={15} />
            </span>
            <span>{commentsCount}</span>
          </button>

          {/* Like Action */}
          <button
            onClick={toggleLike}
            disabled={isSavingLike || !tweet.isBackendContent}
            className={`group/btn inline-flex items-center space-x-2 text-xs font-medium transition active:scale-90 ${
              isLiked ? "text-pink-500" : "text-slate-400 hover:text-pink-500"
            }`}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-950/20 group-hover/btn:bg-pink-500/15 transition shadow-sm">
              {isLiked ? (
                <FaHeartSolid size={15} className="drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
              ) : (
                <FiHeart size={15} />
              )}
            </span>
            <span>{likeCount}</span>
          </button>

          {/* Share Action */}
          <button
            title="Share"
            className="group/btn inline-flex items-center text-slate-400 hover:text-purple-400 transition"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-950/20 group-hover/btn:bg-purple-500/15 transition shadow-sm">
              <FiShare2 size={15} />
            </span>
          </button>
        </div>

        {(likeError || followError) && (
          <p role="alert" className="mt-3 text-xs text-red-400 relative z-10">
            {likeError || followError}
          </p>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-3 border-t border-purple-500/10 relative z-10">
            <CommentsCard
              contentId={tweet.isBackendContent ? tweet.id : undefined}
              onCountChange={setCommentsCount}
            />
          </div>
        )}
      </div>

      {showReport && (
        <ReportCard
          tweet={tweet}
          onClose={() => setShowReport(false)}
          onSubmit={async (reason) => {
            if (!user) {
              navigate("/signup");
              throw new Error("Sign in to report content.");
            }
            if (!tweet.isBackendContent) {
              throw new Error("This post is not available for reporting.");
            }
            await reportContent(tweet.id, reason);
            setShowReport(false);
          }}
        />
      )}
    </>
  );
}