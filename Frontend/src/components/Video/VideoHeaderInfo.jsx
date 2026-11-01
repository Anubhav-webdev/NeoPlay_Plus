import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCreatorSubscriptionStatus,
  setCreatorSubscribed,
} from "../../api/subscriptionsApi";
import {
  FiThumbsUp,
  FiMoreVertical,
  FiCheckCircle,
  FiShare2,
} from "react-icons/fi";
import { getContentLikeStatus, setContentLiked } from "../../api/likesApi";
import { reportContent } from "../../api/reportsApi";
import AddToPlaylistButton from "../Playlist/AddToPlaylistButton";
import { formatTimeAgo } from  '../common/formatDate'
import NumberAnimation from "../common/NumberAnimation";
import ReportCard from "../cards/ReportCard";

const confettiColors = ["#ff3b30", "#ffd60a", "#34c759", "#0a84ff", "#ff2d55", "#bf5af2", "#64d2ff"];
const confettiPieces = Array.from({ length: 32 }, (_, index) => ({
  color: confettiColors[index % confettiColors.length],
  xDirection: index % 2 ? 1 : -1,
  xDistance: 28 + (index % 8) * 8,
  yDirection: index % 3 === 0 ? -1 : 1,
  yDistance: 18 + (index % 7) * 9,
  rotation: `${index % 2 ? 1 : -1}${25 + (index % 5) * 18}deg`,
}));

