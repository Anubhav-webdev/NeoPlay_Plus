import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CreatorCard from "../cards/CreatorCards"; 
import {
  useHScroll,
  ScrollButtons,
  ChannelLabel,
} from "./HomeConstants";

import { getPublishedCreators } from "../../api/contentApi";

export default function HomeCreators() {
  const [creatorRef, scrollCreator] = useHScroll();
  const [creators, setCreators] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getPublishedCreators({ signal: controller.signal })
      .then((items) => {
        setCreators(items.map((creator) => ({
          id: creator._id,
          name: creator.displayName,
          handle: creator.userId?.username ? `@${creator.userId.username}` : "@creator",
          avatar: creator.avatar || "",
        })));
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
    >
      <div className="flex items-center justify-between mb-5">
        <ChannelLabel title="Trending Creators" />
        <ScrollButtons
          onPrev={() => scrollCreator(-1)}
          onNext={() => scrollCreator(1)}
        />
      </div>
      <div
        ref={creatorRef}
        className="hide-scrollbar flex gap-4 sm:gap-5 overflow-x-auto pb-1 snap-x snap-mandatory"
      >
        {error && <p role="status" className="text-xs text-amber-300">Could not load creators: {error}</p>}
        {creators && creators.length > 0 ? (
          creators.map((singleCreator, index) => (
            <motion.div
              key={singleCreator.id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.04,
                duration: 0.3,
              }}
              className="snap-start"
            >
              <CreatorCard
                creator={singleCreator}
                displayIndex={index}
              />
            </motion.div>
          ))
        ) : (
          <p className="text-zinc-500 text-sm pl-2">{error ? "Creators are unavailable until the feed can be loaded." : "No approved creators yet."}</p>
        )}
      </div>
    </motion.section>
  );
}