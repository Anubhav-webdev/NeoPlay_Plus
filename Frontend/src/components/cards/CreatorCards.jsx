import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, MoreVertical } from 'lucide-react';
import {
  getCreatorSubscriptionStatus,
  setCreatorSubscribed,
} from "../../api/subscriptionsApi";

export default function CreatorCard({ 
  creator, 
  displayIndex = 0 
}) {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!creator?._id && !creator?.id) return undefined;
    if (!user) return undefined;
    const controller = new AbortController();
    getCreatorSubscriptionStatus(creator._id || creator.id, { signal: controller.signal })
      .then((status) => {
        if (!controller.signal.aborted) setIsFollowing(status.subscribed);
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError.message);
      });
    return () => controller.abort();
  }, [creator?._id, creator?.id, user]);

  const toggleSubscription = async () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    const creatorId = creator?._id || creator?.id;
    if (!creatorId) return;
    setIsUpdating(true);
    setError("");
    try {
      const result = await setCreatorSubscribed(creatorId, !isFollowing);
      setIsFollowing(result.subscribed);
    } catch (updateError) {
      setError(updateError.message || "Could not update subscription.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Enhanced guard fallback engine: Checks if creator object or its core properties are missing
  const activeCreator = (creator && creator.name) ? creator : {
    name: creator?.username || creator?.creatorName || "Anonymous Creator",
    handle: creator?.handle || creator?.tag || "@creator"
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex-shrink-0 w-52 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 relative group snap-start flex flex-col justify-between min-h-[270px] overflow-hidden header-font"
    >
      {/* Subtle top border hover illumination glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-0 transition-opacity duration-500" />

      <div className="flex items-center justify-between w-full mb-3 relative z-10 min-h-[24px]">
        {/* Position counter indicator */}
        <div className="bg-zinc-900 border border-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded-md text-zinc-400 group-hover:border-cyan-500/40 group-hover:text-cyan-400 flex items-center gap-1 select-none">
          <Flame size={10} className="text-orange-500 animate-pulse" /> #{displayIndex + 1}
        </div>
        
        {/* Three-dot menu dynamically slides/fades in only when following */}
        {isFollowing ? (
          <motion.button 
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-md hover:bg-zinc-800/60"
          >
            <MoreVertical size={14} />
          </motion.button>
        ) : (
          /* Empty space maintainer to prevent layout shifts */
          <div className="w-5 h-5" />
        )}
      </div>

      {/* Avatar & Profile Information */}
      <div className="text-center flex-1 flex flex-col justify-center">
        <button
          type="button"
          onClick={() => activeCreator.id && navigate(`/creator/${activeCreator.id}`)}
          aria-label={`View ${activeCreator.name}'s profile`}
          className="group relative w-20 h-20 mx-auto mb-3 rounded-full p-[2px] overflow-hidden bg-zinc-800 cursor-pointer"
        >
          {/* Shutter Layer (Expands from center out on hover) */}
          <div className="absolute inset-0 scale-0 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-100" />
          
          {/* Inner Content Container */}
          <div className="relative w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-zinc-600 group-hover:text-cyan-400 transition-colors duration-300 z-10">
              {activeCreator.avatar
                ? <img src={activeCreator.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                : <TrendingUp size={26} />}
          </div>
        </button>

        <h3
          onClick={() => activeCreator.id && navigate(`/creator/${activeCreator.id}`)}
          className="cursor-pointer text-white font-semibold text-sm tracking-wide truncate group-hover:text-cyan-300 transition-colors"
        >
          {activeCreator.name}
        </h3>
        <p className="text-zinc-500 text-[11px] mt-0.5 mb-4 all-font">
          {activeCreator.handle}
        </p>
      </div>

      {/* Conditional Action Button */}
      <button 
        onClick={toggleSubscription}
        disabled={isUpdating}
        className={`w-full py-2 text-xs font-medium rounded-xl border transition-all duration-300 active:scale-[0.98] ${
          isFollowing
            ? 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:text-cyan-400 hover:border-cyan-500/40'
            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black'
        }`}
      >
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
      {error && <p role="alert" className="mt-2 text-center text-[10px] text-red-300">{error}</p>}
    </motion.div>
  );
}