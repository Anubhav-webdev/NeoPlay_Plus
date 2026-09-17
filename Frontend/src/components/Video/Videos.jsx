import { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FiGrid,
  FiVideo,
  FiRefreshCw,
  FiLayers,
  FiSliders,
} from "react-icons/fi";
import VideoCard from "./Videocard";
import { VIDEOS } from "../../constants/data";

/* Redux Actions - contentSlice manages layout, category, sort, and refresh state */
import {
  setActiveCategory,
  setSortBy,
  setLayout,
  setIsRefreshing,
} from "../../redux/slices/contentSlice";

// Compute unique categories dynamically from constant source data
const CATEGORIES = [
  "All",
  ...new Set(VIDEOS.map((video) => video.category || video.Catagory)),
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest to Oldest" },
  { id: "oldest", label: "Oldest to Newest" },
  { id: "top-rated", label: "Top Rated" },
  { id: "most-viewed", label: "Most Viewed" },
];

export default function VideoGrid() {
  const dispatch = useDispatch();

  /* Extract visual state values from Redux */
  const { layout, activeCategory, sortBy, isRefreshing } = useSelector(
    (state) => state.content
  );

  const videos = useMemo(() => VIDEOS, []);

  /* Filter and Sort logic executed memoized to prevent lag during re-renders */
  const filteredAndSortedVideos = useMemo(() => {
    let result =
      activeCategory === "All"
        ? [...videos]
        : videos.filter(
            (video) => (video.category || video.Catagory) === activeCategory
          );

    return result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.uploadDate || b.createdAt) -
            new Date(a.uploadDate || a.createdAt)
          );
        case "oldest":
          return (
            new Date(a.uploadDate || a.createdAt) -
            new Date(b.uploadDate || b.createdAt)
          );
        case "top-rated":
          return (b.rating || 0) - (a.rating || 0);
        case "most-viewed":
          return (b.views || 0) - (a.views || 0);
        default:
          return 0;
      }
    });
  }, [activeCategory, sortBy, videos]);

  /* Mock stream synchronization trigger */
  const handleRefresh = () => {
    dispatch(setIsRefreshing(true));
    setTimeout(() => dispatch(setIsRefreshing(false)), 1000);
  };

  return (
    <section className="relative w-full min-w-0 bg-transparent text-slate-100 overflow-hidden">
      {/* Decorative background ambient glows */}
     

      {/* Sticky Top Filter & Control Panel */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-transparent border-b border-white/[0.06] transition-all duration-300">
        <div className="px-6 py-5 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between max-w-[1600px] mx-auto">
          
          {/* Logo Branding */}
          <div className="relative group cursor-pointer">
            <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 sidebar-font">
                NeoVideos
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
              </span>
            </h2>
          </div>

          {/* Horizontal Category Pill Scrollbar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-none snap-x">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => dispatch(setActiveCategory(cat))}
                className={`snap-center px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 whitespace-nowrap border ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "bg-white/[0.03] text-gray-400 border-white/[0.05] hover:border-white/20 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sorting and Grid System Layout Controls */}
          <div className="flex items-center gap-3 flex-wrap justify-between xl:justify-end">
            <div className="relative flex items-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 transition-all duration-300 hover:border-cyan-500/40">
              <FiSliders className="text-xs text-cyan-400 mr-2" />
              <select
                value={sortBy}
                onChange={(e) => dispatch(setSortBy(e.target.value))}
                className="bg-transparent text-xs font-mono tracking-wide text-gray-300 focus:outline-none cursor-pointer pr-2 appearance-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id} className="bg-[#0d0d12] text-slate-200">
                    {option.label.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex rounded-xl p-1 bg-black/40 border border-white/[0.08] backdrop-blur-md items-center">
              {[
                { id: "grid", icon: <FiGrid /> },
                { id: "dense", icon: <FiLayers /> },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => dispatch(setLayout(mode.id))}
                  className={`p-2.5 rounded-lg text-sm transition-all duration-300 ${
                    layout === mode.id
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                  title={`${mode.id.toUpperCase()} VIEW`}
                >
                  {mode.icon}
                </button>
              ))}
              
              <button
                key="refresh-btn"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all duration-300 disabled:opacity-50"
                title="SYNC FEED"
              >
                <FiRefreshCw className={`${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
              </button>
            </div>
          </div>

        </div>
      </div> {/* Fixed: Added missing closing tag for sticky header container wrapper */}

      {/* Main Video Presentation Stream Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-8">
        {isRefreshing ? (
          /* Loading State Overlay View */
          <div className="flex flex-col items-center justify-center py-40">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-fuchsia-500/10 border-b-fuchsia-400 animate-spin [animation-direction:reverse]" />
            </div>
            <p className="mt-4 text-xs font-mono text-cyan-400 tracking-widest animate-pulse">Loading...</p>
          </div>
        ) : filteredAndSortedVideos.length === 0 ? (
          /* Empty Search Filter Exception Notice View */
          <div className="flex flex-col items-center justify-center py-32 rounded-3xl border border-dashed border-white/10 bg-gradient-to-b from-white/[0.01] to-transparent">
            <div className="relative rounded-full bg-gradient-to-tr from-cyan-500/10 to-fuchsia-500/10 p-8 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <FiVideo className="text-4xl text-cyan-400 animate-pulse" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white tracking-wide">NO BEACONS FOUND</h3>
            <p className="mt-2 text-sm text-gray-400 text-center max-w-sm font-light">
              The neural stream is empty. Check back shortly for incoming data transmissions.
            </p>
          </div>
        ) : (
          /* Active Interactive Render Stream Blocks */
          <>
            {/* Standard Grid Mode Layout */}
            {layout === "grid" && (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                {filteredAndSortedVideos.map((video) => (
                  <div key={video.id}>
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
            )}
            
            {/* High Density Compact Mode Layout */}
            {layout === "dense" && (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {filteredAndSortedVideos.map((video) => (
                  <div key={video.id}>
                    <div className="scale-95 group-hover:scale-100 transition-transform duration-300 rounded-lg overflow-hidden">
                      <VideoCard video={video} />
                    </div>
                  </div> /* Fixed: Added missing closing div tag for video loop node wrapper */
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}