import { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Zap
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS — "Signal" : a late-night broadcast control room
   ============================================================ */
export const C = {
  ink: "#0A0D13",
  panel: "#13161F",
  panelAlt: "#191D2A",
  border: "#262B3C",
  blue: "#2CA8FF",
  amberDim: "#7A4324",
  purple: "#B667FF",
  paper: "#F4F0E6",
  body: "#C7CCDA",
  muted: "#7C8398",
  mutedDark: "#4B5165",
};

export const FONT_DISPLAY = "'Bebas Neue', sans-serif";

/* ============================================================
   TICKER DATA
   ============================================================ */
export const TICKER_TOP = ["#TrendingNow","#NeoPlayPlus","#CreatorHub","#GamingLive","#MovieNight","#MusicWave","#TechTalk","#SportsCenter"];
export const TICKER_BOTTOM = ["TRENDING POST · 125K INTERACTIONS","LIVE STREAM · 8.4K VIEWERS","NEW SHORT · VIRAL IN 12 COUNTRIES","CREATOR UPDATE · NEW SERIES ANNOUNCED","TOP COMMENT · COMMUNITY PICK","WATCH PARTY · STARTING NOW","EXCLUSIVE · NEO ORIGINALS", "FOR YOU · FRESH RECOMMENDATIONS"];

/* ============================================================
   HOOKS
   ============================================================ */
export function useHScroll() {
  const ref = useRef(null);
  const scroll = (dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * ref.current.clientWidth * 0.82, behavior: "smooth" });
  };
  return [ref, scroll];
}

/* ============================================================
   UI PRIMITIVES
   ============================================================ */

export function ScrollButtons({ onPrev, onNext, accent = C.blue }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onPrev}
        aria-label="Scroll left"
        className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all duration-300 active:scale-95"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        onClick={onNext}
        aria-label="Scroll right"
        className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-purple-400 hover:border-purple-500/50 transition-all duration-300 active:scale-95" >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function ChannelLabel({ title }) {
  return (
    <div className="mb-1 inline-block group">
      <h2
        style={{
          fontFamily: FONT_DISPLAY,
          color: C.paper,
          letterSpacing: "0.02em",
        }}
        className="
          relative
          text-3xl sm:text-4xl md:text-[2.75rem]
          leading-none
          transition-all duration-300 group-hover:text-purple-300 group-hover:drop-shadow-[0_0_8px_#a855f7] group-hover:drop-shadow-[0_0_20px_#9333ea]
          after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-0 after:rounded-full
          after:bg-gradient-to-r after:from-fuchsia-500 after:via-purple-500 after:to-violet-500
          after:shadow-[0_0_10px_#a855f7] after:transition-all after:duration-500 group-hover:after:w-full"
      >
        {title}
      </h2>
    </div>
  );
}




export function MarqueeTicker({ items, dim = false }) {
  const doubled = [...items, ...items];
  return (
    <div className="hide-scrollbar overflow-hidden w-full" style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, backgroundColor: `transparent` }}>
      <div className="marquee-track flex items-center gap-10 py-2.5 whitespace-nowrap" style={{ animation: "marquee 32s linear infinite", width: "max-content" }}>
        {doubled.map((t, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-2 text-xs sm:text-sm all-font  "
            style={{ color: idx % items.length === 0 ? C.blue : C.muted }}
          >
            <Zap size={11} style={{ flexShrink: 0 }} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CategoryPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 all-font"
      style={
        active
          ? { backgroundColor: C.blue, color: C.ink }
          : { backgroundColor: "transparent", color: C.muted, border: `1px solid ${C.border}` }
      }
    >
      {label}
    </button>
  );
}

/* ============================================================
   CARD
   ============================================================ */


export function StatCard({ icon: Icon, value, label, accent }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 flex items-center gap-3.5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
      <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}1f` }}>
        <Icon size={18} color={accent} />
      </div>
      <div className="min-w-0">
        <div style={{ fontFamily: FONT_DISPLAY, color: C.paper, letterSpacing: "0.02em" }} className="text-xl sm:text-2xl leading-none">{value}</div>
        <div className="text-[10px] sm:text-xs uppercase tracking-wider mt-1" style={{ color: C.muted,   }}>{label}</div>
      </div>
    </div>
  );
}
