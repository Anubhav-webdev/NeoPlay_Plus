import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Compass, Eye, Radio, Sparkles } from "lucide-react";
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
        setFeatured(
          item
            ? {
                id: item._id,
                title: item.title,
                description: item.description,
                thumb: item.thumbnailUrl || item.mediaUrl,
                views: item.viewCount || 0,
              }
            : null
        );
        setError("");
      })
      .catch((loadError) => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      });
    return () => controller.abort();
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 sm:rounded-3xl"
      style={{ borderColor: C.border }}
    >
      <div className="relative flex min-h-[440px] flex-col justify-between sm:min-h-[480px] md:min-h-[520px]">
        
        {/* Thumbnail Background */}
        {featured?.thumb && (
          <img
            src={featured.thumb}
            alt={featured?.title || "Featured background"}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
          />
        )}

        {/* Ambient Dark Gradient & Glass Overlay */}
        <div
          className="absolute inset-0 z-0 backdrop-blur-[1px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,13,19,0.75) 0%, rgba(10,13,19,0.45) 40%, rgba(10,13,19,0.98) 100%)",
          }}
        />

        {/* TOP BAR */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 p-4 sm:p-8 md:p-10">
          
          {/* 1. VIEWS BADGE (Cyan Glassmorphism) */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-slate-900/70 px-3 py-1.5 backdrop-blur-xl shadow-lg shadow-sky-500/5 sm:px-3.5"
          >
            <Eye size={14} className="shrink-0 text-sky-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide text-slate-200">
              {featured ? `${featured.views.toLocaleString()} views` : "Discover creator videos"}
            </span>
          </motion.div>

          {/* 2. NEOPLAY+ BROADCAST BADGE (Emerald Neon Badge with Pulse Indicator) */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className=" items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 backdrop-blur-xl shadow-lg shadow-emerald-500/10 sm:text-xs hidden sm:inline-flex"
          >
         
            <Radio size={13} className="shrink-0 text-emerald-400 animate-pulse" />
            <span>NeoPlay+ Broadcast</span>
          </motion.div>
        </div>

        {/* BOTTOM CONTENT AREA */}
        <div className="relative z-10 max-w-3xl p-4 pb-8 sm:p-8 sm:pb-10 md:p-10 ">
          
          {/* 3. FEATURED VIDEO TAG (Purple Neon Micro-Pill) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="inline-block"
          >
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/15 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-purple-300 backdrop-blur-md shadow-sm shadow-purple-500/20 sm:text-xs">
              <Sparkles size={13} className="text-purple-400" />
              Featured video
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              fontFamily: FONT_DISPLAY,
              color: C.paper,
              letterSpacing: "0.01em",
            }}
            className="mt-3.5 text-3xl font-black italic leading-[1.02] sm:text-5xl md:text-6xl"
          >
            {featured?.title
              ? featured.title.split(" ").slice(0, 9).join(" ")
              : "Discover NeoPlay+"}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38, duration: 0.5 }}
            className="mt-3.5 max-w-lg text-xs leading-relaxed sm:text-base"
            style={{ color: C.body }}
          >
            Videos, images, and conversations published by NeoPlay+ creators will appear here.
          </motion.p>

          {error && (
            <p role="status" className="mt-2 text-xs font-medium text-amber-300">
              Feed error: {error}
            </p>
          )}

          {/* CTA Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-4 flex flex-wrap items-center justify-between sm:justify-start gap-3 sm:gap-4"
          >
            {/* Primary Watch Button (Cyan/Blue) */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              disabled={!featured}
              onClick={() => featured && navigate(`/video/${featured.id}`)}
              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:px-7 sm:py-3.5 sm:text-sm"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              <Play
                size={16}
                fill="currentColor"
                className="shrink-0 transition-transform duration-300 group-hover:scale-110"
              />
              <span className="relative z-10">
                {featured ? "Watch Video" : "No Featured Video"}
              </span>
            </motion.button>

            {/* Secondary Browse Button (Emerald/Green) */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/videos")}
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-xs font-semibold text-emerald-300 backdrop-blur-md transition-all duration-300 hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:text-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 sm:px-7 sm:py-3.5 sm:text-sm"
            >
              <Compass
                size={17}
                className="shrink-0 text-emerald-400 transition-transform duration-300 group-hover:rotate-45"
              />
              <span>Browse Videos</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}