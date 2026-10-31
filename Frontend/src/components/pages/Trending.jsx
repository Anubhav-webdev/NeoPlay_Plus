import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import VideoCard from '../Video/Videocard';
import ImageCard from '../Image/ImageCard';
import TweetCard from '../Tweet/TweetCard';
import { getPublishedContent } from "../../api/contentApi";

export default function TrendingDashboard() {
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchContent = useCallback(() => {
    setLoading(true);
    const controller = new AbortController();

    Promise.all(
      ["Video", "Image", "Tweet"].map((type) =>
        getPublishedContent(type, { signal: controller.signal }),
      ),
    )
      .then((groups) => {
        const cards = groups.flatMap((items) =>
          items.map((item) => {
            const creator = item.creatorId || {};
            const likesCount = Array.isArray(item.likes) 
              ? item.likes.length 
              : (item.likesCount || item.likes || 0);
            const viewsCount = item.views || 0;
            const score = viewsCount + likesCount;

            const common = {
              id: item._id,
              creatorId: creator._id,
              name: creator.displayName || "Creator",
              channel: creator.displayName || "Creator",
              handle: (creator.displayName || "creator")
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "_"),
              avatar: creator.avatar || "",
              title: item.title,
              description: item.description,
              views: viewsCount,
              likes: likesCount,
              score,
              publishedAt: item.publishedAt,
            };

            if (item.type === "Video") {
              return {
                ...common,
                contentType: "video",
                thumb: item.thumbnailUrl || item.mediaUrl,
                src: item.mediaUrl,
              };
            }
            if (item.type === "Image") {
              return {
                ...common,
                contentType: "image",
                thumb: item.mediaUrl,
                src: item.mediaUrl,
              };
            }
            return {
              ...common,
              contentType: "tweet",
              content: item.description || item.title,
              time: item.publishedAt
                ? new Date(item.publishedAt).toLocaleDateString()
                : "",
              retweets: item.retweets || 0,
              commentCount: item.commentCount || 0,
              hasPreview: Boolean(item.mediaUrl),
              mediaUrl: item.mediaUrl || "",
              mediaType: item.mediaAssetId?.mediaType || "",
              initialComments: [],
              isBackendContent: true,
            };
          }),
        );

        // Global sort: highest views + likes engagement score first
        cards.sort((a, b) => b.score - a.score);

        setTrendingItems(cards);
        setFeedError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setFeedError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const cleanup = fetchContent();
    return cleanup;
  }, [fetchContent]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Group items by type (already sorted high-to-low by score)
  const videos = trendingItems.filter((item) => item.contentType === 'video');
  const images = trendingItems.filter((item) => item.contentType === 'image');
  const tweets = trendingItems.filter((item) => item.contentType === 'tweet');

  // Hero video slot picks the absolute highest demand video
  const featuredVideo = videos[0];

  // Distribute remaining media evenly while maintaining high-to-low order
  const remainingMedia = [
    ...videos.slice(1),
    ...images,
  ].sort((a, b) => b.score - a.score);

  const leftColumnItems = remainingMedia.filter((_, index) => index % 2 === 0);
  const centerColumnTweets = tweets.slice(0, 3);
  const rightColumnItems = [
    ...remainingMedia.filter((_, index) => index % 2 === 1),
    ...tweets.slice(3),
  ];

  return (
    <div className="min-h-screen bg-transparent text-[#171717] antialiased pb-16">
      {/* 1. Header with Refresh Control */}
      <header className="w-full backdrop-blur-md border-b border-gray-800/60 px-2 sm:px-4 lg:px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          {/* Logo */}
          <div className="relative group cursor-pointer inline-block">
            <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
              <span className="relative text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-fuchsia-500 sidebar-font">
                NeoTrending+
                <span className="absolute bottom-0 left-0 w-full h-0.75 bg-linear-to-r from-cyan-400 via-blue-500 to-fuchsia-500 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
              </span>
            </h2>
          </div>

          {/* Refresh Action Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      {/* 2. Main High-Demand Dashboard Feed */}
      <main className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2 pt-3">
        {loading ? (
          <p className="py-16 text-center text-gray-400">Loading published content...</p>
        ) : feedError ? (
          <p role="alert" className="py-16 text-center text-red-300">{feedError}</p>
        ) : trendingItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: High Engagement Media */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {leftColumnItems.map((item) => (
                <CardContainer key={`${item.contentType}-${item.id}`}>
                  {item.contentType === 'video' && <VideoCard video={item} className="w-full rounded-2xl" />}
                  {item.contentType === 'image' && <ImageCard image={item} className="w-full rounded-2xl" />}
                </CardContainer>
              ))}
            </div>

            {/* CENTER COLUMN: Top-Demand Hero Video + Leading Posts */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {featuredVideo && (
                <CardContainer key={`featured-video-${featuredVideo.id}`}>
                  <Link
                    to={`/video/${featuredVideo.id}`}
                    aria-label={`Watch ${featuredVideo.title || 'featured video'}`}
                    className="relative block rounded-2xl overflow-hidden group cursor-pointer aspect-video bg-gray-900"
                  >
                    <img
                      src={featuredVideo.thumb || featuredVideo.thumbnail || featuredVideo.url}
                      alt={featuredVideo.title || 'Featured video'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-[#6D4AFF] rounded-md inline-block mb-1">
                       Featured Video
                      </span>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="font-bold text-base leading-tight line-clamp-1">
                          {featuredVideo.title || "Featured Video"}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </CardContainer>
              )}

              {centerColumnTweets.map((tweet) => (
                <CardContainer key={`tweet-${tweet.id}`}>
                  <TweetCard tweet={tweet} className="w-full rounded-2xl" />
                </CardContainer>
              ))}
            </div>

            {/* RIGHT COLUMN: Additional Media & High-Score Posts */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              {rightColumnItems.map((item) => (
                <CardContainer key={`${item.contentType}-${item.id}`}>
                  {item.contentType === 'video' && <VideoCard video={item} className="w-full rounded-2xl" />}
                  {item.contentType === 'image' && <ImageCard image={item} className="w-full rounded-2xl" />}
                  {item.contentType === 'tweet' && <TweetCard tweet={item} className="w-full rounded-2xl" />}
                </CardContainer>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-200 max-w-md mx-auto my-8 shadow-sm">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-800">No published content yet</h3>
            <p className="text-sm text-gray-500 mt-1">Videos, images, and posts published by creators will appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function CardContainer({ children }) {
  return (
    <div className="bg-transparent border rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5">
      {children}
    </div>
  );
}