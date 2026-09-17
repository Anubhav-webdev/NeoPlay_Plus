import { motion } from "framer-motion";
import CreatorCard from "../cards/CreatorCards"; 
import {
  useHScroll,
  ScrollButtons,
  ChannelLabel,
} from "./HomeConstants";

import { creators } from "../../constants/data";

export default function HomeCreators() {
  const [creatorRef, scrollCreator] = useHScroll();

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
          <p className="text-zinc-500 text-sm pl-2">No creators found.</p>
        )}
      </div>
    </motion.section>
  );
}