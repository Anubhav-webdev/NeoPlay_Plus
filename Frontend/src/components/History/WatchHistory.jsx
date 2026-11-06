import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiSearch,
  FiTrash2,
  FiClock,
  FiX,
  FiBookmark,
  FiFilter,
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

export default function WatchHistory({
  onRemoveItem,
  onClearHistory
}) {
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id || user?.id;
  const normalizedUserId = userId ? String(userId) : null;
  const [historyState, setHistoryState] = useState({ ownerId: null, items: [] });
  
  const history = useMemo(
    () => historyState.ownerId === normalizedUserId ? historyState.items : [],
    [historyState, normalizedUserId],
  );

  const setHistory = useCallback((update) => {
    setHistoryState((current) => {
      const currentItems = current.ownerId === normalizedUserId ? current.items : [];
      const items = typeof update === "function" ? update(currentItems) : update;
      return { ownerId: normalizedUserId, items };
    });
  }, [normalizedUserId]);

  const [loadedUserId, setLoadedUserId] = useState(null);
  const loadingHistory = Boolean(user && normalizedUserId && loadedUserId !== normalizedUserId);
  const [historyError, setHistoryError] = useState("");
  const visibleHistoryError = loadedUserId === normalizedUserId ? historyError : "";
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    if (!normalizedUserId) return undefined;
    const controller = new AbortController();

    Promise.all([
      getMyWatchHistory({ signal: controller.signal }),
      getMyWishlist({ signal: controller.signal }).catch((error) => {
        return {
          items: [],
          warning: `Watch history loaded, but saved items failed: ${error.message}`,
        };
      }),
    ])
      .then(([records, wishlistResult]) => {
        if (controller.signal.aborted) return;
        const wishlistRecords = Array.isArray(wishlistResult)
          ? wishlistResult
          : wishlistResult.items;
        const savedIds = new Set(
          wishlistRecords
            .filter((record) => record.contentId?._id)
            .map((record) => String(record.contentId._id))
        );
        const watched = records.map((record) => {
          const card = toHistoryCard(record);
          return card ? { ...card, inWatchHistory: true, inWatchLater: savedIds.has(card.contentId) } : null;
        }).filter(Boolean);
        
        const watchedIds = new Set(watched.map((item) => item.contentId));
        const savedOnly = wishlistRecords
          .map((record) => toHistoryCard({
            contentId: record.contentId,
            watchedAt: record.createdAt,
            progress: 0,
            inWatchHistory: false,
          }))
          .filter((card) => card && !watchedIds.has(card.contentId))
          .map((card) => ({ ...card, inWatchHistory: false, inWatchLater: true }));

        setHistory([...watched, ...savedOnly]);
        setHistoryError(Array.isArray(wishlistResult) ? "" : wishlistResult.warning);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setHistoryError(error.message || "Could not load your watch history.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedUserId(normalizedUserId);
      });

    return () => controller.abort();
  }, [normalizedUserId, setHistory]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(history.map((item) => item.category).filter(Boolean)));
    return ["all", ...cats];
  }, [history]);

  const deleteItem = async (id) => {
    const item = history.find((entry) => entry.id === id);
    setHistoryError("");
    try {
      if (activeTab === "watchLater" && item?.inWatchLater) {
        await removeFromWishlist(item.contentId);
        setHistory((prev) =>
          prev.map((entry) => (entry.id === id ? { ...entry, inWatchLater: false } : entry))
              .filter((entry) => entry.inWatchLater || entry.inWatchHistory)
        );
        return;
      }
      if (item?.isBackendContent && user) await deleteWatchHistoryItem(item.contentId);
      setHistory((prev) =>
        item?.inWatchLater
          ? prev.map((entry) => (entry.id === id ? { ...entry, inWatchHistory: false } : entry))
          : prev.filter((entry) => entry.id !== id)
      );
      onRemoveItem?.(id);
    } catch (error) {
      setHistoryError(error.message || "Could not remove this item.");
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
      setHistory((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, inWatchLater: nextValue } : entry))
            .filter((entry) => entry.inWatchLater || entry.inWatchHistory)
      );
    } catch (error) {
      setHistoryError(error.message || "Could not update Watch later list.");
    }
  };

  const clearAllHistory = async () => {
    if (window.confirm("Permanently clear your entire history?")) {
      setHistoryError("");
      try {
        if (user) await clearMyWatchHistory();
        setHistory((current) =>
          current.map((item) => ({ ...item, inWatchHistory: false })).filter((item) => item.inWatchLater)
        );
        onClearHistory?.();
      } catch (error) {
        setHistoryError(error.message || "Could not clear watch history.");
      }
    }
  };

  const getDateGroupLabel = (dateString) => {
    if (!dateString) return "Older";
    const videoDate = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now - videoDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 0 && now.getDate() === videoDate.getDate()) return "Today";
    if (diffDays <= 1) return "Yesterday";
    if (diffDays <= 7) return "This Week";
    return "Older";
  };

  const groupedHistory = useMemo(() => {
    const filtered = history.filter((video) => {
      if (activeTab === "history" && !video.inWatchHistory) return false;
      if (activeTab === "watchLater" && !video.inWatchLater) return false;
      
      const matchesSearch =
        video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.channel?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (categoryFilter !== "all" && video.category !== categoryFilter) return false;

      return true;
    });

    const groups = { Today: [], Yesterday: [], "This Week": [], Older: [] };
    filtered.forEach((video) => {
      const label = getDateGroupLabel(video.watchedAt);
      if (groups[label]) groups[label].push(video);
      else groups.Older.push(video);
    });
    return groups;
  }, [history, searchQuery, categoryFilter, activeTab]);

  const totalFilteredCount = Object.values(groupedHistory).reduce((acc, group) => acc + group.length, 0);

  return (
    <section className="min-h-screen text-[#F1F5F9] antialiased pb-20 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header Title */}
        <div className="pb-6 border-b border-white/5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-semibold tracking-wide sidebar-font text-2xl text-white">Watch History</h1>
          </div>
        </div>

        {/* Toolbar & Filter Options */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:w-96 group">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                placeholder="Search watch history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-[#0D121B] border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <FiX />
                </button>
              )}
            </div>

            {/* View Mode Tabs */}
            <div className="flex bg-slate-900 border-2 border-slate-50/10 gap-2 rounded-xl p-1 backdrop-blur-md justify-between lg:self-auto">
              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FiClock /> History
              </button>
              <button
                onClick={() => setActiveTab("watchLater")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "watchLater"
                    ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FiBookmark /> Saved
              </button>
                {user && history.some((item) => item.inWatchHistory) && (
            <button
              onClick={clearAllHistory}
              className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all shadow-sm"
            >
              <FiTrash2 className="text-sm" /> Clear All
            </button>
          )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-[#0D121B] px-3.5 py-3 scrollbar-none">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 pr-2 border-r border-white/10 shrink-0">
              <FiFilter className="text-cyan-400" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap border transition-all ${
                  categoryFilter === cat
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05]"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Alert Message */}
          {visibleHistoryError && (
            <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {visibleHistoryError}
            </p>
          )}
          
          {/* Main Display States */}
          {loadingHistory ? (
            <div role="status" className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#0D121B]/50 py-20 text-sm text-slate-400">
              <FiRefreshCw className="animate-spin text-cyan-400 text-lg" /> Loading watch records...
            </div>
          ) : !user ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0D121B]/50 py-20 text-center px-4">
              <FiClock className="mx-auto mb-3 text-4xl text-slate-600" />
              <h3 className="text-sm font-bold text-white">Authentication Required</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">Sign in to sync and track your viewing streams across devices.</p>
              <Link to="/signup" className="inline-flex rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-600/30">Sign In</Link>
            </div>
          ) : totalFilteredCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 bg-[#0D121B]/50 rounded-2xl text-center px-4">
              <FiClock className="text-4xl text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-white">No Archive Data Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {history.some((item) => item.inWatchHistory) ? "Adjust your active query or filters." : "Streams you engage with will appear here dynamically."}
              </p>
            </div>
          ) : (
            <div className="space-y-8 pt-2">
              {Object.entries(groupedHistory).map(([dateGroup, videos]) => {
                if (videos.length === 0) return null;
                return (
                  <div key={dateGroup} className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                      <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">{dateGroup}</h3>
                      <span className="text-[10px] font-mono text-slate-500">({videos.length})</span>
                    </div>

                    <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {videos.map((video) => (
                        <div key={video.id} className="group relative rounded-2xl overflow-hidden bg-[#0D121B] border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col h-full shadow-lg">
                          
                          {/* Thumbnail / Media Frame */}
                          <div className="relative w-full aspect-video overflow-hidden bg-black/60">
                            {video.type === "Image" ? (
                              <ImageCard image={{ ...video, isBackendContent: true }} className="w-full h-full object-cover" />
                            ) : (
                              <VideoCard video={video} className="w-full h-full object-cover" />
                            )}

                            {/* Stream Progress Indicator */}
                            {video.progress > 0 && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 z-10">
                                <div 
                                  className="h-full bg-cyan-400 transition-all" 
                                  style={{ width: `${Math.min(video.progress, 100)}%` }} 
                                />
                              </div>
                            )}
                          </div>

                          {/* Item Action Footer */}
                          <div className="p-3.5 flex items-center justify-end gap-4 bg-transparent border-t border-white/5 mt-auto">
                              <button
                                type="button"
                                title={video.inWatchLater ? "Remove from Watch later" : "Save to Watch later"}
                                onClick={() => toggleWatchLater(video.id)}
                                className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${
                                  video.inWatchLater ? "text-amber-400" : "text-slate-400 hover:text-amber-400"
                                }`}
                              >
                                <FiBookmark className="text-xs" />
                              </button>

                              <button
                                type="button"
                                title="Delete from History"
                                onClick={() => deleteItem(video.id)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors"
                              >
                                <FiTrash2 className="text-xs" />
                              </button>
                         
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}