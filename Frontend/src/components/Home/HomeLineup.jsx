import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  MessageCircle,
} from "lucide-react";
import VideoCard from "../Video/Videocard";
import TweetCard from "../Tweet/TweetCard";
import ImageCard from "../Image/ImageCard";
import { getPublishedContent } from "../../api/contentApi";
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
  const [lineup, setLineup] = useState({ videos: [], pulse: [], gallery: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getPublishedContent("Video", { signal: controller.signal }),
      getPublishedContent("Tweet", { signal: controller.signal }),
      getPublishedContent("Image", { signal: controller.signal }),
    ])
      .then(([videos, tweets, images]) => {
        if (controller.signal.aborted) return;
        setLineup({
          videos: videos.map((item) => ({
            id: item._id,
            title: item.title,
            views: item.viewCount || 0,
            time: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "",
            channel: item.creatorId?.displayName || "Creator",
            avatar: item.creatorId?.avatar || "",
            thumb: item.thumbnailUrl || item.mediaUrl,
            src: item.mediaUrl,
            category: item.categoryIds?.[0]?.name || "General",
            isBackendContent: true,
          })),
          pulse: tweets.map((item) => {
            const name = item.creatorId?.displayName || "Creator";
            return {
              id: item._id,
              creatorId: item.creatorId?._id,
              name,
              handle: name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
              avatar: item.creatorId?.avatar || "",
              verified: false,
              time: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "",
              content: item.description || item.title,
              likes: 0,
              retweets: 0,
              commentCount: item.commentCount || 0,
              hasPreview: Boolean(item.mediaUrl),
              mediaUrl: item.mediaUrl || "",
              mediaType: item.mediaAssetId?.mediaType || "",
              isBackendContent: true,
            };
          }),
          gallery: images.map((item) => ({
            id: item._id,
            title: item.title,
            channel: item.creatorId?.displayName || "Creator",
            thumb: item.mediaUrl,
            src: item.mediaUrl,
            category: item.categoryIds?.[0]?.name || "General",
          })),
        });
        setError("");
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError.message);
      });
    return () => controller.abort();
  }, []);

  const items = lineup[favoriteTab];

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

      {error && <p role="status" className="mb-3 text-xs text-amber-300">Could not load your lineup: {error}</p>}
      <div className="hide-scrollbar flex gap-3 sm:gap-4 overflow-x-auto pb-1 snap-x snap-mandatory">
        <AnimatePresence mode="wait">
          {items.length > 0 ? (
            <motion.div
              key={favoriteTab}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="flex gap-3 sm:gap-4"
            >
              {items.slice(0, 7).map((item) => (
                <motion.div
                  key={`fav-${item.id}`}
                  variants={itemVariants}
                  className="snap-start shrink-0 w-80 sm:w-80 md:w-96"
                >
                  {favoriteTab === "videos" && (
                    <VideoCard
                      video={item}
                      bookmarked={!!bookmarkedVideos[item.id]}
                      onToggleBookmark={toggleBookmark}
                    />
                  )}
                  {favoriteTab === "pulse" && <TweetCard tweet={item} />}
                  {favoriteTab === "gallery" && (
                    <div className="h-60">
                      <ImageCard
                        image={item}
                        className="w-full h-60"
                        liked={!!likedImages[item.id]}
                        onLike={() => toggleLikeImage(item.id)}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <p className="py-8 text-sm text-slate-500">
              {error ? "Your lineup is unavailable until content can be loaded." : "No published content in this section yet."}
            </p>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
