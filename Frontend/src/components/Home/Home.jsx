import { useState } from "react";
import { motion } from "framer-motion";

/* ─── section components ─── */
import HomeHeroSection from "../Home/HomeHeroSection";
import HomeVideoHub from "../Home/HomeVideoHub";
import HomePulseFeed from "../Home/HomePulseFeedHub";
import HomeGalleryHub from "../Home/HomeGalleryHub";
import HomeLineup from "../Home/HomeLineup";
import HomePremiumBanner from "../Home/HomePremiumBanner";
import HomeCreators from "../Home/HomeCreators";
import HorizontalRow from "../common/HorizontalRow";
import PlaylistCard from "../Playlist/PlaylsitCard";
/* ─── shared constants & primitives ─── */
import {
  C,
  MarqueeTicker,
  TICKER_TOP
} from "../Home/HomeConstants";

/* ============================================================
   MAIN COMPOSITE PAGE
   ============================================================ */
export default function MainContent() {
  /* shared state lifted up for cross-section consistency */
  const [bookmarkedVideos, setBookmarkedVideos] = useState({});
  const [likedImages, setLikedImages] = useState({});

  const toggle = (setter) => (id) =>
    setter((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleBookmark = toggle(setBookmarkedVideos);
  const toggleLikeImage = toggle(setLikedImages);

  /* ── page entrance stagger ── */
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  return (
    <motion.div
      className="w-full max-w-[1400px] mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track:hover { animation-play-state: paused; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        input::placeholder { color: ${C.mutedDark}; }
        input:focus { outline: 2px solid ${C.blue}; outline-offset: 1px; }
        button:focus-visible, a:focus-visible { outline: 2px solid ${C.purple}; outline-offset: 2px; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* ============ TOP TICKER ============ */}
      <MarqueeTicker items={TICKER_TOP} dim />

      <div className="w-full mx-auto px-2 sm:px-3 lg:px-4 py-4 space-y-10 sm:space-y-10">
        {/* ============ HERO ============ */}
        <HomeHeroSection />


        {/* ============ TRENDING VIDEOS ============ */}
        <HomeVideoHub
          bookmarkedVideos={bookmarkedVideos}
          toggleBookmark={toggleBookmark}
        />

        {/* ============ PULSE FEED + GALLERY (side-by-side) ============ */}
        <section className="grid lg:grid-cols-5 gap-5 items-start">
          <HomePulseFeed />
          <HomeGalleryHub
            likedImages={likedImages}
            toggleLikeImage={toggleLikeImage}
          />
        </section>

        {/* ============ YOUR LINEUP ============ */}
        <HomeLineup
          bookmarkedVideos={bookmarkedVideos}
          toggleBookmark={toggleBookmark}
          likedImages={likedImages}
          toggleLikeImage={toggleLikeImage}
        />

        {/* ============ PREMIUM BANNER ============ */}

        <HomePremiumBanner />

 <HorizontalRow  title="Trending Playlist">
        <PlaylistCard/></HorizontalRow>

        {/* ============ TRENDING CREATORS ============ */}

        <HomeCreators/>
      </div>

      {/* ============ BOTTOM TICKER ============ */}
      <div className="text-center py-5 bg-transparent" >
        <span
          style={{color: C.mutedDark }}
          className="text-[10px] tracking-[0.2em] uppercase all-font"
        >
          NeoPlay+ Signal · Broadcasting since 2026
        </span>
      </div>
    </motion.div>
  );
}
