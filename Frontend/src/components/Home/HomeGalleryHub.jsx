import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ImageCard from "../Image/ImageCard";
import { getPublishedContent } from "../../api/contentApi";
import { C } from "./homeTokens";
import useHScroll from "./useHScroll";
import { ScrollButtons, ChannelLabel } from "./HomePrimitives";

export default function HomeGalleryHub({ likedImages, toggleLikeImage }) {
  const [thumbRef, scrollThumb] = useHScroll();
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getPublishedContent("Image", { signal: controller.signal })
      .then((items) => {
        setImages(items.map((item) => ({
          id: item._id,
          title: item.title,
          channel: item.creatorId?.displayName || "Creator",
          thumb: item.mediaUrl,
          src: item.mediaUrl,
          category: item.categoryIds?.[0]?.name || "General",
          isBackendContent: true,
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

      {error && <p role="status" className="mb-3 text-xs text-amber-300">Could not load images: {error}</p>}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2 mb-2 "
        style={{ gridAutoRows: "120px" }}
      >
        <div
          ref={thumbRef}
          className="hide-scrollbar gap-4 flex overflow-x-auto  col-span-4 row-span-2 pb-20">
          {images.map((image) => (
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
        
        {images.slice(0, 3).map((image) => (
          <ImageCard
            key={`featured-${image.id}`}
            image={image}
            className="col-span-1"
            liked={!!likedImages[image.id]}
            onLike={() => toggleLikeImage(image.id)}
          />
        ))}
      </div>

      <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-8 pt-20">
        {images.slice(3).map((image, idx) => (
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
      {images.length === 0 && (
        <p className="py-8 text-sm text-zinc-500">{error ? "Images are unavailable until the feed can be loaded." : "No published images yet."}</p>
      )}
    </motion.section>
  );
}
