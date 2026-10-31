import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HorizontalRow({ title, children }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-10 relative md:max-w-[calc(100vw-120px)]">
      <div className="flex items-center justify-between mb-6 px-2 md:px-0 ">

<div
  className="relative inline-block title-font text-[#F4F0E6] text-3xl sm:text-4xl md:text-[2.75rem] tracking-[0.08em]after:content-[''] after:absolute after:left-0  after:-bottom-2 after:w-0  after:h-[3px]  after:bg-gradient-to-r  after:from-fuchsia-500  after:via-purple-500  after:to-violet-500 after:transition-all  after:duration-500
  hover:after:w-full ">
          {title}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all duration-300 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-purple-400 hover:border-purple-500/50 transition-all duration-300 active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 px-4 md:px-2 scroll-smooth hide-scrollbar snap-x snap-mandatory "
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  );
}
