import { useState, useMemo, useEffect } from "react";
import {
  FaFilter as FaFilterIcon,
  FaSortAmountDown as FaSortIcon,
  FaSearch,
  FaTimes,
  FaCloudSun,
  FaPenNib,
  FaExternalLinkAlt
} from "react-icons/fa";
import TweetCard from "./TweetCard";
import { getPublishedContent } from "../../api/contentApi";

export default function TweetsFeed() {
  const [activeTab, setActiveTab] = useState("forYou");
  const [sortBy, setSortBy] = useState("latest");
  const [showMediaOnly, setShowMediaOnly] = useState(false);
  const [publishedTweets, setPublishedTweets] = useState([]);
  const [feedError, setFeedError] = useState("");
  
  // Track user premium verification status
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getPublishedContent("Tweet", { signal: controller.signal })
      .then((items) => {
        setPublishedTweets(items.map((item) => {
          const name = item.creatorId?.displayName || "Creator";
          return {
            id: item._id,
            creatorId: item.creatorId?._id,
            name,
            handle: name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
            avatar: item.creatorId?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=creator",
            verified: false,
            time: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "",
            content: item.description || item.title,
            likes: 0,
            retweets: 0,
            commentCount: item.commentCount || 0,
            hasPreview: Boolean(item.mediaUrl),
            mediaUrl: item.mediaUrl || "",
            mediaType: item.mediaAssetId?.mediaType || "",
            initialComments: [],
            isBackendContent: true,
          };
        }));
        setFeedError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setFeedError(error.message);
      });
    return () => controller.abort();
  }, []);

  const tweets = useMemo(
    () => publishedTweets,
    [publishedTweets],
  );

  const processedTweets = useMemo(() => {
    return tweets
      .filter((tweet) => (showMediaOnly ? tweet.hasPreview : true))
      .sort((a, b) => (sortBy === "popular" ? b.likes - a.likes : 0));
  }, [sortBy, showMediaOnly, tweets]);

  return (
    <div className="min-h-screen w-full bg-transparent text-white flex justify-center selection:bg-blue-500/30">
      <div className="w-full max-w-[1200px] flex px-4 gap-8">
        
        {/* ================= LEFT MAIN FEED COLUMN ================= */}
        <main className="flex-1 max-w-[750px]  min-h-screen flex flex-col">
          
          {/* Header & Tabs */}
          <div className="sticky top-0 bg-transparent backdrop-blur-md z-10 border-b border-zinc-800  sidebar-font">
            <div className="flex justify-between items-center px-4 py-3">
           <div className="relative group cursor-pointer">
  <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
    <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500">
      NeoFeed
      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
    </span>
  </h2>
</div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowMediaOnly(!showMediaOnly)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-xs font-medium transition ${
                    showMediaOnly
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-transparent border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <FaFilterIcon size={9} />
                  <span>Media</span>
                </button>

                <div className="flex items-center space-x-1 bg-transparent border border-zinc-800 px-2.5 py-1 rounded-full text-zinc-400 text-xs">
                  <FaSortIcon size={10} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent font-medium text-white outline-none cursor-pointer"
                  >
                    <option value="latest" className="bg-black">Latest</option>
                    <option value="popular" className="bg-black">Popular</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex w-full">
              {["forYou", "following", "trending"].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 relative text-center py-3.5 text-sm font-medium transition hover:bg-transparent/50"
                  >
                    <span className={isActive ? "font-bold text-white" : "text-zinc-500"}>
                      {tab === "forYou" ? "For you" : tab === "following" ? "Following" : "Trending"}
                    </span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-blue-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Rendering: Composer tool displays ONLY when subscribed */}
          {isSubscribed ? (
            <div className="p-4 border-b border-zinc-800 flex space-x-3 bg-gradient-to-b from-blue-950/10 to-transparent transition-all duration-500 animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/20">
                PRO
              </div>
              <div className="flex-1">
                <textarea 
                  rows={2}
                  placeholder="What's happening? Post your updates..." 
                  className="w-full bg-transparent text-lg text-zinc-200 placeholder-zinc-600 outline-none resize-none pt-1"
                />
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-zinc-900">
                  <div className="flex space-x-3.5 text-blue-400 text-base cursor-pointer">
                    <span className="hover:text-blue-300 transition">🖼️</span>
                    <span className="hover:text-blue-300 transition">📹</span>
                    <span className="hover:text-blue-300 transition">📊</span>
                    <span className="hover:text-blue-300 transition">😀</span>
                  </div>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-1.5 rounded-full text-sm font-bold transition shadow-md shadow-blue-500/10">
                    Post
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 border-b border-zinc-800 bg-zinc-950/40 text-center flex flex-col items-center justify-center space-y-2">
              <p className="text-sm text-zinc-400 font-medium">
                Want to join the conversation and publish your thoughts?
              </p>
              <button 
                onClick={() => setIsSubscribed(true)}
                className="text-xs bg-transparent hover:bg-zinc-800 border border-zinc-700 text-blue-400 font-semibold px-3 py-1.5 rounded-full transition"
              >
                Unlock Post Option via Premium
              </button>
            </div>
          )}

          {/* Active Post/Feed Stream */}
          <div className="flex flex-col ">
            {feedError && (
              <p role="status" className="m-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
                Could not load creator posts: {feedError}
              </p>
            )}
            {processedTweets.length > 0 ? (
              processedTweets.map((tweet) => (
                <div key={tweet.id} className="transition hover:bg-transparent/10">
                  <TweetCard tweet={tweet} />
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-zinc-500">
                <p className="font-medium text-zinc-400">No matching posts found</p>
              </div>
            )}
          </div>
        </main>

        {/* ================= RIGHT SIDEBAR COLUMN ================= */}
        <aside className="hidden md:flex flex-col w-[400px] space-y-4 pt-2 pb-12">
          
          {/* Search Bar Widget */}
          <div className="sticky top-0 bg-transparent pt-1 pb-2 z-10">
            <div className="flex items-center space-x-3 bg-transparent px-4 py-2.5 rounded-full border  focus-within:border-blue-500 focus-within:bg-transparent group transition border-zinc-600 hover:border-blue-500 hover:bg-transparent">
              <FaSearch className="text-zinc-500 group-focus-within:text-blue-500 text-sm" />
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent text-sm text-white placeholder-zinc-500 outline-none w-full"
              />
            </div>
          </div>

          {/* Premium Subscription Card Widget */}
          <div className="bg-transparent border border-zinc-800 rounded-2xl p-4 space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight">
              {isSubscribed ? "You are Premium! ✨" : "Subscribe to Premium"}
            </h2>
            <p className="text-sm text-zinc-400 leading-snug">
              {isSubscribed 
                ? "Enjoy full posting features, analytics dashboard tools, and ad-free experience layout permissions."
                : "Get rid of ads, unlock the tweet posting composer engine, see your analytics, and upgrade parameters."
              }
            </p>
            {!isSubscribed && (
              <button 
                onClick={() => setIsSubscribed(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-4 py-2 rounded-full transition w-fit mt-1"
              >
                Subscribe
              </button>
            )}
          </div>

          {/* NEW: Today's Weather Widget */}
          <div className="bg-transparent border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 font-bold tracking-wider uppercase">Local Weather</p>
                <h3 className="text-lg font-extrabold text-zinc-100 mt-0.5">Kolkata, WB</h3>
              </div>
              <FaCloudSun className="text-amber-400 text-2xl" />
            </div>
            
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black tracking-tighter">32°C</span>
              <span className="text-xs text-zinc-400 font-medium">Scattered Clouds</span>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center text-xs">
              <span className="text-zinc-500">Humidity: 74% · Wind: 12 km/h</span>
              <a 
                href="https://weather.com" 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Forecast</span>
                <FaExternalLinkAlt size={8} />
              </a>
            </div>
          </div>

          {/* NEW: Today's Quote Widget */}
          <div className="bg-transparent border border-zinc-800 rounded-2xl p-4 relative overflow-hidden">
            <FaPenNib className="absolute -right-2 -bottom-3 text-zinc-800/40 text-7xl pointer-events-none" />
            <p className="text-xs text-zinc-500 font-bold tracking-wider uppercase mb-1.5">Quote of the day</p>
            <p className="text-sm text-zinc-200 italic font-medium leading-relaxed">
              "Code is like humor. When you have to explain it, it’s bad."
            </p>
            <p className="text-xs text-zinc-500 text-right mt-2 font-semibold">— Cory House</p>
          </div>
          <div className="bg-transparent border border-zinc-800 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold tracking-tight">Today's News</h2>
              <button className="text-zinc-500 hover:text-white transition">
                <FaTimes size={12} />
              </button>
            </div>

            {/* Simulated News Sub-items */}
            <div className="space-y-3.5">
              <div className="group cursor-pointer">
                <p className="text-xs text-zinc-500 font-medium">Sports · Trending</p>
                <h3 className="text-sm font-bold text-zinc-100 group-hover:underline line-clamp-2 mt-0.5">
                  Ronaldo Scores Brace in Portugal's 5-0 Rout of Uzbekistan
                </h3>
                <p className="text-xs text-zinc-500 mt-1">1.5M posts</p>
              </div>

              <div className="group cursor-pointer border-t border-zinc-800/60 pt-3">
                <p className="text-xs text-zinc-500 font-medium">Gaming · Live</p>
                <h3 className="text-sm font-bold text-zinc-100 group-hover:underline line-clamp-2 mt-0.5">
                  GTA VI Pre-Orders Open Midnight June 25 on PS5 and Xbox
                </h3>
                <p className="text-xs text-zinc-500 mt-1">315.5K posts</p>
              </div>

              <div className="group cursor-pointer border-t border-zinc-800/60 pt-3">
                <p className="text-xs text-zinc-500 font-medium">Trending</p>
                <h3 className="text-sm font-bold text-zinc-100 group-hover:underline mt-0.5">
                  #WeStandWithNeoPlay
                </h3>
                <p className="text-xs text-zinc-500 mt-1">45.2K posts</p>
              </div>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}