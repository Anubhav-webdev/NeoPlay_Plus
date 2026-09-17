import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Radio, Layers } from 'lucide-react';

// Sub-component layout bindings
import ProfileHeroHub from '../../components/Profile/CreatorProfile/ProfileHeroHub';
import MediaCatalogStream from '../../components/Profile/CreatorProfile/MediaCatalogStream';
import BroadcastLogSidebar from '../../components/Profile/CreatorProfile/BroadcastLogSidebar';

// Data 
import { VIDEOS, IMAGES, initialTweets } from "../../constants/data";


const cardHover = {
  rest: { y: 0, scale: 1, boxShadow: '0px 0px 0px rgba(139, 92, 246, 0)' },
  hover: { 
    y: -6, 
    scale: 1.01, 
    boxShadow: '0px 10px 30px rgba(139, 92, 246, 0.12)',
    transition: { duration: 0.3, ease: 'easeOut' } 
  }
};

const GlassCard = ({ children, className = '', ...props }) => (
  <motion.div 
    variants={cardHover}
    initial="rest"
    whileHover="hover"
    className={`bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-[24px] p-6 text-white shadow-xl transition-colors duration-300 hover:border-purple-500/30 ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);
// Hoisted Static Data Configs
const CHANNEL_IDENTITY = {
  name: "Apex Cyber Studio",
  handle: "apex_cyber_studios",
  tagline: "High-Fidelity Engineering Pipelines & Next-Gen UI Layouts",
  bio: "Engineering real-time high-fidelity graphics tutorials, architectural devlogs, and next-gen UI design systems built directly on bare-metal canvas components.",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ApexStudio",
  banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80",
  subscribers: "842K",
  totalVideos: 42,
  isVerified: true
};
const SUMMARY_METRICS = [
  { label: 'Total Subscribers', val: CHANNEL_IDENTITY.subscribers, icon: Radio, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { label: 'Active Artifacts', val: `${CHANNEL_IDENTITY.totalVideos} Blocks`, icon: Layers, color: 'text-cyan-400', bg: 'bg-cyan-500/10' }
];

export default function CreatorProfile() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profileTab, setProfileTab] = useState('all'); 
  const [isSubscribed, setIsSubscribed] = useState(false);

const streamCatalog = useMemo(() => {
 const videos = VIDEOS.map((video) => ({
  ...video,
  id: `video-${video.id}`,
  type: "video",
  category: video.Catagory ?? "Video",
}));

const images = IMAGES.map((image) => ({
  ...image,
  id: `image-${image.id}`,
  type: "image",
  category: "Image",
}));

const tweets = initialTweets.map((tweet) => ({
  ...tweet,
  id: `tweet-${tweet.id}`,
  type: "tweet",
  title: tweet.content,
  category: "Tweet",
}));


  return [...videos, ...images, ...tweets];
}, []);
  // Memoized Filtering Framework Engine
  const filteredCatalog = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return streamCatalog.filter(item => {
      const matchesSearch = !query ||
  item.title?.toLowerCase().includes(query) ||
  item.category?.toLowerCase().includes(query);
      const matchesTab = profileTab === 'all' || item.type === profileTab;
      return matchesSearch && matchesTab;
    });
  }, [streamCatalog, searchQuery, profileTab]);

  return (
    <div className="min-h-screen bg-transparent text-slate-100 relative overflow-x-hidden antialiased selection:bg-purple-500/30 selection:text-purple-200 pb-12 all-font ">
      {/* Background Ambience Visual Overlays */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-purple-950/15 via-blue-950/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-purple-600/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-cyan-600/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 relative z-10">
        <ProfileHeroHub 
          channelIdentity={CHANNEL_IDENTITY}
          isSubscribed={isSubscribed}
          setIsSubscribed={setIsSubscribed}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-start">
          <div className="lg:col-span-2 space-y-6 ">
            {/* Quick Stat Blocks Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-2  gap-4">
              {SUMMARY_METRICS.map((item, idx) => (
                <GlassCard key={idx} className="p-4 flex flex-row items-center gap-4 min-h-[80px]">
                  <div className={`p-3 rounded-xl flex-shrink-0 ${item.bg}`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white tracking-tight mt-0.5 ">{item.val}</h3>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Child Stream Consumer Interface */}
            <div className="max-h-[calc(100vh-120px)] lg:max-h-[calc(100vh-50px)] overflow-y-auto max-w-6xl">
            <MediaCatalogStream 
              profileTab={profileTab}
              setProfileTab={setProfileTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredCatalog={filteredCatalog}
            /></div>
          </div>

          <div className="space-y-6">
            <BroadcastLogSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}