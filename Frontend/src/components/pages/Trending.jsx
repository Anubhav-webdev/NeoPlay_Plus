import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import VideoCard from '../Video/Videocard';
import ImageCard from '../Image/ImageCard';
import TweetCard from '../Tweet/TweetCard';
import { getPublishedContent } from "../../api/contentApi";

export default function TrendingDashboard() {
  const [activeTab, setActiveTab] = useState('All');
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");

  useEffect(() => {
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
              views: item.views || 0,
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
              likes: 0,
              retweets: 0,
              commentCount: item.commentCount || 0,
              hasPreview: Boolean(item.mediaUrl),
              mediaUrl: item.mediaUrl || "",
              mediaType: item.mediaAssetId?.mediaType || "",
              initialComments: [],
              isBackendContent: true,
            };
          }),
        );
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
  }, []);

  const filteredItems = useMemo(
    () => [...trendingItems].sort((a, b) => {
      if (activeTab !== "Latest") return 0;
      return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
    }),
    [activeTab, trendingItems],
  );

  const filterTabs = ['All', 'Latest'];

  // Categorize for structured grid distribution
  const videos = filteredItems.filter(item => item.contentType === 'video');
  const images = filteredItems.filter(item => item.contentType === 'image');
  const tweets = filteredItems.filter(item => item.contentType === 'tweet');

  // Featured Hero Items
  const featuredVideo = videos[0];
  // Remaining Items
  const leftColumnItems = [...videos.slice(1, 3), ...images.slice(1, 2),...videos.slice(4, 7), ...images.slice(0, 2)];
  const centerColumnTweets = tweets.slice(0, 3);
  const rightColumnItems = [...images.slice(2, 4), ...tweets.slice(3, 5), ...images.slice(5, 7), ...tweets.slice(3, 5)];

  return (
    <div className="min-h-screen bg-transparent text-[#171717] antialiased pb-16">
      {/* 1. Header */}
  <header className=" w-full  backdrop-blur-md border-b border-gray-800/60 px-2 sm:px-4 lg:px-4 py-3 shadow-sm">
  <div className="max-w-7xl mx-auto flex justify-between  gap-4">
    
    {/* Logo */}
    <div className="relative group cursor-pointer inline-block self-start md:self-auto">
      <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
        <span className="relative text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-fuchsia-500 sidebar-font">
          NeoTrending+
          <span className="absolute bottom-0 left-0 w-full h-0.75 bg-linear-to-r from-cyan-400 via-blue-500 to-fuchsia-500 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
        </span>
      </h2>
    </div>

    {/* Horizontal Category Navigation */}
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1 max-w-full">
      {filterTabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
            activeTab === tab
              ? 'bg-[#6D4AFF] text-white shadow-md shadow-[#6D4AFF]/20'
              : 'bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white border border-gray-800'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>

  </div>
</header>

      {/* 3. Main Asymmetric Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2 pt-3">
        {loading ? (
          <p className="py-16 text-center text-gray-400">Loading published content...</p>
        ) : feedError ? (
          <p role="alert" className="py-16 text-center text-red-300">{feedError}</p>
        ) : filteredItems.length > 0 ? (
          activeTab === 'All' ? (
            /* Structured 3-Column Editorial Grid for "All" Tab */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Stacked auxiliary media cards (Narrow: 3 cols) */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                {leftColumnItems.map((item) => (
                  <CardContainer key={`${item.contentType}-${item.id}`}>
                    {item.contentType === 'video' && <VideoCard video={item} className="w-full rounded-2xl" />}
                    {item.contentType === 'image' && <ImageCard image={item} className="w-full rounded-2xl" />}
                  </CardContainer>
                ))}
              </div>

              {/* CENTER COLUMN: Hero Featured Video + Tweet Feed (Wide: 5 cols) */}
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
                        <h3 className="font-bold text-base leading-tight line-clamp-1">{featuredVideo.title || "EPIC TRAIL RUN | MOUNTAIN ADVENTURE 🏔️"}</h3>
                        <p className="text-xs text-gray-300 mt-0.5">{featuredVideo.views || "120K views"} • {featuredVideo.duration || "10:42"}</p></div>
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

              {/* RIGHT COLUMN: Featured Image Post + Additional Media (Medium: 4 cols) */}
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
            /* Responsive Grid for Specific Tabs (Videos, Images, Tweets) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredItems.map((item) => (
                <CardContainer key={`${item.contentType}-${item.id}`}>
                  {item.contentType === 'video' && <VideoCard video={item} className="w-full rounded-2xl" />}
                  {item.contentType === 'image' && <ImageCard image={item} className="w-full rounded-2xl" />}
                  {item.contentType === 'tweet' && <TweetCard tweet={item} className="w-full rounded-2xl" />}
                </CardContainer>
              ))}
            </div>
          )
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

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// Card Wrapper with Soft Shadow, Light Border, and Subtle Hover Interactions
function CardContainer({ children }) {
  return (
    <div className="bg-transparent border rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5" >
      {children}
    </div>
  );
}