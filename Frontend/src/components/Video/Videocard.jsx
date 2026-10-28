import { Link } from "react-router-dom";
import { FiCheckCircle, FiPlay, FiVideo } from "react-icons/fi";

export default function VideoCard({ video, className = "" }) {
  const category = video.category || video.Catagory;

  return (
    <Link to={`/video/${video.id}`} className={`group block w-full overflow-hidden rounded-xl border border-white/10 bg-[#121212] p-2 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-950/30 ${className}`}>
      <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
        {video.thumb ? (
          <img src={video.thumb} alt={video.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-500"><FiVideo className="h-8 w-8" /></div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 text-black shadow-lg"><FiPlay aria-hidden="true" /></span>
        </div>
        {video.duration && <span className="absolute bottom-2 right-2 rounded-xl bg-black/30 px-2 py-1 text-[10px] font-semibold text-white">{video.duration}</span>}
      </div>
      <div className="flex gap-3 px-1 pt-3">
        {video.avatar ? (
          <img src={video.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-transparent transition group-hover:ring-cyan-400/60" loading="lazy" />
        ) : (
          <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">{video.channel?.charAt(0)?.toUpperCase() || "C"}</div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold leading-snug text-white transition group-hover:text-cyan-300">{video.title}</h3>
          <p className="mt-1 truncate text-xs text-gray-400">{video.channel} <FiCheckCircle className="inline h-3 w-3 text-cyan-400" /></p>
          <p className="mt-1 text-[11px] text-gray-500">{video.views}{video.time ? ` views · ${video.time}` : ""}</p>
        </div>
        {category && <span className="h-fit shrink-0 rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-cyan-300">{category}</span>}
      </div>
    </Link>
  );
}


