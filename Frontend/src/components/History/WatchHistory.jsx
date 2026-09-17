import { useState, useMemo } from "react";
import {
  FiSearch,
  FiTrash2,
  FiPause,
  FiPlay,
  FiDownload,
  FiClock,
  FiBarChart2,
  FiX,
  FiBookmark,
  FiFilter,
  FiCalendar,
  FiExternalLink
} from "react-icons/fi";
import VideoCard from "../Video/Videocard";
import ImageCard from "../Image/ImageCard";

/**
 * WatchHistory Component
 * @param {Array} items - List of watch history video items.
 * @param {Array} galleryImages - Images to display in the Visual Archive section.
 * @param {Array} recommendedVideos - Fresh video recommendations to display at the bottom.
 * @param {Function} onRemoveItem - Callback fired when an item is removed.
 * @param {Function} onClearHistory - Callback fired when clearing all history.
 */
export default function WatchHistory({
  items = [],
  galleryImages = [],
  recommendedVideos = [],
  onRemoveItem,
  onClearHistory
}) {
  const [history, setHistory] = useState(items);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("history"); // "history" | "watchLater"
  const [isHistoryPaused, setIsHistoryPaused] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Extract unique categories from history items
  const categories = useMemo(() => {
    const cats = Array.from(new Set(history.map((item) => item.category).filter(Boolean)));
    return ["all", ...cats];
  }, [history]);

  // Actions
  const deleteItem = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    if (onRemoveItem) onRemoveItem(id);
  };

  const toggleWatchLater = (id) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, inWatchLater: !item.inWatchLater } : item
      )
    );
  };

  const clearAllHistory = () => {
    if (confirm("Are you sure you want to permanently wipe your entire history?")) {
      setHistory([]);
      setSelectedIds([]);
      if (onClearHistory) onClearHistory();
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const deleteSelected = () => {
    if (confirm(`Delete ${selectedIds.length} selected items?`)) {
      setHistory((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
    }
  };

  const exportHistoryLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "watch_history_matrix.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Date classification helper
  const getDateGroupLabel = (dateString) => {
    if (!dateString) return "Older";
    const videoDate = new Date(dateString);
    const now = new Date();

    const diffTime = Math.abs(now - videoDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0 && now.getDate() === videoDate.getDate()) return "Today";
    if (diffDays <= 1) return "Yesterday";
    if (diffDays <= 7) return "This Week";
    return "Older";
  };

  // Group videos dynamically by date section & filter
  const groupedHistory = useMemo(() => {
    const filtered = history.filter((video) => {
      if (activeTab === "watchLater" && !video.inWatchLater) return false;

      const matchesSearch =
        video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.channel?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (categoryFilter !== "all" && video.category !== categoryFilter) {
        return false;
      }

      return true;
    });

    const groups = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Older: []
    };

    filtered.forEach((video) => {
      const label = getDateGroupLabel(video.watchedAt);
      if (groups[label]) {
        groups[label].push(video);
      } else {
        groups.Older.push(video);
      }
    });

    return groups;
  }, [history, searchQuery, categoryFilter, activeTab]);

  // Analytics Engine
  const analytics = useMemo(() => {
    const watchLaterCount = history.filter((item) => item.inWatchLater).length;
    const totalMinutes = history.reduce((acc, curr) => {
      const parts = (curr.duration || "0:0").split(":");
      const mins = parseInt(parts[0], 10) || 0;
      return acc + mins * ((curr.progress || 100) / 100);
    }, 0);

    const catCounts = history.reduce((acc, curr) => {
      if (curr.category) {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
      }
      return acc;
    }, {});

    const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

    return {
      watchTimeHours: (totalMinutes / 60).toFixed(1),
      totalVideos: history.length,
      watchLaterCount,
      topCategory
    };
  }, [history]);

  const totalFilteredCount = Object.values(groupedHistory).reduce((acc, group) => acc + group.length, 0);

  return (
    <section className="min-h-screen bg-[#080b12] text-[#F8FAFC] antialiased pb-16">
      <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Navigation */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#101923] px-5 py-6 shadow-2xl shadow-cyan-950/20 sm:px-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-40 border-cyan-300/10" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">Your viewing archive</p>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Watch history</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-400">Pick up where you left off, keep your next watch close, and revisit saved stories.</p>
            </div>

            <div className="flex w-full rounded-xl border border-white/10 bg-black/30 p-1 sm:w-auto">
              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "history"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FiClock className="text-sm" />
                History <span className="text-white/50">{history.length}</span>
              </button>
              <button
                onClick={() => setActiveTab("watchLater")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "watchLater"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FiBookmark className="text-sm" />
                Watch later <span className="text-white/50">{analytics.watchLaterCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start">
          
          {/* Main Content / Feed Column */}
          <div className="space-y-6">
            
            {/* Search Control */}
            <div className="border border-white/10 bg-[#111923] p-4 rounded-xl flex items-center justify-between shadow-lg shadow-black/10">
              <div className="relative w-full group">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search titles or channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    <FiX className="text-sm" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Tags */}
            <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-[#0e151e] px-3 py-3 scrollbar-thin">
              <span className="text-xs text-slate-400 flex items-center gap-1 pr-2 border-r border-white/10">
                <FiFilter /> Categories:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                    categoryFilter === cat
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                      : "bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.06]"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Bulk Selection Action Bar */}
            {selectedIds.length > 0 && (
              <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-200">
                  {selectedIds.length} video(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={deleteSelected}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-xs text-white transition-all"
                  >
                    <FiTrash2 /> Remove Selected
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Date Grouped Video List */}
            {totalFilteredCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 bg-[#111116]/50 rounded-2xl">
                <FiClock className="text-4xl text-slate-600 mb-3" />
                <h3 className="text-sm font-bold text-white">No records found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">
                  Try adjusting your search query or category filters.
                </p>
              </div>
            ) : (
              Object.entries(groupedHistory).map(([dateGroup, videos]) => {
                if (videos.length === 0) return null;

                return (
                  <div key={dateGroup} className="space-y-4">
                    {/* Date Section Header */}
                    <div className="flex items-center gap-2 border-b border-white/10 pb-2 pt-2">
                      <FiCalendar className="text-indigo-400 text-sm" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{dateGroup}</h3>
                      <span className="text-xs font-mono text-slate-500">({videos.length})</span>
                    </div>

                    {/* Reused VideoCard Grid */}
                    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                      {videos.map((video) => (
                        <div key={video.id} className="relative group">
                          <VideoCard
                            video={video}
                            isSelected={selectedIds.includes(video.id)}
                            onSelect={() => toggleSelect(video.id)}
                            onDelete={() => deleteItem(video.id)}
                            onToggleWatchLater={() => toggleWatchLater(video.id)}
                            onClick={() => setActiveVideoModal(video)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar / Diagnostics Controls */}
          <div className="space-y-6 xl:sticky xl:top-6">
            
            {/* System Controls */}
            <div className="bg-[#111116] border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase border-b border-white/10 pb-3">
                System Controls
              </h3>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setIsHistoryPaused(!isHistoryPaused)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                    isHistoryPaused
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isHistoryPaused ? <FiPlay className="text-sm" /> : <FiPause className="text-sm" />}
                    {isHistoryPaused ? "RESUME FEED LOGGING" : "PAUSE WATCH TIMELINE"}
                  </span>
                </button>

                <button
                  onClick={clearAllHistory}
                  disabled={history.length === 0}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-400 bg-white/[0.02] border border-white/10 hover:bg-rose-950/20 hover:border-rose-500/30 transition-all disabled:opacity-30"
                >
                  <FiTrash2 className="text-sm" /> WIPE ALL RECORDS
                </button>

                <button
                  onClick={exportHistoryLogs}
                  disabled={history.length === 0}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:text-indigo-400 bg-white/[0.02] border border-white/10 hover:bg-indigo-950/20 hover:border-indigo-500/30 transition-all disabled:opacity-30"
                >
                  <FiDownload className="text-sm" /> EXPORT JSON SCHEMA
                </button>
              </div>
            </div>

            {/* Stream Diagnostics */}
            <div className="bg-[#111116] border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase border-b border-white/10 pb-3 flex items-center gap-2">
                <FiBarChart2 className="text-indigo-400" /> Stream Diagnostics
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 border border-white/[0.03] p-3 rounded-lg">
                  <p className="text-[10px] font-mono font-bold uppercase text-slate-500">Watch Retention</p>
                  <p className="text-xl font-black text-white mt-1 font-mono">{analytics.watchTimeHours}h</p>
                </div>
                <div className="bg-black/40 border border-white/[0.03] p-3 rounded-lg">
                  <p className="text-[10px] font-mono font-bold uppercase text-slate-500">Saved Later</p>
                  <p className="text-xl font-black text-white mt-1 font-mono">{analytics.watchLaterCount}</p>
                </div>
              </div>

              <div className="bg-black/40 border border-white/[0.03] p-3.5 rounded-lg space-y-1">
                <p className="text-[10px] font-mono font-bold uppercase text-slate-500">Top Vector Category</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-200">{analytics.topCategory}</span>
                  <span className="text-[10px] font-mono text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    OPTIMIZED
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Gallery & Recommended Video Sections */}
        <section className="mt-12 border-t border-white/10 pt-8" aria-labelledby="gallery-heading">
          {galleryImages.length > 0 && (
            <>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">Visual archive</p>
                  <h2 id="gallery-heading" className="mt-1 text-2xl font-bold text-white">Image gallery</h2>
                </div>
                <span className="text-xs text-slate-500">Saved from your wider library</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {galleryImages.slice(0, 6).map((image, index) => (
                  <ImageCard
                    key={`history-image-${image.id}`}
                    image={image}
                    className={`h-48 min-h-0 sm:h-56 ${index === 0 ? "col-span-2 row-span-2 h-96 sm:h-116" : ""}`}
                  />
                ))}
              </div>
            </>
          )}

          {recommendedVideos.length > 0 && (
            <>
              <div className="mt-10 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Continue watching</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Recommended videos</h2>
                </div>
                <span className="text-xs text-slate-500">Fresh picks for your next session</span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {recommendedVideos.slice(0, 4).map((video) => (
                  <VideoCard key={`history-video-${video.id}`} video={video} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Video Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111116] border border-white/20 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setActiveVideoModal(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <FiX className="text-lg" />
            </button>

            <div className="aspect-video bg-black relative">
              <img
                src={activeVideoModal.thumbnail}
                alt={activeVideoModal.title}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <a
                  href={`https://youtube.com/watch?v=${activeVideoModal.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-xl transition-all scale-105"
                >
                  <FiExternalLink /> Watch on YouTube
                </a>
              </div>
            </div>

            <div className="p-6">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {activeVideoModal.category}
              </span>
              <h2 className="text-lg font-bold text-white mt-2">{activeVideoModal.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                {activeVideoModal.channelAvatar && (
                  <img src={activeVideoModal.channelAvatar} alt={activeVideoModal.channel} className="w-5 h-5 rounded-full" />
                )}
                <p className="text-xs text-slate-400">{activeVideoModal.channel} • {activeVideoModal.views}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}