import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  MessageCircle,
} from "lucide-react";
import VideoCard from "../Video/Videocard";
import TweetCard from "../Tweet/TweetCard";
import ImageCard from "../Image/ImageCard";
import { VIDEOS, initialTweets, IMAGES } from "../../constants/data";
import { C, ChannelLabel } from "./HomeConstants";

const tabs = [
  { id: "videos", label: "Video Channel", icon: VideoIcon },
  { id: "pulse", label: "Pulse Feed", icon: MessageCircle },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

export default function HomeLineup({
  bookmarkedVideos,
  toggleBookmark,
  likedImages,
  toggleLikeImage,
}) {
  const [favoriteTab, setFavoriteTab] = useState("videos");

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-5 gap-3 sm:gap-0">
        <ChannelLabel title="Your Lineup" />
        <div
          className="flex p-1.5 rounded-2xl self-start sm:self-auto"
          style={{ backgroundColor: C.ink, border: `1px solid ${C.border}` }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFavoriteTab(tab.id)}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
              style={
                favoriteTab === tab.id
                  ? { backgroundColor: C.blue, color: C.ink }
                  : { color: C.muted }
              }
            >
              <tab.icon size={13} />{" "}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hide-scrollbar flex gap-3 sm:gap-4 overflow-x-auto pb-1 snap-x snap-mandatory">
        <AnimatePresence mode="wait">
          {favoriteTab === "videos" && (
            <motion.div
              key="videos"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="flex gap-3 sm:gap-4"
            >
              {VIDEOS.slice(0, 7).map((video) => (
                <motion.div
                  key={`fav-${video.id}`}
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
          )}

          {favoriteTab === "pulse" && (
            <motion.div
              key="pulse"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="flex gap-4"
            >
              {initialTweets.slice(0, 6).map((tweet) => (
                <motion.div
                  key={`fav-${tweet.id}`}
                  variants={itemVariants}
                  className="snap-start shrink-0 w-80 sm:w-80 md:w-96"
                >
                  <TweetCard tweet={tweet} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {favoriteTab === "gallery" && (
            <motion.div
              key="gallery"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="flex gap-4"
            >
              {IMAGES.slice(0, 9).map((image) => (
                <motion.div
                  key={`fav-${image.id}`}
                  variants={itemVariants}
                  className="snap-start shrink-0 w-80 sm:w-80 md:w-96"
                >
                  <div className="h-60">
                    <ImageCard
                      image={image}
                      className="w-full h-60"
                      liked={!!likedImages[image.id]}
                      onLike={() => toggleLikeImage(image.id)}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

