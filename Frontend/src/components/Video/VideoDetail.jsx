import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import FullVideoCard from "./VideoPlayer";
import SidebarVideoCard from "./VideoSidebarCard";
import CommentsCard from "../cards/CommentsCard";
import VideoHeaderInfo from "./VideoHeaderInfo";
import {
  getPublishedContent,
  getPublishedContentById,
  recordPublishedContentView,
} from "../../api/contentApi";

export default function VideoDetail() {
  const { id } = useParams();
  const [, setIsPlaying] = useState(false);
  const [publishedResult, setPublishedResult] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const recordedViewId = useRef(null);

  const recordViewOnPlayback = useCallback(() => {
    if (!id || recordedViewId.current === id) return;
    recordedViewId.current = id;
    recordPublishedContentView(id)
      .then((viewCount) => {
        setPublishedResult((current) =>
          current?.id === id && current.video
            ? { ...current, video: { ...current.video, views: viewCount } }
            : current,
        );
      })
      .catch((error) => {
        if (recordedViewId.current === id) recordedViewId.current = null;
        console.error("Could not record video view", error);
      });
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    getPublishedContentById(id, { signal: controller.signal })
      .then((item) => {
        if (item.type !== "Video" || !item.mediaUrl) {
          throw new Error("This item is not a published video.");
        }
        setPublishedResult({
          id,
          video: {
            id: item._id,
            title: item.title,
            views: item.viewCount || 0,
            time: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "",
            channel: item.creatorId?.displayName || "Creator",
            creatorId: item.creatorId?._id,
            avatar: item.creatorId?.avatar || "",
            description: item.description || "",
            thumb: item.thumbnailUrl || item.thumbnailAssetId?.secureUrl || "",
            src: item.mediaUrl,
            category: item.categoryIds?.[0]?.name || "General",
            createdAt: item.publishedAt || item.createdAt,
          },
          error: "",
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setPublishedResult({ id, video: null, error: error.message });
        }
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    getPublishedContent("Video", { signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        setRelatedVideos(items
          .filter((item) => String(item._id) !== String(id))
          .map((item) => ({
            id: item._id,
            title: item.title,
            views: item.viewCount || 0,
            channel: item.creatorId?.displayName || "Creator",
            thumb: item.thumbnailUrl || item.thumbnailAssetId?.secureUrl || "",
            duration: item.mediaAssetId?.metadata?.duration
              ? `${Math.floor(item.mediaAssetId.metadata.duration / 60)}:${String(Math.floor(item.mediaAssetId.metadata.duration % 60)).padStart(2, "0")}`
              : "",
          })));
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Could not load related videos", error);
      });
    return () => controller.abort();
  }, [id]);

  const isRemoteResultForRoute = publishedResult?.id === id;
  const video = isRemoteResultForRoute ? publishedResult.video : null;
  const isLoading = !isRemoteResultForRoute;
  const loadError = isRemoteResultForRoute ? publishedResult.error : "";

  if (!video) {
    return (
      <main className="min-h-[calc(100vh-58px)] flex items-center justify-center bg-transparent text-white p-4">
        <div className="max-w-md w-full text-center rounded-2xl border border-white/10 bg-transparent p-8 shadow-2xl backdrop-blur-md">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {isLoading ? "Loading video" : "Resource Missing"}
          </h2>
          <p className="mt-2 text-sm text-white/50">
            {isLoading
              ? "Loading published video details."
              : loadError || "We couldn't locate this video file container index data."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-60px)] bg-transparent text-white px-1 py-1 sm:px-4 lg:px-4  pb-20 md:pb-0">
      <div className="mx-auto max-w-full">
        {/* COMPONENT COLUMN DIVISION HOOKS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* PRIMARY FEED PANEL COLUMN */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            
            {/* LIVE CONSOLE PLAYER CANVAS CONTAINER */}
            <div className="w-full overflow-hidden rounded-xl shadow-xl h-full">
              <FullVideoCard
                video={video}
                onPlaybackStart={recordViewOnPlayback}
              />
            </div>

            {/* VIDEO METADATA INFO PANEL */}
            <div >
            <VideoHeaderInfo video={video} />
</div>
            {/* REFACTORED INTERACTIVE LIVE COMMENTS PANEL BLOCK */}
            <div className="mt-2">
              <CommentsCard contentId={video.id} />
            </div>

          </div>

          {/* RIGHT SIDEBAR SUGGESTIONS LAYER PANEL */}
          <aside className="lg:col-span-1 w-full">
            
            <SidebarVideoCard relatedVideos={relatedVideos} setIsPlaying={setIsPlaying} />
          </aside>

        </div>
      </div>
    </main>
  );
}