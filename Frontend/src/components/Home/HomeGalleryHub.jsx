import { motion } from "framer-motion";
import ImageCard from "../Image/ImageCard";
import { IMAGES } from "../../constants/data";
import {
  C,
  useHScroll,
  ScrollButtons,
  ChannelLabel,
} from "./HomeConstants";

export default function HomeGalleryHub({ likedImages, toggleLikeImage }) {
  const [thumbRef, scrollThumb] = useHScroll();

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="lg:col-span-3 min-w-0"
    >
      <div className="flex items-center justify-between mb-3">
        <ChannelLabel title="Trending Gallery" />
        <ScrollButtons
          onPrev={() => scrollThumb(-1)}
          onNext={() => scrollThumb(1)}
          accent={C.purple}
        />
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2 mb-2 "
        style={{ gridAutoRows: "120px" }}
      >
        <div
          ref={thumbRef}
          className="hide-scrollbar gap-4 flex overflow-x-auto  col-span-4 row-span-2 pb-20">
          {IMAGES.slice(1).map((image) => (
            <motion.div
              key={image.id}
              className="shrink-0 w-96 sm:w-96 md:w-96"
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}


            >
              <ImageCard image={image} className="w-full h-60" />
            </motion.div>
          ))}
        </div>
        
        <ImageCard
          image={IMAGES[1]}
          className="col-span-1 sm:col-span-2"
          liked={!!likedImages[IMAGES[1].id]}
          onLike={() => toggleLikeImage(IMAGES[1].id)}
        />
        <ImageCard
          image={IMAGES[2]}
          className="col-span-1 "
          liked={!!likedImages[IMAGES[2].id]}
          onLike={() => toggleLikeImage(IMAGES[2].id)}
        />
        <ImageCard
          image={IMAGES[3]}
          className="col-span-1"
          liked={!!likedImages[IMAGES[3].id]}
          onLike={() => toggleLikeImage(IMAGES[3].id)}
        />
      </div>

      <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-8 pt-20">
        {IMAGES.slice(4).map((image, idx) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.04, duration: 0.3 }}
            className="shrink-0 w-36 h-40"
          >
            <ImageCard
              image={image}
              className="w-full h-full"
              liked={!!likedImages[image.id]}
              onLike={() => toggleLikeImage(image.id)}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

