import { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Eye,
  Volume2,
  Maximize2,
  Settings,
} from "lucide-react";
import { VIDEOS } from "../../constants/data";
import { C, FONT_DISPLAY  } from "./HomeConstants";

export default function HomeHeroSection({ heroPlaying, setHeroPlaying }) {
  const featured = VIDEOS[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative rounded-3xl overflow-hidden"
      style={{ border: `1px solid ${C.border}` }}
    >
      <div className="relative min-h-[420px] sm:h-[480px] md:h-[520px] flex flex-col justify-end all-font">
        <img
          src={featured.thumb}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,13,19,0.55) 0%, rgba(10,13,19,0.4) 35%, rgba(10,13,19,0.96) 100%)",
          }}
        />

        {/* top row */}
        <div className="relative z-10 flex items-center justify-between px-5 sm:px-10 pt-6">
          <div className="flex items-center gap-2.5">
            <span
              className="text-xs flex items-center gap-1.5"
              style={{ color: C.muted }}
            >
              <Eye size={12} /> 48,209 watching
            </span>
          </div>
          <span
            style={{ color: C.blue }}
            className="text-xs tracking-[0.2em] uppercase hidden sm:inline"
          >
            NeoPlay+ Broadcast
          </span>
        </div>

        {/* content */}
        <div className="relative z-10 px-5 sm:px-10 pb-7 max-w-2xl">
          <span
            className="text-xs sm:text-sm font-bold uppercase tracking-widest"
            style={{ color: C.purple }}
          >
            Channel 01 · Now Streaming
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
            className="text-4xl sm:text-6xl md:text-7xl leading-[0.95] mt-3"
          >
            Tune Into What The Internet Is Watching Right Now
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-4 text-sm sm:text-base max-w-lg"
            style={{ color: C.body }}
          >
            One signal, every format. Videos, live chatter, and galleries from
            creators worth following, all updating in real time.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex flex-wrap gap-3 mt-6"
          >
            <button
              className="px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer text-sm"
              style={{ backgroundColor: C.blue, color: C.ink }}
            >
              <Play size={14} fill={C.ink} /> Watch {featured.title}
            </button>
            <button
              className="px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl font-semibold transition-colors text-sm cursor-pointer"
              style={{ border: `1px solid ${C.border}`, color: C.paper }}
            >
              Browse Channels
            </button>
          </motion.div>
        </div>

        {/* player chrome bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-5"
        >
          <div
            className="rounded-xl px-3 sm:px-4 py-2.5 flex items-center gap-3 sm:gap-4"
            style={{
              backgroundColor: "rgba(19,22,31,0.85)",
              backdropFilter: "blur(6px)",
              border: `1px solid ${C.border}`,
            }}
          >
            <button
              onClick={() => setHeroPlaying((p) => !p)}
              className="cursor-pointer shrink-0"
              aria-label={heroPlaying ? "Pause" : "Play"}
            >
              {heroPlaying ? (
                <Pause size={16} color={C.paper} />
              ) : (
                <Play size={16} color={C.paper} />
              )}
            </button>
            <span
              className="text-[10px] sm:text-xs shrink-0"
              style={{ color: C.muted }}
            >
              04:12
            </span>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: C.border }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: C.blue }}
                initial={{ width: "0%" }}
                animate={{ width: "38%" }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <span
              className="text-[10px] sm:text-xs shrink-0"
              style={{ color: C.mutedDark }}
            >
              {featured.duration}
            </span>
            <Volume2
              size={15}
              color={C.muted}
              className="hidden sm:block shrink-0"
            />
            <Settings
              size={15}
              color={C.muted}
              className="hidden sm:block shrink-0"
            />
            <Maximize2 size={15} color={C.muted} className="shrink-0" />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

