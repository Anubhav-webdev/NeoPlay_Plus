import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiMoreVertical, FiPlay } from "react-icons/fi";
import AddToPlaylistButton from "../Playlist/AddToPlaylistButton";

// Framer Motion variants
const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

export default function SidebarVideoCard({ relatedVideos = [], setIsPlaying }) {
  const handleMenuClick = (e, videoId) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Open context menu for video ${videoId}`);
  };

  return (
    <aside className="w-full max-w-[700px] select-none text-left">
      {/* Section Header */}
      <div className="mb-2 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Related Content
        </h3>
      </div>

      {/* Video List */}
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
              onClick={() => setIsPlaying?.(false)}
              className="group relative flex w-full gap-2.5 rounded-xl p-1.5  bg-[#0b0e17]/90 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_35px_rgba(168,85,247,0.15)] mt-4 overflow-hidden"
            >
                   <div className="absolute -top-24 -right-24 w-50 h-42 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-600/30 transition-all duration-500" />
              {/* Thumbnail Container (YouTube-styled ratio & size) */}
              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-zinc-900 sm:w-40">
                <img
                  src={item.thumb}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />

                {/* Dark Hover Overlay with Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                    <FiPlay className="ml-0.5 h-4 w-4 fill-current" />
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white tracking-wide">
                  {item.duration || "12:04"}
                </span>
              </div>

              {/* Video Metadata */}
              <div className="flex flex-1 flex-col justify-between min-w-0 py-0.5 pr-1">
                <div>
                  <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-cyan-400 sm:text-sm">
                    {item.title}
                  </h4>
                  <p className="mt-1 truncate text-[11px] font-medium text-zinc-400 hover:text-zinc-200 sm:text-xs">
                    {item.channel}
                  </p>
                  <p className="text-[10px] text-zinc-500 sm:text-[11px]">
                    {item.views} views
                  </p>
                </div>

                {/* Action Buttons (Always visible on mobile/touch, hover-triggered on desktop) */}
                <div className="flex items-center justify-end gap-1 pt-1">
                  <div onClick={(e) => e.stopPropagation()}>
                    <AddToPlaylistButton
                      contentId={item.id}
                      contentType="Video"
                      showLabel={false}
                      label="Add to playlist"
                      iconClassName="w-4 h-4"
                      className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-700/60 hover:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleMenuClick(e, item.id)}
                    title="More options"
                    className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-700/60 hover:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                  >
                    <FiMoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {relatedVideos.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-zinc-500">
            No related videos available.
          </p>
        )}
      </motion.div>
    </aside>
  );
}