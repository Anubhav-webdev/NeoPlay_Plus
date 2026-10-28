import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaRegComment,
  FaRetweet,
  FaRegHeart,
  FaHeart,
  FaShareSquare,
  FaEllipsisH,
  FaFlag,
} from "react-icons/fa";
import { FiCheckCircle } from "react-icons/fi";

import {FaQuoteLeft} from "react-icons/fa";

import CommentsCard from "../cards/CommentsCard";
import ReportCard from "../cards/ReportCard";
import { getContentLikeStatus, setContentLiked } from "../../api/likesApi";
import {
  getCreatorSubscriptionStatus,
  setCreatorSubscribed,
} from "../../api/subscriptionsApi";
import { reportContent } from "../../api/reportsApi";

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
      setFollowError(error.message || "Could not update creator subscription.");
    } finally {
      setIsSavingFollow(false);
    }
  };

  return (
    <>
      <div className="relative bg-[#0f121d] rounded-3xl p-6 border border-slate-800 shadow-xl transition-all duration-300 hover:border-slate-700 hover:shadow-purple-900/5 mt-4">

        {/* Header */}
        <div className="flex items-start justify-between">
         
          <div className="flex items-center space-x-3">
             <FaQuoteLeft className="absolute -right-1 -bottom-1 text-zinc-800/40 text-7xl pointer-events-none" />
            <img
              src={tweet.avatar}
              alt={tweet.name}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-purple-500/20"
            />

            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-100">
                  {tweet.name}
                </span>

                {tweet.verified && (
                  <FiCheckCircle
                    className="text-blue-500"
                    size={14}
                  />
                )}
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                <span>@{tweet.handle}</span>
                <span>•</span>
                <span>{tweet.time}</span>
                <span>•</span>

                <button
                  onClick={toggleFollow}
                  disabled={isSavingFollow || !tweet.creatorId}
                  className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border transition ${
                    isFollowing
                      ? "border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400"
                      : "border-purple-500/50 text-purple-400 hover:bg-purple-500 hover:text-white"
                  }`}
                >
                  <span className="font-medium">
                    {isFollowing ? "Following" : "Follow"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="More Options"
              className="text-slate-500 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
            >
              <FaEllipsisH size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1a1e2e] rounded-xl border border-slate-700 shadow-2xl z-20 overflow-hidden">

                {isFollowing && (
                  <button
                    onClick={toggleFollow}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition"
                  >
                    Unfollow @{tweet.handle}
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowReport(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
                >
                  <FaFlag size={12} />
                  <span>Report Post</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
          {tweet.content}
        </p>

        {/* Preview */}
        {tweet.mediaUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-700/50 bg-[#161a29]">
            {tweet.mediaType === "video" ? (
              <video
                controls
                preload="metadata"
                src={tweet.mediaUrl}
                className="max-h-[480px] w-full bg-black object-contain"
              />
            ) : (
              <img
                src={tweet.mediaUrl}
                alt=""
                loading="lazy"
                className="max-h-[480px] w-full object-contain"
              />
            )}
          </div>
        ) : tweet.hasPreview && (
          <div className="mt-4 rounded-2xl border border-slate-700/50 bg-[#161a29] overflow-hidden flex flex-col sm:flex-row group cursor-pointer hover:border-purple-500/50 transition">

            <div className="h-48 sm:h-28 w-full sm:w-32 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white">
              N+
            </div>

            <div className="p-4 flex flex-col justify-center">
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-purple-400 transition">
                #NeoPlus Support Deep Dives
              </h4>

              <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                Explore newly updated FAQs and grids.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center space-x-8 text-slate-500 border-t border-slate-800/60 pt-4">

          <button
            onClick={() => setShowComments(!showComments)}
            title="Comment"
            className={`flex items-center space-x-2 transition ${
              showComments
                ? "text-blue-400"
                : "hover:text-blue-400"
            }`}
          >
            <FaRegComment size={18} />
            <span className="text-sm font-medium">
              {commentsCount}
            </span>
          </button>

          <button title="Repost" className="flex items-center space-x-2 hover:text-green-400 transition">
            <FaRetweet size={18} />
            <span className="text-sm font-medium">
              {tweet.retweets}
            </span>
          </button>

          <button
            onClick={toggleLike}
            disabled={isSavingLike || !tweet.isBackendContent}
            title={isLiked ? "Unlike" : "Like"}
            className={`flex items-center space-x-2 transition ${
              isLiked
                ? "text-pink-500"
                : "hover:text-pink-500"
            }`}
          >
            {isLiked ? (
              <FaHeart size={18} />
            ) : (
              <FaRegHeart size={18} />
            )}

            <span className="text-sm font-medium">
              {likeCount}
            </span>
          </button>

          <button title="Share" className="ml-auto flex items-center space-x-2 hover:text-purple-400 transition">
            <FaShareSquare size={18} />
          </button>
        </div>
        {(likeError || followError) && <p role="alert" className="mt-2 text-xs text-red-300">{likeError || followError}</p>}

        {/* Comments */}
        {showComments && (
          <CommentsCard
            contentId={tweet.isBackendContent ? tweet.id : undefined}
            onCountChange={setCommentsCount}
          />
        )}
      </div>

      {/* Report Modal */}
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