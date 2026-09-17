import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MdPlaylistAdd } from "react-icons/md"; 
import { FiMoreVertical } from "react-icons/fi";

// Container variant for staggered children animation
const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

// Item variant for individual card slide-in
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export default function SidebarVideoCard({ relatedVideos = [], setIsPlaying }) {
  // Handler to prevent card redirection when clicking sub-buttons
  const handleActionClick = (e, actionType, videoId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (actionType === "playlist") {
      console.log(`Add video ${videoId} to playlist`);
    } else if (actionType === "menu") {
      console.log(`Open context menu for video ${videoId}`);
    }
  };

  return (
    <aside className="flex flex-col gap-2 text-left select-none w-full max-w-[700px] all-font">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-1 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400/80">
          Related Videos ....
        </h3>
      </div>

      {/* Video List Stack with Staggered Motion */}
      <motion.div 
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2"
      >
        {relatedVideos.map((item) => (
          <motion.div key={item.id} variants={cardVariants}>
            <Link
              to={`/video/${item.id}`}
              onClick={() => setIsPlaying(false)}
              className="flex gap-3 rounded-xl p-1.5 transition-colors duration-300 ease-out 
                         bg-zinc-800/30 border border-zinc-800/40 
                         hover:bg-zinc-800/50 hover:border-zinc-700/60 hover:shadow-lg hover:shadow-black/20 
                         group relative overflow-hidden"
            >
              {/* Thumbnail Wrapper */}
              <div className="relative aspect-video w-28 sm:w-36 md:w-40 shrink-0 overflow-hidden rounded-lg bg-zinc-950 border border-zinc-800/80">
                <img
                  src={item.thumb}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                
                {/* Dark Overlay on Hover with Scale Animation */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none"
                >
                  <motion.svg 
                    initial={{ scale: 0.6 }}
                    whileHover={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="w-6 h-6 text-white drop-shadow-md" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z"/>
                  </motion.svg>
                </motion.div>

                {/* Duration Badge */}
                <span className="absolute bottom-1.5 right-1.5 rounded bg-zinc-950/80 backdrop-blur-[2px] px-1.5 py-0.5 text-[10px] font-semibold text-zinc-200 tracking-wide border border-white/5">
                  {item.duration || "12:04"}
                </span>
              </div>

              {/* Text Metadata Content */}
              <div className="flex flex-col justify-start py-0.5 min-w-0 flex-1 relative">
                <h4 className="text-sm font-semibold text-zinc-100 line-clamp-2 tracking-tight group-hover:text-cyan-500 transition-colors duration-200 leading-snug pr-2">
                  {item.title}
                </h4>
                
                <div className="mt-auto pt-1 flex items-end justify-between gap-2">
                  {/* Left metadata info column */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[12px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors truncate">
                      {item.channel}
                    </span>
                    <span className="text-[11px] text-zinc-500 tracking-normal truncate">
                      {item.views} views
                    </span>
                  </div>

                  {/* Right Action Buttons with Press Effect */}
                  <div className="flex items-center gap-0.5 shrink-0 mb-0.5">
                    {/* Playlist Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleActionClick(e, "playlist", item.id)}
                      title="Add to Playlist"
                      className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <MdPlaylistAdd className="w-5 h-5"/>
                    </motion.button>

                    {/* 3-Dot Menu Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleActionClick(e, "menu", item.id)}
                      title="More options"
                      className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <FiMoreVertical className="w-4 h-4"/>
                    </motion.button>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </aside>
  );
}