import { useState, useEffect } from "react";
import ImageCard from "./ImageCard";
import { IMAGES } from "../../constants/data";

export default function ImageGrid() {
  // Take the first 5 images for the animated creator slider
  const sliderImages = IMAGES.slice(0, 5);
  // Take the next two images to fill the top right layout slots
  const topRightImages = IMAGES.slice(5, 7);
  // The rest go into the staggered latest grid below
  const remainingImages = IMAGES.slice(7);

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Auto-play slider
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  const categories = ["All", ...Array.from(new Set(IMAGES.map((img) => img.category || "General")))];

  const filteredRemaining = remainingImages.filter((image) => {
    if (selectedCategory === "All") return true;
    return image.category === selectedCategory;
  });

  return (
    <section className="w-full pb-20 p-4 md:p-6 bg-transparent text-slate-900 dark:text-white">
      
      {/* TOP HEADER & FILTER */}
      <div className="flex justify-between items-center mb-6 relative  sidebar-font">
        <div className="relative group cursor-pointer">
  <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
    <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500">
      NeoShots
      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
    </span>
  </h2>
</div>
        
        {/* TOP RIGHT FILTER BUTTON */}
        <div className="relative z-30">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <span>Filter: {selectedCategory}</span>
            <svg className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 animate-fade-in">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedCategory === cat ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TOP HERO ROW (Matches wireframe top section) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        
        {/* LEFT SIDE: CREATOR GALLERY SLIDER (Spans 2 columns on large screens) */}
        <div className="lg:col-span-2 relative h-[300px] md:h-[380px] rounded-3xl overflow-hidden shadow-md bg-slate-950 group">
          {sliderImages.map((image, idx) => (
            <div
              key={`slide-${image.id}`}
              className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${idx === activeIndex ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-105 pointer-events-none"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />
              <img src={image.src || image.url} alt={image.title} className="w-full h-full object-cover" />
              
              <div className="absolute bottom-6 left-6 z-10 text-white">
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-indigo-600 rounded-full">Featured</span>
                <h3 className="text-xl md:text-2xl font-bold mt-1.5">{image.title || "Featured Gallery"}</h3>
              </div>
            </div>
          ))}

          {/* Slider Dots Indicator */}
          <div className="absolute bottom-6 right-6 z-20 flex gap-1.5">
            {sliderImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${idx === activeIndex ? "w-6 bg-white" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: TWO SIDE-BY-SIDE GALLERY CARDS */}
        {topRightImages.map((image) => (
          <div key={image.id} className="h-[300px] md:h-[380px]">
            <ImageCard image={image} />
          </div>
        ))}
      </div>

      <hr className="border-slate-200 dark:border-slate-800 my-8" />

      {/* BOTTOM SECTION: LATEST REMAINING GRID (Asymmetric Masonry Layout) */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6 [column-fill:_balance] w-full">
        {filteredRemaining.length > 0 ? (
          filteredRemaining.map((image) => (
            <div key={image.id} className="break-inside-avoid inline-block w-full">
              <ImageCard image={image} />
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-sm text-slate-400">
            No submissions match your filter settings.
          </div>
        )}
      </div>
      
    </section>
  );
}