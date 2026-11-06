import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HorizontalRow({
  title,
  children,
  variant = "default",
  accent = "cyan",
  className = "",
  scrollClassName,
  scrollStep = 0.75,
}) {
  const scrollRef = useRef(null);
  const isHomeVariant = variant === "home";

  const scroll = (direction) => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth * scrollStep,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`${isHomeVariant ? "" : "mb-10 relative md:max-w-[calc(100vw-120px)]"} ${className}`}
    >
      <div
        className={`flex items-center justify-between ${
          isHomeVariant ? "mb-5" : "mb-6 px-2 md:px-0"
        }`}
      >
        {isHomeVariant ? title : (
          <div className="relative inline-block  text-[#F4F0E6] text-1xl sm:text-2xl">
            {title}
          </div>
        )}
        <div
          className="hidden items-center gap-2 md:flex"
          style={{ "--scroll-accent": accent }}
        >
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className={`rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-all duration-300 active:scale-95 ${
              isHomeVariant
                ? "hover:border-[var(--scroll-accent)] hover:text-[var(--scroll-accent)]"
                : "hover:border-cyan-500/50 hover:text-cyan-400"
            }`}
          >
            <ChevronLeft size={isHomeVariant ? 16 : 20} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className={`rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-all duration-300 active:scale-95 ${
              isHomeVariant
                ? "hover:border-[var(--scroll-accent)] hover:text-[var(--scroll-accent)]"
                : "hover:border-purple-500/50 hover:text-purple-400"
            }`}
          >
            <ChevronRight size={isHomeVariant ? 16 : 20} />
          </button>
        </div>
      </div>

      {typeof children === "function" ? (
        children(scrollRef)
      ) : (
        <div
          ref={scrollRef}
          className={
            scrollClassName ||
            "flex gap-6 overflow-x-auto pb-4 px-4 md:px-2 scroll-smooth hide-scrollbar snap-x snap-mandatory"
          }
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
