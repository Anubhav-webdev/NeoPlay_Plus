import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiSearch,
  FiTrash2,
  FiDownload,
  FiClock,
  FiBarChart2,
  FiX,
  FiBookmark,
  FiFilter,
  FiCalendar,
  FiRefreshCw,
} from "react-icons/fi";
import VideoCard from "../Video/Videocard";
import ImageCard from "../Image/ImageCard";
import {
  clearMyWatchHistory,
  deleteWatchHistoryItem,
  getMyWatchHistory,
} from "../../api/watchHistoryApi";
import { addToWishlist, getMyWishlist, removeFromWishlist } from "../../api/wishlistApi";

function toHistoryCard(record) {
  const content = record.contentId;
  if (!content?._id) return null;
  const type = content.type;
  const durationSeconds = Number(content.mediaAssetId?.metadata?.duration) || 0;
  const duration = durationSeconds
    ? `${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, "0")}`
    : "";
  const watchedAt = record.watchedAt || record.updatedAt;
  return {
    id: String(content._id),
    contentId: String(content._id),
    type,
    title: content.title || "Untitled",
    category: content.categoryIds?.[0]?.name || "General",
    thumb: content.thumbnailUrl || content.thumbnailAssetId?.secureUrl || (type === "Image" ? content.mediaUrl : ""),
    src: content.mediaUrl || "",
    channel: content.creatorId?.displayName || "Creator",
    channelAvatar: content.creatorId?.avatar || "",
    avatar: content.creatorId?.avatar || "",
    views: content.viewCount || 0,
    time: watchedAt ? new Date(watchedAt).toLocaleDateString() : "",
    watchedAt,
    progress: Number(record.progress) || 0,
    duration,
    isBackendContent: true,
    inWatchHistory: record.inWatchHistory !== false,
  };
}

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
  const user = useSelector((state) => state.auth.user);
  const [history, setHistory] = useState(items);
  const [loadingHistory, setLoadingHistory] = useState(Boolean(user));
  const [historyError, setHistoryError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("history"); // "history" | "watchLater"
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setLoadingHistory(false);
      setHistoryError("");
      return undefined;
    }
    const controller = new AbortController();
    setLoadingHistory(true);
    setHistoryError("");
    Promise.all([
      getMyWatchHistory({ signal: controller.signal }),
      getMyWishlist({ signal: controller.signal }).catch((error) => {
        if (!controller.signal.aborted) setHistoryError(`Watch history loaded, but saved items could not be loaded: ${error.message}`);
        return [];
      }),
    ])
      .then(([records, wishlistRecords]) => {
        if (controller.signal.aborted) return;
        const savedIds = new Set(wishlistRecords
          .filter((record) => record.contentId?._id)
          .map((record) => String(record.contentId._id)));
        const watched = records.map((record) => {
          const card = toHistoryCard(record);
          return card ? { ...card, inWatchHistory: true, inWatchLater: savedIds.has(card.contentId) } : null;
        }).filter(Boolean);
        const watchedIds = new Set(watched.map((item) => item.contentId));
        const savedOnly = wishlistRecords.map((record) => toHistoryCard({
          contentId: record.contentId,
          watchedAt: record.createdAt,
          progress: 0,
          inWatchHistory: false,
        })).filter((card) => card && !watchedIds.has(card.contentId))
          .map((card) => ({ ...card, inWatchHistory: false, inWatchLater: true }));
        setHistory([...watched, ...savedOnly]);
        setSelectedIds([]);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setHistoryError(error.message || "Could not load your watch history.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingHistory(false);
      });
    return () => controller.abort();
  }, [user, reloadKey]);

  // Extract unique categories from history items
  const categories = useMemo(() => {
    const cats = Array.from(new Set(history.map((item) => item.category).filter(Boolean)));
    return ["all", ...cats];
  }, [history]);

  // Actions
  const deleteItem = async (id) => {
    const item = history.find((entry) => entry.id === id);
    setHistoryError("");
    try {
      if (activeTab === "watchLater" && item?.inWatchLater) {
        await removeFromWishlist(item.contentId);
        setHistory((prev) => prev.map((entry) => (
          entry.id === id ? { ...entry, inWatchLater: false } : entry
        )).filter((entry) => entry.inWatchLater || entry.inWatchHistory));
        setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
        return;
      }
      if (item?.isBackendContent && user) await deleteWatchHistoryItem(item.contentId);
      setHistory((prev) => item?.inWatchLater
        ? prev.map((entry) => entry.id === id ? { ...entry, inWatchHistory: false } : entry)
        : prev.filter((entry) => entry.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      onRemoveItem?.(id);
    } catch (error) {
      setHistoryError(error.message || "Could not remove this history item.");
    }
  };

  const toggleWatchLater = async (id) => {
    const item = history.find((entry) => entry.id === id);
    if (!item || !user) return;
    const nextValue = !item.inWatchLater;
    setHistoryError("");
    try {
      if (nextValue) await addToWishlist(item.contentId);
      else await removeFromWishlist(item.contentId);
      setHistory((prev) => prev.map((entry) => (
        entry.id === id ? { ...entry, inWatchLater: nextValue } : entry
      )).filter((entry) => entry.inWatchLater || entry.inWatchHistory));
    } catch (error) {
      setHistoryError(error.message || "Could not update your Watch later list.");
    }
  };

  const clearAllHistory = async () => {
    if (confirm("Are you sure you want to permanently wipe your entire history?")) {
      setHistoryError("");
      try {
        if (user) await clearMyWatchHistory();
        setHistory((current) => current
          .map((item) => ({ ...item, inWatchHistory: false }))
          .filter((item) => item.inWatchLater));
        setSelectedIds([]);
        onClearHistory?.();
      } catch (error) {
        setHistoryError(error.message || "Could not clear watch history.");
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (confirm(`Delete ${selectedIds.length} selected items?`)) {
      const selected = history.filter((item) => selectedIds.includes(item.id));
      const results = await Promise.allSettled(selected.map((item) => {
        if (!item.isBackendContent || !user) return Promise.resolve();
        return activeTab === "watchLater"
          ? removeFromWishlist(item.contentId)
          : deleteWatchHistoryItem(item.contentId);
      }));
      const removed = new Set(selected.filter((_, index) => results[index].status === "fulfilled").map((item) => item.id));
      setHistory((prev) => activeTab === "watchLater"
        ? prev.map((item) => removed.has(item.id) ? { ...item, inWatchLater: false } : item)
          .filter((item) => item.inWatchLater || item.inWatchHistory)
        : prev.map((item) => removed.has(item.id) ? { ...item, inWatchHistory: false } : item)
          .filter((item) => item.inWatchLater || item.inWatchHistory));
      setSelectedIds([]);
      setHistoryError(results.some((result) => result.status === "rejected")
        ? "Some selected items could not be removed. Refresh to see the latest list."
        : "");
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
      if (activeTab === "history" && !video.inWatchHistory) return false;
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
      const secs = parseInt(parts[1], 10) || 0;
      return acc + (mins + secs / 60) * ((curr.progress ?? 0) / 100);
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
      totalItems: history.filter((item) => item.inWatchHistory).length,
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
                History <span className="text-white/50">{history.filter((item) => item.inWatchHistory).length}</span>
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
                  {selectedIds.length} item(s) selected
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
            {historyError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{historyError}</p>}
            {loadingHistory ? (
              <div role="status" className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#111116]/50 py-16 text-sm text-slate-300">
                <FiRefreshCw className="animate-spin" /> Loading your watch history…
              </div>
            ) : !user ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#111116]/50 py-16 text-center">
                <FiClock className="mx-auto mb-3 text-4xl text-slate-600" />
                <h3 className="text-sm font-bold text-white">Sign in to see your watch history</h3>
                <Link to="/signup" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500">Sign in</Link>
              </div>
            ) : totalFilteredCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 bg-[#111116]/50 rounded-2xl">
                <FiClock className="text-4xl text-slate-600 mb-3" />
                <h3 className="text-sm font-bold text-white">{history.some((item) => item.inWatchHistory) ? "No matching records" : "No watch history yet"}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">
                  {history.some((item) => item.inWatchHistory) ? "Try adjusting your search query or category filters." : "Published videos and images you open will appear here."}
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
                        <div key={video.id} className="group relative">
                          {video.type === "Image" ? (
                            <ImageCard image={{ ...video, isBackendContent: true }} />
                          ) : (
                            <VideoCard video={video} />
                          )}
                          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-lg border border-white/10 bg-black/70 px-2.5 py-1.5 text-xs text-white shadow-lg backdrop-blur">
                            <input
                              type="checkbox"
                              aria-label={`Select ${video.title}`}
                              checked={selectedIds.includes(video.id)}
                              onChange={() => toggleSelect(video.id)}
                              className="accent-indigo-500"
                            />
                            <span className="max-w-24 truncate">{video.progress}% watched</span>
                            <button
                              type="button"
                              aria-label={video.inWatchLater ? `Remove ${video.title} from Watch later` : `Save ${video.title} to Watch later`}
                              title={video.inWatchLater ? "Remove from Watch later" : "Save to Watch later"}
                              onClick={() => toggleWatchLater(video.id)}
                              className={video.inWatchLater ? "text-amber-300" : "text-slate-300 hover:text-amber-300"}
                            >
                              <FiBookmark />
                            </button>
                          </div>
                          <button
                            type="button"
                            aria-label={activeTab === "watchLater" ? `Remove ${video.title} from Watch later` : `Remove ${video.title} from watch history`}
                            onClick={() => deleteItem(video.id)}
                            className="absolute bottom-3 right-3 z-20 rounded-lg border border-white/10 bg-black/70 p-2 text-white shadow-lg backdrop-blur transition hover:bg-rose-700"
                          >
                            <FiTrash2 />
                          </button>
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
                  onClick={() => setReloadKey((value) => value + 1)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-300 bg-white/[0.02] border border-white/10 hover:bg-white/[0.06] transition-all"
                >
                  <FiRefreshCw /> REFRESH HISTORY
                </button>

                <button
                  onClick={clearAllHistory}
                  disabled={!history.some((item) => item.inWatchHistory)}
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

    </section>
  );
}
