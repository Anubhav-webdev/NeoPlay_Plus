import { Link } from "react-router-dom";
import { FiCheckCircle, FiPlay, FiVideo } from "react-icons/fi";
import { formatTimeAgo } from "../common/formatTimeAgo";
export default function VideoCard({ video, className = "" }) {
  const category = video.category || video.Catagory;
  const timeAgo = formatTimeAgo(video.time || video.createdAt);

  return (
    <Link
      to={`/video/${video.id}`}
      className={`group block w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0f1117]/90 backdrop-blur-xl p-3 transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-950/40 ${className}`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        {video.thumb ? (
          <img
            src={video.thumb}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-500">
            <FiVideo className="h-8 w-8" />
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400 text-black shadow-lg shadow-cyan-400/30">
            <FiPlay aria-hidden="true" className="translate-x-0.5" />
          </span>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
            {video.duration}
          </span>
        )}
      </div>

      {/* Details Section */}
      <div className="flex gap-3 px-1 pt-3.5">
        {/* Avatar */}
        {video.avatar ? (
          <img
            src={video.avatar}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-transparent transition group-hover:ring-cyan-400/60"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300"
          >
            {video.channel?.charAt(0)?.toUpperCase() || "C"}
          </div>
        )}

        {/* Metadata */}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition group-hover:text-cyan-300">
            {video.title}
          </h3>

          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-400 ">
            <span>{video.channel}</span>  
            <FiCheckCircle className="h-3 w-3 shrink-1 text-cyan-400" />
            <span>
            {video.views ? `${video.views} views` : ""}
            {video.views && timeAgo ? " · " : ""}
            {timeAgo}
          </span>
          </p> 
        </div>

        {/* Category Pill */}
        {category && (
          <span className="h-fit shrink-0 rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-300 border border-cyan-400/20">
            {category}
          </span>
        )}
      </div>
    </Link>
  );
}