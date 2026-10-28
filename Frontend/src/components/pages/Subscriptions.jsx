import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import HorizontalRow from "../common/HorizontalRow";
import CreatorCard from "../cards/CreatorCards";
import VideoCard from "../Video/Videocard";
import ImageCard from "../Image/ImageCard";
import TweetCard from "../Tweet/TweetCard";
import { getPublishedContent } from "../../api/contentApi";
import { getMySubscriptions } from "../../api/subscriptionsApi";

function toCard(item) {
  const creator = item.creatorId || {};
  const common = {
    id: item._id,
    creatorId: creator._id,
    channel: creator.displayName || "Creator",
    name: creator.displayName || "Creator",
    handle: (creator.displayName || "creator")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_"),
    avatar: creator.avatar || "",
    title: item.title,
    description: item.description,
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
    time: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "",
    likes: 0,
    retweets: 0,
    commentCount: item.commentCount || 0,
    hasPreview: Boolean(item.mediaUrl),
    mediaUrl: item.mediaUrl || "",
    mediaType: item.mediaAssetId?.mediaType || "",
    initialComments: [],
    isBackendContent: true,
  };
}

export default function SubscriptionsDashboard() {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [content, setContent] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [error, setError] = useState("");
  const userId = user?._id || user?.id;
  const loading = Boolean(user && loadedUserId !== userId);

  useEffect(() => {
    if (!user) return undefined;
    const controller = new AbortController();
    Promise.all([
      getMySubscriptions({ signal: controller.signal }),
    ])
      .then(async ([subscriptions]) => {
        const subscribedCreators = subscriptions
          .map((subscription) => subscription.creatorId)
          .filter(Boolean);
        setCreators(subscribedCreators.map((creator) => ({
          ...creator,
          id: creator._id,
          name: creator.displayName,
        })));
        const creatorContent = await Promise.all(
          subscribedCreators.map((creator) =>
            getPublishedContent(undefined, {
              signal: controller.signal,
              creatorId: creator._id,
            }),
          ),
        );
        if (!controller.signal.aborted) {
          setContent(
            creatorContent
              .flat()
              .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
              .map(toCard),
          );
          setError("");
        }
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedUserId(userId);
      });
    return () => controller.abort();
  }, [user, userId]);

  const videos = content.filter((item) => item.contentType === "video");
  const images = content.filter((item) => item.contentType === "image");
  const tweets = content.filter((item) => item.contentType === "tweet");

  return (
    <div className="min-h-screen max-w-full bg-transparent text-white all-font selection:bg-cyan-500 selection:text-black antialiased pb-16 overflow-hidden pl-4">
      <header className="pt-8 pb-4 px-4 sm:px-6 md:px-8 mx-auto border-b border-gray-800/60 mb-6">
        <h2 className="mt-1 text-3xl font-black tracking-wide text-white sidebar-font">
          My Subscriptions
        </h2>
        <p className="text-sm text-gray-400 mt-1 sm:text-base">
          Stay updated with content from creators you follow.
        </p>
      </header>

      <main className="max-w-full mx-auto px-1 md:px-1 space-y-6 sm:ml-7">
        {!user ? (
          <div className="py-12 text-center text-gray-300">
            <p>Sign in to see creators you follow and their latest posts.</p>
            <button
              className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-white"
              onClick={() => navigate("/signup")}
            >
              Sign in
            </button>
          </div>
        ) : loading ? (
          <p className="py-10 text-center text-gray-400">Loading your subscriptions...</p>
        ) : error ? (
          <p role="alert" className="py-10 text-center text-red-300">{error}</p>
        ) : (
          <>
            {creators.length > 0 ? (
              <HorizontalRow title="My Creators">
                {creators.map((creator, index) => (
                  <div key={creator.id} className="flex-shrink-0 w-56 sm:w-64">
                    <CreatorCard creator={creator} displayIndex={index} />
                  </div>
                ))}
              </HorizontalRow>
            ) : (
              <section className="py-8 text-center text-gray-400">
                <p>You are not following any creators yet.</p>
                <Link className="mt-2 inline-block text-cyan-400 hover:underline" to="/trending">
                  Discover creators
                </Link>
              </section>
            )}

            {videos.length > 0 && (
              <HorizontalRow title="Recent Video Uploads">
                {videos.map((video) => (
                  <div key={video.id} className="flex-shrink-0 w-64 sm:w-72">
                    <VideoCard video={video} />
                  </div>
                ))}
              </HorizontalRow>
            )}
            {images.length > 0 && (
              <HorizontalRow title="Recent Image Uploads">
                {images.map((image) => (
                  <div key={image.id} className="flex-shrink-0 w-56 sm:w-64">
                    <ImageCard image={image} className="w-full rounded-xl" />
                  </div>
                ))}
              </HorizontalRow>
            )}
            {tweets.length > 0 && (
              <HorizontalRow title="Recent Feed Uploads">
                {tweets.map((tweet) => (
                  <div key={tweet.id} className="shrink-0 w-80 sm:w-96">
                    <TweetCard tweet={tweet} className="w-full rounded-xl" />
                  </div>
                ))}
              </HorizontalRow>
            )}
            {creators.length > 0 && content.length === 0 && (
              <p className="py-6 text-center text-gray-500">
                Your followed creators have not published any content yet.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
