import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import TweetCard from "../Tweet/TweetCard";
import { getPublishedContent } from "../../api/contentApi";
import {
  C,
  useHScroll,
  ScrollButtons,
  ChannelLabel,
} from "./HomeConstants";

export default function HomePulseFeed() {
  const [pulseRef, scrollPulse] = useHScroll();
  const [tweets, setTweets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getPublishedContent("Tweet", { signal: controller.signal })
      .then((items) => {
        setTweets(items.map((item) => {
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
        }));
        setError("");
      })
      .catch((loadError) => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      });
    return () => controller.abort();
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="lg:col-span-2 min-w-0"
    >
      <div className="flex items-center justify-between mb-5">
        <ChannelLabel title="Pulse Feed" />
        <ScrollButtons
          onPrev={() => scrollPulse(-1)}
          onNext={() => scrollPulse(1)}
          accent={C.purple}
        />
      </div>
      {error && <p role="status" className="mb-3 text-xs text-amber-300">Could not load posts: {error}</p>}
      <div
        ref={pulseRef}
        className="hide-scrollbar flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory"
      >
        {tweets.length === 0 ? (
          <p className="py-8 text-sm text-zinc-500">{error ? "Posts are unavailable until the feed can be loaded." : "No published posts yet."}</p>
        ) : tweets.map((tweet, idx) => (
          <motion.div
            key={tweet.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.06, duration: 0.3 }}
            className="snap-start shrink-0 w-[85%] sm:w-96 lg:w-full"
          >
            <TweetCard tweet={tweet} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
