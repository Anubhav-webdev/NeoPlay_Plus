import HorizontalRow from '../common/HorizontalRow';
import CreatorCard from '../cards/CreatorCards';
import VideoCard from '../Video/Videocard';
import ImageCard from '../Image/ImageCard';
import TweetCard from "../Tweet/TweetCard";

// Core layout reads global state data structures here
import { creators, VIDEOS, IMAGES,initialTweets } from "../../constants/data";

export default function SubscriptionsDashboard() {
  const myOwnVideosList = VIDEOS || []; 
  const myOwnImagesList = IMAGES || []; 
  const myOwnTweetsList = initialTweets || []; 
  const trendingList = [...creators].reverse();

  return (
    <div className="min-h-screen max-w-full  bg-transparent text-white all-font selection:bg-cyan-500 selection:text-black antialiased pb-16 overflow-hidden pl-4">
      
      {/* Dynamic & Responsive Header */}
      <header className="pt-8 pb-4 px-4 sm:px-6 md:px-8  mx-auto border-b border-gray-800/60 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative group cursor-pointer">
            <h2 className="mt-1 text-3xl font-black tracking-wide text-white">
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 sidebar-font">
                My Subscriptions
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
              </span>
            </h2>
            <p className="text-sm text-gray-400 mt-1 sm:text-base">
              Stay updated with content from creators you follow.
            </p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-full mx-auto px-1 sm:px-1 md:px-1 space-y-4  sm:ml-7">
        
        {/* SECTION 1: Standard Creator Profile Cards */}
        <section className="transition-all duration-300">
          <HorizontalRow title="My Creators">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="flex-shrink w-56 sm:w-64">
                {/* Passes explicit data item and index directly */}
                <CreatorCard creator={creators[index]} displayIndex={index} />
              </div>
            ))}
          </HorizontalRow>
        </section>

        {/* SECTION 2: Creator Upload Video */}
        <section className="transition-all duration-300">
          {myOwnVideosList.length > 0 ? (
            <HorizontalRow title="Recent Video Uploads">
              {myOwnVideosList.map((video) => (
                <div key={video.id} className="flex-shrink-0 w-64 sm:w-72">
                  <VideoCard video={video} />
                </div>
              ))}
            </HorizontalRow>
          ) : (
            <div className="py-6">
              <h2 className="text-xl font-bold tracking-tight mb-3 text-gray-200">Recent Video Uploads</h2>
              <p className="text-gray-500 text-sm pl-2">No dynamic video content found from your network.</p>
            </div>
          )}
        </section>

        {/* SECTION 3: Creator Upload Image */}
        <section className="transition-all duration-300">
          {myOwnImagesList.length > 0 ? (
            <HorizontalRow title="Recent Image Uploads">
              {myOwnImagesList.map((img) => (
                <div key={img.id} className="flex-shrink-0 w-56 sm:w-64 h-72">
                  <ImageCard image={img} className="w-full h-full object-cover rounded-xl" />
                </div>
              ))}
            </HorizontalRow>
          ) : (
            <div className="py-6">
              <h2 className="text-xl font-bold tracking-tight mb-3 text-gray-200">Recent Image Uploads</h2>
              <p className="text-gray-500 text-sm pl-2">No photos or artwork shared recently.</p>
            </div>
          )}
        </section>
        {/* SECTION 4: Creator Upload Tweet */}
        <section className="transition-all duration-300">
          {myOwnTweetsList.length > 0 ? (
            <HorizontalRow title="Recent Feed Uploads">
              {myOwnTweetsList.map((tweet) => (
                <div key={tweet.id} className="snap-start shrink-0 w-80 sm:w-80 md:w-96">
                  <TweetCard tweet={tweet} className="w-full h-full object-cover rounded-xl" />
                </div>
              ))}
            </HorizontalRow>
          ) : (
            <div className="py-6">
              <h2 className="text-xl font-bold tracking-tight mb-3 text-gray-200">Recent Feed Uploads</h2>
              <p className="text-gray-500 text-sm pl-2">No feed items shared recently.</p>
            </div>
          )}
        </section>

        {/* SECTION 5: Trending Creators */}
        <section className="transition-all duration-300">
          <HorizontalRow title="Trending Creators">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex-shrink-1 w-56 sm:w-64">
                {/* Pulls direct inverted data array layout configurations from layout wrapper level */}
                <CreatorCard creator={trendingList[idx]} displayIndex={idx} />
              </div>
            ))}
          </HorizontalRow>
        </section>

      </main>
      
      {/* Global CSS Injection */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}