import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiCheck, FiLoader } from "react-icons/fi";
import { MdPlaylistAdd } from "react-icons/md";
import { addPlaylistContent, getMyPlaylists } from "../../api/playlistsApi";

function playlistContainsContent(playlist, contentId) {
  return (playlist.contentIds || []).some((item) => {
    const itemId = typeof item === "object" ? item?._id || item?.id : item;
    return String(itemId) === String(contentId);
  });
}

export default function AddToPlaylistButton({
  contentId,
  contentType,
  className = "",
  iconClassName = "h-4 w-4",
  label = "Add to playlist",
  showLabel = true,
}) {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const userId = user?._id || user?.id;
  const normalizedUserId = userId ? String(userId) : null;
  const [playlistState, setPlaylistState] = useState({ ownerId: null, items: [] });
  const playlists = playlistState.ownerId === normalizedUserId ? playlistState.items : [];
  const [loadState, setLoadState] = useState({ ownerId: null, loading: false });
  const loading = Boolean(
    normalizedUserId &&
      (loadState.ownerId !== normalizedUserId || loadState.loading),
  );
  const [addingId, setAddingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isSupported = contentType === "Video" || contentType === "Image";

  useEffect(() => {
    if (!isOpen || !normalizedUserId) return undefined;
    const controller = new AbortController();
    getMyPlaylists({ signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) {
          setPlaylistState({ ownerId: normalizedUserId, items: items || [] });
          setError("");
          setSuccess("");
        }
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError.message || "Could not load your playlists.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadState({ ownerId: normalizedUserId, loading: false });
        }
      });
    return () => controller.abort();
  }, [isOpen, normalizedUserId]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const closeOnViewportChange = () => setIsOpen(false);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [isOpen]);

  const toggleMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isSupported || !contentId) return;
    if (!user) {
      navigate("/signup");
      return;
    }
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    const width = Math.min(300, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect?.left ?? 8, window.innerWidth - width - 8));
    const menuHeight = Math.min(360, window.innerHeight - 16);
    const below = (rect?.bottom ?? 8) + 8;
    const top = below + menuHeight <= window.innerHeight
      ? below
      : Math.max(8, (rect?.top ?? 8) - menuHeight - 8);
    setPosition({ top, left });
    setLoadState({ ownerId: normalizedUserId, loading: true });
    setError("");
    setSuccess("");
    setIsOpen(true);
  };

  const addToPlaylist = async (event, playlist) => {
    event.preventDefault();
    event.stopPropagation();
    if (playlistContainsContent(playlist, contentId)) return;
    setAddingId(String(playlist._id));
    setError("");
    setSuccess("");
    try {
      const updated = await addPlaylistContent(playlist._id, contentId);
      setPlaylistState((current) => ({
        ownerId: normalizedUserId,
        items: (current.ownerId === normalizedUserId ? current.items : []).map((item) => (
          String(item._id) === String(updated._id) ? updated : item
        )),
      }));
      setSuccess(`Added to ${playlist.name}`);
    } catch (requestError) {
      setError(requestError.message || "Could not add this item to the playlist.");
    } finally {
      setAddingId("");
    }
  };

  if (!isSupported || !contentId) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggleMenu}
        className={className}
      >
        <MdPlaylistAdd aria-hidden="true" className={iconClassName} />
        {showLabel && <span>{label}</span>}
      </button>
      {isOpen && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Your playlists"
          onClick={(event) => event.stopPropagation()}
          className="fixed z-[100] max-h-[min(360px,calc(100vh-16px))] w-[min(300px,calc(100vw-16px))] overflow-y-auto rounded-xl border border-white/15 bg-[#111923] p-3 text-white shadow-2xl shadow-black/60"
          style={{ top: position.top, left: position.left }}
        >
          <div className="mb-2 border-b border-white/10 pb-2">
            <p className="text-sm font-semibold">Save to a playlist</p>
            <p className="mt-0.5 text-xs text-slate-400">Choose one of your playlists.</p>
          </div>

          {loading && (
            <p className="flex items-center gap-2 py-3 text-xs text-slate-300">
              <FiLoader className="animate-spin" /> Loading your playlists…
            </p>
          )}
          {!loading && error && <p role="alert" className="py-2 text-xs text-rose-300">{error}</p>}
          {!loading && !error && playlists.length === 0 && (
            <div className="py-2">
              <p className="text-xs text-slate-300">
                {user ? "You haven’t created a playlist yet." : "Sign in to save this item to a playlist."}
              </p>
              <Link
                to={user ? "/playlists" : "/signup"}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsOpen(false);
                }}
                className="mt-2 inline-flex rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
              >
                {user ? "Create a playlist" : "Sign in"}
              </Link>
            </div>
          )}
          {!loading && !error && playlists.length > 0 && (
            <ul className="space-y-1">
              {playlists.map((playlist) => {
                const alreadyAdded = playlistContainsContent(playlist, contentId);
                const isAdding = addingId === String(playlist._id);
                return (
                  <li key={playlist._id}>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={alreadyAdded || Boolean(addingId)}
                      onClick={(event) => addToPlaylist(event, playlist)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 disabled:cursor-default disabled:opacity-70"
                    >
                      <span className="min-w-0 truncate">{playlist.name}</span>
                      {isAdding ? <FiLoader className="shrink-0 animate-spin" /> : alreadyAdded ? <FiCheck className="shrink-0 text-emerald-400" aria-label="Already added" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {success && <p role="status" className="mt-2 text-xs text-emerald-300">{success}</p>}
        </div>,
        document.body,
      )}
    </>
  );
}
