import { useEffect, useState } from "react";
import { 
  FiThumbsUp, 
  FiThumbsDown, 
  FiMoreVertical, 
  FiCheckCircle 
} from "react-icons/fi";
import { MdPlaylistAdd } from "react-icons/md"; 
import { FaShareSquare } from "react-icons/fa";

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
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!showSubscriptionPopup) return undefined;

    const timeoutId = setTimeout(() => setShowSubscriptionPopup(false), 2600);
    return () => clearTimeout(timeoutId);
  }, [showSubscriptionPopup]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  };

  const handleDislike = () => {
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
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
              <span className="text-xs text-white/50">1.42M Subscribers</span>
            </div>
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={() => {
                const nextSubscriptionState = !isSubscribed;
                setIsSubscribed(nextSubscriptionState);
                setShowSubscriptionPopup(nextSubscriptionState);
              }}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all active:scale-95 ${
                isSubscribed 
                  ? "bg-white/10 text-white hover:bg-white/20" 
                  : "bg-white text-black hover:bg-white/90"
              } ${showSubscriptionPopup ? "animate-[button-celebrate_500ms_ease-out]" : ""}`}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </button>

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
              title="I like this"
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-l-full transition-colors ${
                isLiked ? "text-[#3b7fe0] bg-white/10" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <FiThumbsUp className="h-4 w-4" />
              <span>{video?.views ? "4.2K" : "24K"}</span>
            </button>
            
            <div className="h-4 w-px bg-white/10" />
            
            <button 
              onClick={handleDislike}
              title="I dislike this"
              className={`px-3.5 py-1.5 rounded-r-full transition-colors ${
                isDisliked ? "text-red-400 bg-white/10" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <FiThumbsDown className="h-4 w-4" />
            </button>
          </div>

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
          <span>{video?.views || "120K"} views</span>
          <span className="text-white/30">•</span>
          <span>{video?.time || "2 days ago"}</span>
        </div>
        
        <p className={`mt-2 text-sm text-white/70 leading-relaxed max-w-3xl ${!isExpanded && "line-clamp-2"}`}>
          System configuration output interface logs. Component maps trace internal routes to optimize video context trees across multi-view platform layouts.
        </p>

        <span className="mt-2 inline-block text-xs font-bold text-white/50 hover:text-white">
          {isExpanded ? "Show less" : "...more"}
        </span>
      </div>
    </div>
  );
}