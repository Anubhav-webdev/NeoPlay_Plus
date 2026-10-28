import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VideoCard from "../Video/Videocard";
import { getPublishedContent } from "../../api/contentApi";
import {
  C,
  useHScroll,
  ScrollButtons,
  ChannelLabel,
  CategoryPill,
} from "./HomeConstants";

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

export default function HomeVideoHub({
  bookmarkedVideos,
  toggleBookmark,
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");
  const [videoRef, scrollVideo] = useHScroll();

  useEffect(() => {
    const controller = new AbortController();
    getPublishedContent("Video", { signal: controller.signal })
      .then((items) => {
        setVideos(items.map((item) => ({
          id: item._id,
          title: item.title,
          views: item.viewCount || 0,
          time: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "",
          channel: item.creatorId?.displayName || "Creator",
          avatar: item.creatorId?.avatar || "",
          thumb: item.thumbnailUrl || item.mediaUrl,
          src: item.mediaUrl,
          category: item.categoryIds?.[0]?.name || "General",
        })));
        setError("");
      })
      .catch((loadError) => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      });
    return () => controller.abort();
  }, []);

  const categories = useMemo(() => [
    "All",
    ...new Set(videos.map((video) => video.category)),
  ], [videos]);
  const filteredVideos =
    activeCategory === "All"
      ? videos
      : videos.filter((video) => video.category === activeCategory);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-5">
        <ChannelLabel title="Trending Videos" />
        <ScrollButtons
          onPrev={() => scrollVideo(-1)}
          onNext={() => scrollVideo(1)}
        />
      </div>

      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1 mb-5">
        {categories.map((category) => (
          <CategoryPill
            key={category}
            label={category}
            active={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          />
        ))}
      </div>

      {error && <p role="status" className="mb-3 text-xs text-amber-300">Could not load videos: {error}</p>}
      {filteredVideos.length === 0 ? (
        <div
          className="rounded-2xl py-12 text-center"
          style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}
        >
          <p className="text-sm" style={{ color: C.muted }}>
            {error ? "Videos are unavailable until the feed can be loaded." : "No published videos yet."}
          </p>
        </div>
      ) : (
        <div
          ref={videoRef}
          className="hide-scrollbar flex gap-3 sm:gap-4 overflow-x-auto pb-1 snap-x snap-mandatory"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
              className="flex gap-3 sm:gap-4"
            >
              {filteredVideos.map((video) => (
                <motion.div
                  key={video.id}
                  variants={itemVariants}
                  className="snap-start shrink-0 w-80 sm:w-80 md:w-96"
                >
                  <VideoCard
                    video={video}
                    bookmarked={!!bookmarkedVideos[video.id]}
                    onToggleBookmark={toggleBookmark}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </motion.section>
  );
}
