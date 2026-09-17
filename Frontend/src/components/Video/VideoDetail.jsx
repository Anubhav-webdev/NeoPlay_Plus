import { useState } from "react";
import { useParams } from "react-router-dom";
import FullVideoCard from "./VideoPlayer";
import { VIDEOS } from "../../constants/data";
import SidebarVideoCard from "./VideoSidebarCard";
import CommentsCard from "../cards/CommentsCard";
import VideoHeaderInfo from "./VideoHeaderInfo";

export default function VideoDetail() {
  const { id } = useParams();
  const [, setIsPlaying] = useState(false);
  
  const video = VIDEOS.find((v) => String(v.id) === String(id));
  const relatedVideos = VIDEOS.filter((v) => String(v.id) !== String(id));

  if (!video) {
    return (
      <main className="min-h-[calc(100vh-58px)] flex items-center justify-center bg-transparent text-white p-4">
        <div className="max-w-md w-full text-center rounded-2xl border border-white/10 bg-transparent p-8 shadow-2xl backdrop-blur-md">
          <h2 className="text-xl font-bold tracking-tight text-white">Resource Missing</h2>
          <p className="mt-2 text-sm text-white/50">We couldn't locate this video file container index data.</p>
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
              <FullVideoCard video={video} />
            </div>

            {/* VIDEO METADATA INFO PANEL */}
            <div >
            <VideoHeaderInfo video={video} />
</div>
            {/* REFACTORED INTERACTIVE LIVE COMMENTS PANEL BLOCK */}
            <div className="mt-2">
              <CommentsCard />
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