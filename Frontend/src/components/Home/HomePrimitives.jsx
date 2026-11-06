import { Zap } from "lucide-react";
import { C, FONT_DISPLAY } from "./homeTokens";

export function ChannelLabel({ title }) {
  return (
    <div className="group mb-1 inline-block">
      <h2
        style={{
          fontFamily: FONT_DISPLAY,
        }}
        className="relative text-2xl leading-none transition-all duration-300 sm:text-4xl md:text-3xl"
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
