import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiCheck, FiHeart, FiX } from "react-icons/fi";
import { getContentLikeStatus, setContentLiked } from "../../api/likesApi";
import { upsertWatchHistory } from "../../api/watchHistoryApi";
import AddToPlaylistButton from "../Playlist/AddToPlaylistButton";

export default function ImageCard({
  image,
  className = "",
  liked: controlledLiked,
  onLike,
}) {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const [savingLike, setSavingLike] = useState(false);
  const [likeError, setLikeError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const imageSource = image.thumb || image.src || image.url;
  const liked = image.isBackendContent ? localLiked : controlledLiked ?? localLiked;

  useEffect(() => {
    if (!image.isBackendContent) return undefined;
    const controller = new AbortController();
    getContentLikeStatus(image.id, { signal: controller.signal })
      .then((status) => {
        if (!controller.signal.aborted) setLocalLiked(status.liked);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLikeError(error.message);
      });
    return () => controller.abort();
  }, [image.id, image.isBackendContent, user]);

  // Prevent background scrolling when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
          document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (image.isBackendContent) {
      if (!user) {
        navigate("/signup");
        return;
      }
      setSavingLike(true);
      setLikeError("");
      try {
        const result = await setContentLiked(image.id, !liked);
        setLocalLiked(result.liked);
      } catch (error) {
        setLikeError(error.message || "Could not update like.");
      } finally {
        setSavingLike(false);
      }
      return;
    }
    setLocalLiked((value) => !value);
    onLike?.(!liked);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
    if (image.isBackendContent && image.id && user) {
      upsertWatchHistory(image.id, 100).catch((error) => {
        setHistoryError(error.message || "Could not save this image to watch history.");
      });
    }
  };

  return (
    <>
      <div
        className={`group relative block min-h-48 overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-lg transition duration-500 hover:-translate-y-1 hover:border-green-500/70 hover:shadow-2xl hover:shadow-black/40 ${className}`}
      >
        <div className="relative w-full h-full overflow-hidden">
          
          {/* Image Trigger for Fullscreen */}
          <button
            type="button"
            onClick={openFullscreen} 
            aria-label={`Preview ${image.title}`}
            className="h-full w-full cursor-zoom-in text-left"
          >
            <img
              src={imageSource}
              alt={image.title || "Image preview"}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </button>

          {/* Hover Gradient Overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,13,19,0) 40%, rgba(10,13,19,0.95) 100%)",
            }}
          >
           

            {/* Creator with Delayed Slide-up Animation */}

          </div>

          {/* Floating Like Button */}
          {image.isBackendContent && (
            <AddToPlaylistButton
              contentId={image.id}
              contentType="Image"
              showLabel={false}
              label="Add image to playlist"
              className="absolute top-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white opacity-100 shadow-md backdrop-blur-md transition hover:bg-black/75 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            />
          )}
          <button
            onClick={handleLike}
            disabled={savingLike}
            aria-label="Like image"
            className={`absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-md transform hover:scale-115 active:scale-95 z-10 ${
              liked 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 opacity-100" 
                : "bg-black/40 text-white border border-white/10 opacity-0 group-hover:opacity-100"
            }`}
          >
            {liked ? (
              <FiCheck className="text-base animate-pulse" />
            ) : (
              <FiHeart className="text-base transition-transform duration-200 hover:text-red-400" />
            )}
          </button>
        </div>
      </div>

      {likeError && <p role="alert" className="mt-1 text-xs text-red-300">{likeError}</p>}
      {historyError && <p role="status" className="mt-1 text-xs text-amber-200">{historyError}</p>}

      {/* --- Fullscreen Modal --- */}
      {isFullscreen && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-xl transition-all duration-300 animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-full backdrop-blur-md transition-all duration-200 z-50 border border-white/10"
          >
            <FiX size={24} />
          </button>

          {/* Fullscreen Image Container */}
        <div
  className="relative max-w-7xl max-h-[85vh] overflow-hidden rounded-2xl bg-neutral-900 border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.7)] animate-scale-up"
  onClick={(e) => e.stopPropagation()}
>
  <img
    src={imageSource}
    alt={image.title || "Image preview"}
    className="w-full h-full max-h-[85vh] object-contain"
  />

  {/*icon */}
          <div className="absolute top-5 right-2 text-white/50 text-xl font-semibold flex gap-1 sidebar-font">
    NeoOriginals+
  </div>

  {image.isBackendContent && (
    <AddToPlaylistButton
      contentId={image.id}
      contentType="Image"
      showLabel={false}
      label="Add image to playlist"
      className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white shadow-lg backdrop-blur-md hover:bg-black/80"
    />
  )}

  {/* Image Info */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-linear-to-t from-black/80 to-transparent flex items-center justify-between">

              <div>

                <h3 className="text-white font-medium text-base md:text-lg">{image.title}</h3>

                <p className="text-neutral-400 text-xs md:text-sm border-l-2 border-amber-500 pl-2">by {image.channel}</p>

              </div>
</div>
        </div>
        </div>
      , document.body)}
    </>
  );
}
