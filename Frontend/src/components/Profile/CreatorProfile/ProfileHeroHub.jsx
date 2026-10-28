import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Sparkles } from 'lucide-react';

const pulseGlow = {
  animate: {
    opacity: [0.3, 0.5, 0.3],
    scale: [1, 1.02, 1],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
  }
};

const GradientBadge = ({ children, color = 'purple' }) => {
  const colorMap = {
    purple: 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
  };
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border bg-gradient-to-r ${colorMap[color] || colorMap.purple}`}>
      {children}
    </span>
  );
};

export default function ProfileHeroHub({
  channelIdentity,
  isSubscribed,
  onToggleSubscription,
  subscriptionBusy = false,
  subscriberCount,
}) {
  const joinedDate = channelIdentity.createdAt
    ? new Date(channelIdentity.createdAt).toLocaleDateString()
    : null;
  return (
    <div className="relative rounded-[24px] overflow-hidden bg-slate-950 border border-slate-800/80 shadow-2xl ">
      {/* Cover Banner Element */}
      <div 
        className="h-48 sm:h-64 relative overflow-hidden bg-cover bg-center bg-slate-900"
        style={channelIdentity.banner ? { backgroundImage: `url(${channelIdentity.banner})` } : undefined}
      >
        <motion.div variants={pulseGlow} animate="animate" className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(0,0,0,0.4),transparent_70%)]" />
      </div>

      {/* Context Information Info Block */}
      <div className="px-6 sm:px-8 pb-8 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
        {/* Custom Cyber Avatar Container */}
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 opacity-75 blur-md animate-pulse" />
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-950 bg-slate-900 z-10">
            {channelIdentity.avatar ? (
              <img src={channelIdentity.avatar} alt={`${channelIdentity.name} avatar`} className="w-full h-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-purple-300">
                {channelIdentity.name?.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Profile Identity Data Fields */}
        <div className="flex-1 space-y-3 text-center md:text-left pt-2 md:pt-4 w-full">
          <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent sidebar-font font-stretch-50%">{channelIdentity.name}</h1>
            {channelIdentity.isVerified && <CheckCircle className="w-5 h-5 text-blue-400 fill-blue-500/15" />}
            <GradientBadge color="cyan">Creator</GradientBadge>
          </div>
          <p className="text-purple-400 text-sm">@{channelIdentity.handle}</p>
          {channelIdentity.bio && (
            <p className="text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed mx-auto md:mx-0 font-normal">
              {channelIdentity.bio}
            </p>
          )}
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs  text-slate-400 pt-1">
            {joinedDate && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-purple-400" /> Joined {joinedDate}</span>}
            {subscriberCount !== null && subscriberCount !== undefined && (
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-cyan-400" /> {subscriberCount} subscribers</span>
            )}
          </div>
        </div>

        {/* Subscriptions Activation Processor Toggle */}
        <div className="w-full md:w-auto pt-4 md:pt-0 flex-shrink-0">
          <button 
            onClick={onToggleSubscription}
            disabled={subscriptionBusy}
            className={`w-full md:w-44 px-5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-lg cursor-pointer ${
              isSubscribed 
                ? 'bg-slate-800 text-slate-400 border border-slate-700/50' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/10'
            }`}
          >
            {subscriptionBusy ? 'Updating...' : isSubscribed ? 'Unfollow' : 'Follow'}
          </button>
        </div>
      </div>
    </div>
  );
}