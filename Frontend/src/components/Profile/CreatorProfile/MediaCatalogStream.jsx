import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Search } from 'lucide-react';

import VideoCard from  '../../Video/Videocard'
import ImageCard from '../../Image/ImageCard';
import TweetCard from "../../Tweet/TweetCard"

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Video' },
  { id: 'image', label: 'Image' },
  { id: 'tweet', label: 'Tweet' },
];

export default function MediaCatalogStream({ 
  profileTab, 
  setProfileTab, 
  searchQuery, 
  setSearchQuery, 
  filteredCatalog = [] 
}) {

  // Dynamic Factory Component Switch Router using the spread operator
  const renderCardComponent = (item) => {
    switch(item.type) {
case "video":
  return <VideoCard video={item} />;

case "image":
  return <ImageCard image={item} />;

case "tweet":
  return <TweetCard tweet={item} />;
  default:
    return null;
    }
  };

  const isStreamEmpty = useMemo(() => filteredCatalog.length === 0, [filteredCatalog]);

  return (
    <div className="space-y-6 ">
      {/* FILTER PARAMETERS CONSOLE SYSTEM BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/30 p-2 rounded-xl border border-slate-800/60 backdrop-blur-md">
        <div className="flex flex-wrap gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800/40">
          {TABS.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setProfileTab(tab.id)} 
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                profileTab === tab.id 
                  ? 'bg-slate-800 text-white shadow-sm font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar Pipeline Control Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Filter pipeline tokens..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/40 focus:border-purple-500/40 transition"
          />
        </div>
      </div>

      {/* DYNAMIC REGISTER MATRIX CATALOG MEDIA GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCatalog.map((item) => (
            <motion.div 
              key={item.id} 
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
            >
              {renderCardComponent(item)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty Configuration Registry Fallback View */}
      {isStreamEmpty && (
        <div className="text-center py-20 bg-slate-900/10 rounded-[24px] border border-dashed border-slate-800/80">
          <Video className="w-10 h-10 text-slate-700 mx-auto mb-3 stroke-[1.5]" />
          <p className="text-slate-400 font-medium text-sm">No pipeline resource modules found matching criteria.</p>
          <p className="text-slate-600 text-xs mt-1">Reset filter parameters to restart data stream grid.</p>
        </div>
      )}
    </div>
  );
}