export default function VideoHeaderInfo({ video }) {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeError, setLikeError] = useState("");
  const [isSavingLike, setIsSavingLike] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [isSavingSubscription, setIsSavingSubscription] = useState(false);
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!video?.id) return undefined;
    const controller = new AbortController();
    getContentLikeStatus(video.id, { signal: controller.signal })
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
  }, [video?.id, user]);

  useEffect(() => {
    if (!video?.creatorId || !user) return undefined;
    const controller = new AbortController();
    getCreatorSubscriptionStatus(video.creatorId, { signal: controller.signal })
      .then((status) => {
        if (!controller.signal.aborted) {
          setIsSubscribed(status.subscribed);
          setSubscriberCount(status.subscriberCount);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setSubscriptionError(error.message);
      });
    return () => controller.abort();
  }, [video?.creatorId, user]);

  useEffect(() => {
    if (!showSubscriptionPopup) return undefined;
    const timeoutId = setTimeout(() => setShowSubscriptionPopup(false), 2400);
    return () => clearTimeout(timeoutId);
  }, [showSubscriptionPopup]);

  const handleLike = async () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setIsSavingLike(true);
    setLikeError("");
    try {
      const result = await setContentLiked(video.id, !isLiked);
      setIsLiked(result.liked);
      setLikeCount(result.likes);
    } catch (error) {
      setLikeError(error.message || "Could not update like.");
    } finally {
      setIsSavingLike(false);
    }
  };

  const handleSubscription = async () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    if (!video?.creatorId) return;
    setIsSavingSubscription(true);
    setSubscriptionError("");
    try {
      const result = await setCreatorSubscribed(video.creatorId, !isSubscribed);
      setIsSubscribed(result.subscribed);
      setSubscriberCount(result.subscriberCount);
      if (result.subscribed) setShowSubscriptionPopup(true);
    } catch (error) {
      setSubscriptionError(error.message || "Could not update subscription.");
    } finally {
      setIsSavingSubscription(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 text-white all-font w-full max-w-full overflow-hidden">
      
      {/* 1. Title */}
      <h1 className="text-base font-bold tracking-tight text-white/95 sm:text-lg md:text-xl leading-snug text-left px-0.5 line-clamp-2 italic">
        {video?.title || "Untitled Video"}
      </h1>

      {/* 2. Responsive Channel & Control Bar */}
      <div className="flex flex-col gap-3.5 border-b border-white/10 pb-3.5 lg:flex-row lg:items-center lg:justify-between px-0.5">
        
        {/* Channel Info & Subscribe Button Block */}
        <div className="flex items-center justify-between gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-white/30 transition-all">
              <button
                type="button"
                onClick={() => video?.creatorId && navigate(`/creator/${video.creatorId}`)}
                aria-label={`View ${video?.channel || "creator"} profile`}
                className="h-full w-full cursor-pointer"
              >
                <img
                  src={video?.avatar || "/default-avatar.png"}
                  alt={video?.channel || "Channel Avatar"}
                  className="h-full w-full object-cover"
                />
              </button>
            </div>
            <div className="flex flex-col text-left truncate">
              <div className="flex items-center gap-1">
                <span className="text-sm sm:text-base font-bold text-white hover:text-white/80 transition-colors cursor-pointer truncate">
                  {video?.channel || "Unknown Channel"}
                </span>
                <FiCheckCircle className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              </div>
              <span className="text-xs text-white/50 truncate">
                <NumberAnimation value={subscriberCount} /> subscribers
              </span>
            </div>
          </div>

          {/* Animated Subscribe Button with Confetti Popup */}
          <div className="relative shrink-0">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleSubscription}
              disabled={isSavingSubscription || !video?.creatorId}
              className={`relative z-10 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-md ${
                isSubscribed
                  ? "bg-white/15 text-white hover:bg-white/25 border border-white/10"
                  : "bg-white text-black hover:bg-slate-200"
              }`}
            >
              {isSubscribed ? (
                  <span>Subscribed</span>
              ) : (
                <span>Subscribe</span>
              )}
            </motion.button>

            {subscriptionError && (
              <p role="alert" className="absolute left-0 mt-1 text-[10px] text-red-400">
                {subscriptionError}
              </p>
            )}

            {/* Confetti Micro Explosion */}
            <AnimatePresence>
              {showSubscriptionPopup && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="pointer-events-none absolute -inset-10 z-20"
                >
                  {confettiPieces.slice(0, 20).map((piece, index) => (
                    <span
                      key={`${piece.color}-${index}`}
                      className="absolute left-1/2 top-1/2 h-2.5 w-2.5 animate-[party-blast_4000ms_cubic-bezier(.2,.8,.3,1)_forwards]"
                      style={{
                        backgroundColor: piece.color,
                        clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                        animationDelay: `${index * 12}ms`,
                        "--blast-x": `${piece.xDirection * (60 + (index % 60) * 10)}px`,
                        "--blast-y": `${piece.yDirection * (12 + (index % 4) * 8)}px`,
                        "--confetti-rotation": piece.rotation,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Controls Bar (Mobile Scrollable) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none w-full lg:w-auto">
          
          {/* Animated Like Button */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center rounded-full bg-white/10 border border-white/10 shrink-0 backdrop-blur-md"
          >
            <button
              onClick={handleLike}
              disabled={isSavingLike}
              title="I like this"
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-full transition-colors ${
                isLiked
                  ? "text-sky-400 bg-sky-500/20 border border-sky-500/30"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <motion.div animate={isLiked ? { scale: [1, 1.3, 1] } : {}}>
                <FiThumbsUp className="h-4 w-4" />
              </motion.div>
              <NumberAnimation value={likeCount} />
            </button>
          </motion.div>

          {likeError && <p role="alert" className="text-xs text-red-300">{likeError}</p>}

          {/* Share Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            title="Share this video"
            className="flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3.5 py-2 text-xs font-semibold text-white/90 hover:bg-white/20 transition-all shrink-0 backdrop-blur-md"
          >
            <FiShare2 className="h-3.5 w-3.5 text-sky-400" />
            <span>Share</span>
          </motion.button>

          {/* Playlist Button */}
          <AddToPlaylistButton
            contentId={video?.id}
            contentType="Video"
            label="Save"
            className="flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3.5 py-2 text-xs font-semibold text-white/90 hover:bg-white/20 transition-all shrink-0 backdrop-blur-md"
          />

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowReport(true)}
            aria-label="Report video"
            className="shrink-0 rounded-full bg-white/10 border border-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-all"
          >
            <FiMoreVertical className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* 3. Expandable Description Details Card */}
      <motion.div
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className="rounded-2xl bg-slate-900/60 border border-white/10 p-3.5 sm:p-4 text-left transition-all duration-200 hover:bg-slate-900/80 cursor-pointer backdrop-blur-xl"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-white/90">
          <span><NumberAnimation value={video?.views || 0} compact={false} /> views</span>
          <span>{formatTimeAgo(video?.createdAt || video?.time)}</span>
        </div>

        <p className={`mt-2 text-xs sm:text-sm text-white/75 leading-relaxed max-w-4xl ${!isExpanded && "line-clamp-2"}`}>
          {video?.description || "No description provided."}
        </p>

        <span className="mt-2 inline-block text-xs font-extrabold text-sky-400 hover:text-sky-300">
          {isExpanded ? "Show less" : "...more"}
        </span>
      </motion.div>
      {showReport && (
        <ReportCard
          tweet={{ handle: video?.channel }}
          contentType="Video"
          creatorName={video?.channel || "this creator"}
          onClose={() => setShowReport(false)}
          onSubmit={async (reason) => {
            if (!user) {
              navigate("/signup");
              throw new Error("Sign in to report content.");
            }
            if (!video?.id) throw new Error("This video is not available for reporting.");
            await reportContent(video.id, reason);
            setShowReport(false);
          }}
        />
      )}
    </div>
  );
}