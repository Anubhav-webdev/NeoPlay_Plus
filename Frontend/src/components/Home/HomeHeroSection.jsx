import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { getPublishedContent } from "../../api/contentApi";
import { C, FONT_DISPLAY } from "./homeTokens";

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
      <div className="relative flex min-h-[420px] flex-col justify-end sm:h-[480px] md:h-[520px]">
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

        <div className="relative z-10 flex items-center justify-between px-5 pt-6 sm:px-10">
          <span className="text-xs" style={{ color: C.muted }}>
            {featured ? `${featured.views.toLocaleString()} views` : "Discover creator videos"}
          </span>
          <span
            style={{ color: C.blue }}
            className="hidden text-xs uppercase tracking-[0.2em] sm:inline"
          >
            NeoPlay+ Broadcast
          </span>
        </div>

        <div className="relative z-10 max-w-2xl px-5 pb-10 sm:px-10">
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
            className="mt-3 text-4xl leading-[0.95] sm:text-6xl md:text-7xl"
          >
            {featured?.title || "Discover NeoPlay+"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-4 max-w-lg text-sm sm:text-base"
            style={{ color: C.body }}
          >
            {featured?.description || (error
              ? "Published videos could not be loaded right now."
              : "Videos, images, and conversations published by NeoPlay+ creators will appear here.")}
          </motion.p>
          {error && <p role="status" className="mt-2 text-xs text-amber-300">Feed error: {error}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!featured}
              onClick={() => featured && navigate(`/video/${featured.id}`)}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 sm:px-7 sm:py-3.5"
              style={{ backgroundColor: C.blue, color: C.ink }}
            >
              <Play size={14} fill={C.ink} />
              {featured ? "Watch video" : "No featured video"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/videos")}
              className="cursor-pointer rounded-xl px-6 py-3 text-sm font-semibold transition-colors sm:px-7 sm:py-3.5"
              style={{ border: `1px solid ${C.border}`, color: C.paper }}
            >
              Browse videos
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
