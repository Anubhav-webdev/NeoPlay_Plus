import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getCreatorSubscriptionStatus,
  setCreatorSubscribed,
} from "../../api/subscriptionsApi";
import { 
  FiThumbsUp, 
  FiMoreVertical, 
  FiCheckCircle 
} from "react-icons/fi";
import { MdPlaylistAdd } from "react-icons/md"; 
import { FaShareSquare } from "react-icons/fa";
import { getContentLikeStatus, setContentLiked } from "../../api/likesApi";

const confettiColors = ["#ff3b30", "#ffd60a", "#34c759", "#0a84ff", "#ff2d55", "#bf5af2", "#64d2ff"];
const confettiPieces = Array.from({ length: 48 }, (_, index) => ({
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

    const timeoutId = setTimeout(() => setShowSubscriptionPopup(false), 2600);
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
    <div className="flex flex-col gap-2 text-white all-font md:pl-8">
      {/* Title */}
      <h1 className="text-lg font-bold tracking-tight sm:text-xl md:text-2xl text-white/95 leading-snug text-left px-1">
        {video?.title || "Untitled Video"}
      </h1>

      {/* Channel & Action Control Bar */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between px-1">
        
        {/* Channel Details & Subscribe Button */}
        <div className="relative flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 rounded-full overflow-hidden ring-1 ring-white/10">
              <img 
                src={video?.avatar} 
                alt={video?.channel || "Channel Avatar"} 
                className="h-full w-full object-cover" 
              />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white hover:text-white/80 transition-colors cursor-pointer line-clamp-1">
                  {video?.channel || "Unknown Channel"}
                </span>
                <FiCheckCircle className="h-4 w-4 shrink-0 text-[#3b7fe0]" />
              </div>
              <span className="text-xs text-white/50">{subscriberCount.toLocaleString()} subscribers</span>
            </div>
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={handleSubscription}
              disabled={isSavingSubscription || !video?.creatorId}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all active:scale-95 ${
                isSubscribed 
                  ? "bg-white/10 text-white hover:bg-white/20" 
                  : "bg-white text-black hover:bg-white/90"
              } ${showSubscriptionPopup ? "animate-[button-celebrate_500ms_ease-out]" : ""}`}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </button>
            {subscriptionError && <p role="alert" className="mt-1 text-xs text-red-300">{subscriptionError}</p>}

            {showSubscriptionPopup && (
              <div role="status" aria-live="polite" className="pointer-events-none absolute -inset-8 z-10">
                {confettiPieces.slice(0, 24).map((piece, index) => (
                  <span
                    key={`${piece.color}-${index}`}
                    className="absolute left-1/2 top-1/2 h-3.5 w-3.5 animate-[party-blast_5000ms_cubic-bezier(.2,.8,.3,1)_forwards]"
                    style={{
                      backgroundColor: piece.color,
                      clipPath: "polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)",
                      animationDelay: `${index * 10}ms`,
                      "--blast-x": `${piece.xDirection * (78 + (index % 80) * 12)}px`,
                      "--blast-y": `${piece.yDirection * (15 + (index % 5) * 7)}px`,
                      "--confetti-rotation": piece.rotation,
                    }}
                  />

                ))}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          
          {/* Like / Dislike Split Button */}
          <div className="flex items-center rounded-full bg-white/5 border border-white/10 p-0.5 shrink-0">
            <button 
              onClick={handleLike}
              disabled={isSavingLike}
              title="I like this"
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-l-full transition-colors ${
                isLiked ? "text-[#3b7fe0] bg-white/10" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <FiThumbsUp className="h-4 w-4" />
              <span>{likeCount}</span>
            </button>
            
          </div>
          {likeError && <p role="alert" className="text-xs text-red-300">{likeError}</p>}

          {/* Share Button */}
          <button 
          title="Share this video"
          className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors shrink-0">
            <FaShareSquare className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>

          {/* Playlist Button */}
          <button
          title="Add to playlist"
          className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors shrink-0">
            <MdPlaylistAdd className="h-4 w-4" />
            <span>Add Playlist</span>
          </button>

          {/* Context Menu Button */}
          <button className="rounded-full bg-white/5 border border-white/10 p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors shrink-0">
            <FiMoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expandable Description Details Card */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="rounded-2xl bg-white/5 border border-white/5 p-4 text-left transition-all duration-200 hover:bg-white/[0.07] cursor-pointer"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
          <span>{(video?.views || 0).toLocaleString()} views</span>
          <span className="text-white/30">•</span>
          <span>{video?.time || ""}</span>
        </div>
        
        <p className={`mt-2 text-sm text-white/70 leading-relaxed max-w-3xl ${!isExpanded && "line-clamp-2"}`}>
          {video?.description || "No description provided."}
        </p>

        <span className="mt-2 inline-block text-xs font-bold text-white/50 hover:text-white">
          {isExpanded ? "Show less" : "...more"}
        </span>
      </div>
    </div>
  );
}