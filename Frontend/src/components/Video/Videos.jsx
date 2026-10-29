import {useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FiVideo,
  FiSliders,
} from "react-icons/fi";
import VideoCard from "./Videocard";
import { getPublishedContent } from "../../api/contentApi";

/* Redux Actions - contentSlice manages category, sort, and refresh state */
import {
  setActiveCategory,
  setSortBy,

} from "../../redux/slices/contentSlice";

const SORT_OPTIONS = [
  { id: "newest", label: "Newest to Oldest" },
  { id: "oldest", label: "Oldest to Newest" },
  { id: "most-viewed", label: "Most Viewed" },
];

async function loadPublishedVideos(signal) {
  const items = await getPublishedContent("Video", { signal });
  return items.map((item) => ({
    id: item._id,
    title: item.title,
    views: item.viewCount || 0,
    time: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "",
    channel: item.creatorId?.displayName || "Creator",
    avatar: item.creatorId?.avatar || "",
    thumb: item.thumbnailUrl || item.thumbnailAssetId?.secureUrl || "",
    src: item.mediaUrl,
    duration: item.mediaAssetId?.metadata?.duration
      ? `${Math.floor(item.mediaAssetId.metadata.duration / 60)}:${String(Math.floor(item.mediaAssetId.metadata.duration % 60)).padStart(2, "0")}`
      : "",
    category: item.categoryIds?.[0]?.name || "General",
    createdAt: item.publishedAt || item.createdAt,
  }));
}

export default function VideoGrid() {
  const dispatch = useDispatch();

  /* Extract visual state values from Redux */
  const { activeCategory, sortBy, isRefreshing } = useSelector(
    (state) => state.content
  );
  const [publishedVideos, setPublishedVideos] = useState([]);
  const [feedError, setFeedError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    loadPublishedVideos(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setPublishedVideos(items);
          setFeedError("");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setFeedError(error.message);
        }
      });
    return () => {
      controller.abort();
    };
  }, []);

  const videos = useMemo(
    () => publishedVideos,
    [publishedVideos],
  );
  
  const categories = useMemo(
    () => ["All", ...new Set(videos.map((video) => video.category || video.Catagory).filter(Boolean))],
    [videos],
  );

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
        case "most-viewed":
          return (b.views || 0) - (a.views || 0);
        default:
          return 0;
      }
    });
  }, [activeCategory, sortBy, videos]);

  return (
    <section className="relative w-full min-w-0 bg-transparent text-slate-100 overflow-hidden">
      
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
            {categories.map((cat) => (
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

          {/* Sorting Control */}
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
          </div>

        </div>
      </div>

      {/* Main Video Presentation Stream Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-8">
        {feedError && (
          <p role="status" className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
            Could not refresh creator videos: {feedError}
          </p>
        )}
        
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
          /* Active Interactive Render Stream Grid */
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
            {filteredAndSortedVideos.map((video) => (
              <div key={video.id}>
                <VideoCard video={video} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}