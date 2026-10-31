import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { C, FONT_DISPLAY } from "./homeTokens";

export function ScrollButtons({ onPrev, onNext, accent = C.blue }) {
  const buttonClass = "rounded-lg border border-zinc-800 bg-zinc-900 p-2 transition-all duration-300 active:scale-95 hover:border-[var(--scroll-accent)] hover:text-[var(--scroll-accent)]";
  const accentStyle = { "--scroll-accent": accent };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Scroll left"
        className={`${buttonClass} text-zinc-400`}
        style={accentStyle}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Scroll right"
        className={`${buttonClass} text-zinc-400`}
        style={accentStyle}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function ChannelLabel({ title }) {
  return (
    <div className="group mb-1 inline-block">
      <h2
        style={{
          fontFamily: FONT_DISPLAY,
          color: C.paper,
          letterSpacing: "0.02em",
        }}
        className="relative text-3xl leading-none transition-all duration-300 after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-0 after:rounded-full after:bg-gradient-to-r after:from-fuchsia-500 after:via-purple-500 after:to-violet-500 after:shadow-[0_0_10px_#a855f7] after:transition-all after:duration-500 group-hover:text-purple-300 group-hover:drop-shadow-[0_0_20px_#9333ea] group-hover:after:w-full sm:text-4xl md:text-[2.75rem]"
      >
        {title}
      </h2>
    </div>
  );
}

export function MarqueeTicker({ items }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];

  return (
    <div
      className="hide-scrollbar w-full overflow-hidden"
      style={{
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div
        className="marquee-track flex w-max items-center gap-10 whitespace-nowrap py-2.5"
        style={{ animation: "marquee 32s linear infinite" }}
      >
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="all-font inline-flex items-center gap-2 text-xs sm:text-sm"
            style={{ color: index % items.length === 0 ? C.blue : C.muted }}
          >
            <Zap size={11} className="shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CategoryPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="all-font shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all sm:text-sm"
      style={
        active
          ? { backgroundColor: C.blue, color: C.ink }
          : {
              backgroundColor: "transparent",
              color: C.muted,
              border: `1px solid ${C.border}`,
            }
      }
    >
      {label}
    </button>
  );
}

export function StatCard({ icon: Icon, value, label, accent }) {
  return (
    <div
      className="flex items-center gap-3.5 rounded-2xl p-4 sm:p-5"
      style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
        style={{ backgroundColor: `${accent}1f` }}
      >
        <Icon size={18} color={accent} />
      </div>
      <div className="min-w-0">
        <div
          style={{ fontFamily: FONT_DISPLAY, color: C.paper, letterSpacing: "0.02em" }}
          className="text-xl leading-none sm:text-2xl"
        >
          {value}
        </div>
        <div
          className="mt-1 text-[10px] uppercase tracking-wider sm:text-xs"
          style={{ color: C.muted }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
