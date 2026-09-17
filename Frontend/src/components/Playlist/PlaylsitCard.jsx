import { Link } from "react-router-dom";
import { RiPlayList2Fill } from "react-icons/ri";

export default function PlaylistCard({ playlist } = {}) {
  const playlistData = playlist || {
    id: "trending-playlist",
    title: "Trending Playlist",
    channel: "NeoPlay+",
    videoCount: 10,
  };
  const videoCount = playlistData.videoCount || playlistData.videos?.length || 10;

  return (
    <Link to={`/playlist/${playlistData.id}`}>
     <div className="group block w-55  shrink-0 cursor-pointer text-white sm:w-70  hover:border-2 hover:border-cyan-500/30 transition-all duration-300 rounded-xl overflow-hidden shadow-lg shadow-black/20 border-t-6 border-stone-500/30">

      <div className="relative mb-2 aspect-video overflow-hidden  min-h-40 sm:min-h-60 bg-gray-800">
          <img
            src={playlistData.thumb || playlistData.coverImage || "/placeholder-playlist.jpg"}
            alt={playlistData.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-black/75 px-2 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <RiPlayList2Fill className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>{videoCount} {videoCount === 1 ? "video" : "videos"}</span>
          </div>
      </div>

      <div className="px-5 py-2">
        <h6 className="mb-1 truncate text-sm font-semibold leading-snug text-white transition-colors group-hover:text-cyan-400">
          {playlistData.title}
        </h6>

        <div className="flex items-center gap-1 text-xs text-gray-400">
          <p className="truncate">
            {playlistData.channel || playlistData.author || "NeoPlay+"}
          </p>
          <span aria-hidden="true">•</span>
          <span className="shrink-0">Playlist</span>
        </div>
      </div>
      </div>
    </Link>
  );
}