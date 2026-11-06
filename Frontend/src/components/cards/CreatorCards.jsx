import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Flame, User2, UserCheck, Check, UserPlus } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);

  const creatorId = creator?._id || creator?.id;

  useEffect(() => {
    if (!creatorId || !user) return;
    const controller = new AbortController();

    getCreatorSubscriptionStatus(creatorId, { signal: controller.signal })
      .then((status) => {
        if (!controller.signal.aborted) setIsFollowing(status.subscribed);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [creatorId, user]);

  const toggleSubscription = async () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    if (!creatorId || isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await setCreatorSubscribed(creatorId, !isFollowing);
      setIsFollowing(result.subscribed);
    } catch (err) {
      console.error("Error toggling subscription:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = () => {
    if (creatorId) {
      navigate(`/creator/${creatorId}`);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative flex-shrink-0 w-56 min-h-[300px] flex flex-col justify-between p-5 rounded-3xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 hover:border-cyan-500/30 transition-all duration-300 shadow-xl overflow-hidden snap-start"
    >
      {/* Background Ambient Glow on Hover */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-500 pointer-events-none" />

      {/* Header Badges */}
      <div className="flex items-center justify-between w-full z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/80 border border-zinc-800/80 text-[11px] font-semibold text-zinc-400 group-hover:border-orange-500/30 transition-colors">
          <Flame size={12} className="text-orange-500 animate-pulse" />
          <span>#{displayIndex + 1}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/80 border border-zinc-800/80 text-[11px] font-medium text-zinc-400">
          <UserCheck size={13} className="text-emerald-400" />
          <span>{(creator?.subscriberCount || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Profile Details */}
      <div className="flex flex-col items-center text-center my-auto pt-2 z-10">
        <button
          type="button"
          onClick={handleNavigate}
          aria-label={`View ${creator?.name || 'creator'}'s profile`}
          className="relative w-24 h-24 mb-3.5 rounded-full p-1 bg-gradient-to-b from-zinc-700 to-zinc-900 group-hover:from-cyan-500 group-hover:to-blue-600 transition-all duration-500 cursor-pointer shadow-lg"
        >
          <div className="w-full h-full rounded-full bg-zinc-950 overflow-hidden flex items-center justify-center">
            {creator?.avatar ? (
              <img 
                src={creator.avatar} 
                alt={creator?.name || ""} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
            ) : (
              <User2 size={32} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
            )}
          </div>
        </button>

        <h3
          onClick={handleNavigate}
          className="cursor-pointer text-white font-bold text-base tracking-tight truncate max-w-full group-hover:text-cyan-400 transition-colors"
        >
          {creator?.name || "Anonymous Creator"}
        </h3>
        <p className="text-zinc-500 text-xs mt-0.5 font-medium truncate max-w-full">
          {creator?.handle || "@creator"}
        </p>
      </div>

      {/* Action Button */}
      <button 
        onClick={toggleSubscription}
        disabled={isLoading}
        className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 z-10 cursor-pointer ${
          isFollowing
            ? 'bg-zinc-800/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 hover:text-red-400 hover:border-red-500/30'
            : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-lg shadow-cyan-500/10'
        } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isFollowing ? (
          <>
            <Check size={14} className="stroke-[2.5]" />
            <span>Following</span>
          </>
        ) : (
          <>
            <UserPlus size={14} className="stroke-[2.5]" />
            <span>Follow</span>
          </>
        )}
      </button>
    </motion.div>
  );
}