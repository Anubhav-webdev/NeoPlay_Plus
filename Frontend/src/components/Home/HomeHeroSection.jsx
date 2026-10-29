import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play,Layers } from "lucide-react";
import { getPublishedContent } from "../../api/contentApi";
import { C, FONT_DISPLAY } from "./HomeConstants";

export default function HomeHeroSection() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getPublishedContent("Video", { signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        const item = items[0];
        setFeatured(item ? {
          id: item._id,
          title: item.title,
          description: item.description,
          thumb: item.thumbnailUrl || item.mediaUrl,
          views: item.viewCount || 0,
        } : null);
        setError("");
      })
      .catch((loadError) => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      });
    return () => controller.abort();
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl"
      style={{ border: `1px solid ${C.border}` }}
    >
      <div className="relative flex min-h-[420px] flex-col justify-end sm:h-[480px] md:h-[460px]">
        {featured?.thumb && (
          <img
            src={featured.thumb}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,13,19,0.55) 0%, rgba(10,13,19,0.4) 35%, rgba(10,13,19,0.96) 100%)",
          }}
        />
  
{/* Left Badge */}
<div className="absolute top-12 left-5 sm:left-10 z-10 inline-flex items-center rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 backdrop-blur-md">
  <span className="text-xs font-medium text-slate-400">
    {featured ? `${featured.views.toLocaleString()} views` : "Discover creator videos"}
  </span>
</div>

{/* Right Badge */}
<div className="absolute top-20 right-5 sm:right-10 z-10 hidden sm:inline-flex items-center rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 backdrop-blur-md">
  <span className="text-xl font-semibold  tracking-widest text-cyan-400 sidebar-font">
    NeoPlay+ Broadcast
  </span>
</div>

        <div className="relative z-10 max-w-2xl px-5 pb-5 sm:px-10">
          <span
            className="text-xs font-bold uppercase tracking-widest sm:text-sm"
            style={{ color: C.purple }}
          >
            {featured ? "Featured video" : "Creator platform"}
          </span>
          <motion.h1
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.2, duration: 0.5 }}
  style={{
    fontFamily: FONT_DISPLAY,
    color: C.paper,
    letterSpacing: "0.01em",
  }}
  className="mt-4 text-6xl leading-[0.95] md:text-7xl italic"
>
  {(() => {
    const title = featured?.title || "Discover NeoPlay+";
    const words = title.split(" ");
    return words.length > 6 ? words.slice(0, 6).join(" ")  : title;
  })()}
</motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="pt-4 max-w-lg text-sm sm:text-base"
            style={{ color: C.body }}
          >
          Videos, images, and conversations published by NeoPlay+ creators will appear here.
          </motion.p>
          {error && <p role="status" className="mt-2 text-xs text-amber-300">Feed error: {error}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
           <div className="mt-4 flex  gap-4 flex-row  ">
  {/* Primary Gradient Animated Button */}
  <button
    type="button"
    disabled={!featured}
    onClick={() => featured && navigate(`/video/${featured.id}`)}
    className="group/btn relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 p-[2px] font-bold text-white shadow-lg shadow-purple-900/30 transition-all duration-300 hover:shadow-purple-600/50 hover:scale-[1.02] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100" >
    {/* Glow pulse layer */}
    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 opacity-0 blur-md transition-opacity duration-300 group-hover/btn:opacity-100" />
    <span className="relative flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-zinc-950 px-4 py-3.5 text-sm transition-all duration-300 group-hover/btn:bg-opacity-0">
      <Play className="h-4 w-4 fill-white text-white transition-transform duration-300 group-hover/btn:scale-110" />
      <span className="tracking-wide">Watch Video</span>
    </span>
  </button>

  {/* Secondary Glowing White Glass Button */}
  <button
    type="button"
    disabled={!featured}
    onClick={() => featured && navigate(`/video/${featured.id}`)}
    className="group/sec relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-white/20 p-[1px] font-bold text-white shadow-lg transition-all duration-300 hover:bg-white/40 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
  >
    <span className="relative flex w-full items-center justify-center gap-2.5 rounded-[11px] bg-zinc-950/90 px-4 py-3.5 text-sm backdrop-blur-md transition-all duration-300 group-hover/sec:bg-zinc-900">
      <Layers className="h-4 w-4 text-purple-400 transition-transform duration-300 group-hover/sec:rotate-12 group-hover/sec:text-pink-400" />
      <span className="tracking-wide">View Playlist</span>
    </span>
  </button>
</div>
            
          </div>
        </div>
      </div>
    </motion.section>
  );
}
