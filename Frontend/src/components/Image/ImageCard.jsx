import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiFlag, FiHeart, FiMoreVertical, FiX } from "react-icons/fi";
import { getContentLikeStatus, setContentLiked } from "../../api/likesApi";
import { upsertWatchHistory } from "../../api/watchHistoryApi";
import { reportContent } from "../../api/reportsApi";
import AddToPlaylistButton from "../Playlist/AddToPlaylistButton";
import ReportCard from "../cards/ReportCard";
import { motion, AnimatePresence } from "framer-motion";

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
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
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
          </div>
          {/* Floating Like Button */}
         <motion.button
  whileTap={{ scale: 0.8 }}
  onClick={handleLike}
  disabled={savingLike}
  aria-label={liked ? "Unlike image" : "Like image"}
  className={`absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition-all duration-300 ${
    liked
      ? "border-red-500/40 bg-red-500/20 text-red-500 opacity-100"
      : "border-white/10 bg-black/40 text-white opacity-0 group-hover:opacity-100"
  }`}
>
  <AnimatePresence mode="wait">
    {liked ? (
      <motion.div
        key="liked"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1.15, rotate: 0 }}
        exit={{ scale: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        <FiHeart className="text-base fill-pink-600 text-red-500" />
      </motion.div>
    ) : (
      <motion.div
        key="unliked"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
      >
        <FiHeart className="text-base transition-colors hover:text-red-400" />
      </motion.div>
    )}
  </AnimatePresence>
</motion.button>
        </div>
      </div>

      {likeError && <p role="alert" className="mt-1 text-xs text-red-300">{likeError}</p>}
      {historyError && <p role="status" className="mt-1 text-xs text-amber-200">{historyError}</p>}
      {showReport && (
        <ReportCard
          tweet={{ handle: image.channel }}
          contentType="Image"
          creatorName={image.channel || "this creator"}
          onClose={() => setShowReport(false)}
          onSubmit={async (reason) => {
            if (!user) {
              navigate("/signup");
              throw new Error("Sign in to report content.");
            }
            if (!image.id || !image.isBackendContent) {
              throw new Error("This image is not available for reporting.");
            }
            await reportContent(image.id, reason);
            setShowReport(false);
          }}
        />
      )}

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
          <div className="absolute top-5 right-2 text-white/80 text-xl font-semibold flex gap-1 sidebar-font">
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
  {image.isBackendContent && (
            <div className="absolute left-16 top-4 ">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setShowMenu((open) => !open);
                }}
                aria-label="More image options"
                aria-expanded={showMenu}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white shadow-md backdrop-blur-md transition hover:bg-black/75"
              >
                <FiMoreVertical />
              </button>
              {showMenu && (
                <div className="absolute  top-full mt-4 left-0 w-36 overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-xl">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setShowMenu(false);
                      setShowReport(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-red-300 transition hover:bg-white/10"
                  >
                    <FiFlag className="h-3.5 w-3.5" />
                    Report image
                  </button>
                </div>
              )}
            </div>
          )}

  {/* Image Info */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-linear-to-t from-black/80 to-transparent flex items-center justify-between">

              <div>

                <h3 className="text-white font-medium text-base md:text-lg">{image.title}</h3>

                <p className="text-neutral-400 text-xs md:text-sm border-l-2 border-green-500 pl-2">by {image.channel}</p>

              </div>
</div>
        </div>
        </div>
      , document.body)}
    </>
  );
}
