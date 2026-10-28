import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Layers, Radio } from "lucide-react";
import ProfileHeroHub from "./ProfileHeroHub";
import MediaCatalogStream from "./MediaCatalogStream";
import { getPublishedContent, getPublishedCreatorById } from "../../../api/contentApi";
import {
  getCreatorSubscriptionStatus,
  setCreatorSubscribed,
} from "../../../api/subscriptionsApi";

function toCatalogItem(item) {
  const creator = item.creatorId || {};
  const common = {
    id: item._id,
    creatorId: creator._id,
    title: item.title,
    description: item.description,
    channel: creator.displayName || "Creator",
    avatar: creator.avatar || "",
  };
  if (item.type === "Video") {
    return { ...common, type: "video", thumb: item.thumbnailUrl || item.mediaUrl, src: item.mediaUrl, category: "Video" };
  }
  if (item.type === "Image") {
    return { ...common, type: "image", thumb: item.mediaUrl, src: item.mediaUrl, category: "Image" };
  }
  return {
    ...common,
    type: "tweet",
    name: creator.displayName || "Creator",
    handle: (creator.displayName || "creator").toLowerCase().replace(/[^a-z0-9_]/g, "_"),
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
    category: "Tweet",
  };
}

export default function CreatorProfile() {
  const { creatorId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileTab, setProfileTab] = useState("all");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [updatingSubscription, setUpdatingSubscription] = useState(false);
  const [loadedCreatorId, setLoadedCreatorId] = useState(null);
  const [error, setError] = useState("");
  const loading = loadedCreatorId !== creatorId;

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getPublishedCreatorById(creatorId, { signal: controller.signal }),
      getPublishedContent(undefined, { signal: controller.signal, creatorId }),
    ])
      .then(async ([profile, content]) => {
        setCreator(profile);
        setCatalog(content.map(toCatalogItem));
        if (user) {
          const status = await getCreatorSubscriptionStatus(profile._id, {
            signal: controller.signal,
          });
          if (!controller.signal.aborted) {
            setIsSubscribed(status.subscribed);
            setSubscriberCount(status.subscriberCount);
          }
        } else {
          setIsSubscribed(false);
          setSubscriberCount(null);
        }
        setError("");
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedCreatorId(creatorId);
      });
    return () => controller.abort();
  }, [creatorId, user]);

  const filteredCatalog = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return catalog.filter((item) => {
      const matchesSearch = !query ||
        item.title?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query);
      return matchesSearch && (profileTab === "all" || item.type === profileTab);
    });
  }, [catalog, profileTab, searchQuery]);

  const toggleSubscription = async () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setUpdatingSubscription(true);
    setError("");
    try {
      const result = await setCreatorSubscribed(creator._id, !isSubscribed);
      setIsSubscribed(result.subscribed);
      setSubscriberCount(result.subscriberCount);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingSubscription(false);
    }
  };

  if (loading) {
    return <p className="py-20 text-center text-gray-400">Loading creator profile...</p>;
  }
  if (error && (!creator || creator._id !== creatorId)) {
    return <p role="alert" className="py-20 text-center text-red-300">{error}</p>;
  }
  if (!creator || creator._id !== creatorId) return null;

  const channelIdentity = {
    id: creator._id,
    name: creator.displayName,
    handle: creator.displayName.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    avatar: creator.avatar,
    createdAt: creator.createdAt,
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 relative overflow-x-hidden antialiased selection:bg-purple-500/30 selection:text-purple-200 pb-12 all-font">
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-purple-950/15 via-blue-950/5 to-transparent pointer-events-none z-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 relative z-10">
        <ProfileHeroHub
          channelIdentity={channelIdentity}
          isSubscribed={isSubscribed}
          onToggleSubscription={toggleSubscription}
          subscriptionBusy={updatingSubscription}
          subscriberCount={subscriberCount}
        />
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <div className="grid grid-cols-1 gap-6 items-start">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ...(subscriberCount === null ? [] : [
                  { label: "Subscribers", value: subscriberCount, icon: Radio, color: "text-purple-400", bg: "bg-purple-500/10" },
                ]),
                { label: "Published content", value: catalog.length, icon: Layers, color: "text-cyan-400", bg: "bg-cyan-500/10" },
              ].map((metric) => (
                <div key={metric.label} className="flex min-h-[90px] items-center gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
                  <div className={`rounded-xl p-3 ${metric.bg}`}><metric.icon className={`h-5 w-5 ${metric.color}`} /></div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">{metric.label}</p>
                    <h3 className="mt-0.5 text-lg font-bold text-white">{metric.value}</h3>
                  </div>
                </div>
              ))}
            </div>
            <MediaCatalogStream
              profileTab={profileTab}
              setProfileTab={setProfileTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredCatalog={filteredCatalog}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
