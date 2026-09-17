import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VideoCard from "../Video/Videocard";
import { VIDEOS } from "../../constants/data";
import {
  C,
  useHScroll,
  ScrollButtons,
  ChannelLabel,
  CategoryPill,
} from "./HomeConstants";

const CATEGORIES = [
  "All",
  ...new Set(VIDEOS.map((video) => video.Catagory)),
];

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
  const [videoRef, scrollVideo] = useHScroll();

  const filteredVideos =
    activeCategory === "All"
      ? VIDEOS
      : VIDEOS.filter((video) => video.Catagory === activeCategory);

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
        {CATEGORIES.map((category) => (
          <CategoryPill
            key={category}
            label={category}
            active={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          />
        ))}
      </div>

      {filteredVideos.length === 0 ? (
        <div
          className="rounded-2xl py-12 text-center"
          style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}
        >
          <p className="text-sm" style={{ color: C.muted }}>
            No signal here. Try another category or search term.
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

