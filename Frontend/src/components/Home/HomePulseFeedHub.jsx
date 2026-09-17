import { motion } from "framer-motion";
import TweetCard from "../Tweet/TweetCard";
import { initialTweets } from "../../constants/data";
import {
  C,
  useHScroll,
  ScrollButtons,
  ChannelLabel,
} from "./HomeConstants";

export default function HomePulseFeed() {
  const [pulseRef, scrollPulse] = useHScroll();

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
      <div
        ref={pulseRef}
        className="hide-scrollbar flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory"
      >
        {initialTweets.map((tweet, idx) => (
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

