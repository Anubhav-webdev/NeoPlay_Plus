import { useEffect, useState } from "react";
import { Folder, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Playlist/PlaylistSidebar";
import PlaylistHeader from "../Playlist/PlaylistHeader";
import NotesGrid from "../Playlist/PlaylistNotesGrid";
import EditPlaylistModal from "../Playlist/EditPlaylistModal";
import ImageCard from "../Image/ImageCard";
import VideoCard from "../Video/Videocard";
import {
  addPlaylistContent,
  createPlaylist as createPlaylistRequest,
  deletePlaylist as deletePlaylistRequest,
  getMyPlaylists,
  removePlaylistContent,
  updatePlaylist as updatePlaylistRequest,
} from "../../api/playlistsApi";
import { getPublishedContent } from "../../api/contentApi";

function mapPlaylist(playlist) {
  const items = (playlist.contentIds || []).filter(Boolean).map((content) => ({
    ...content,
    id: content._id,
    type: content.type?.toLowerCase(),
    thumb: content.thumbnailUrl || content.thumbnailAssetId?.secureUrl || "",
    src: content.mediaUrl,
    channel: content.creatorId?.displayName || "Creator",
  }));
  return {
    id: playlist._id,
    name: playlist.name,
    visibility: playlist.isPublic ? "public" : "private",
    count: items.length,
    description: playlist.description || "",
    notes: (playlist.notes || []).map((note) => ({
      id: String(note._id || note.id),
      playlistId: playlist._id,
      title: note.title || "Untitled note",
      content: note.content || "",
      updatedAt: note.updatedAt ? new Date(note.updatedAt).toLocaleString() : "just now",
    })),
    items,
  };
}

export default function PlaylistDashboard() {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [activeTab, setActiveTab] = useState("media");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [error, setError] = useState("");
  const userId = user?._id || user?.id;
  const loading = Boolean(user && loadedUserId !== userId);
  const [availableContent, setAvailableContent] = useState([]);
  const [selectedContentId, setSelectedContentId] = useState("");
  const [showAddContent, setShowAddContent] = useState(false);

  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [editPlaylistName, setEditPlaylistName] = useState("");
  const [fullEditPlaylist, setFullEditPlaylist] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftVisibility, setDraftVisibility] = useState("private");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState({ title: "", content: "" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    const controller = new AbortController();
    getMyPlaylists({ signal: controller.signal })
      .then((result) => {
        const mapped = result.map(mapPlaylist);
        setPlaylists(mapped);
        setActivePlaylistId((current) =>
          mapped.some((playlist) => playlist.id === current)
            ? current
            : mapped[0]?.id || null,
        );
        setError("");
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedUserId(userId);
      });
    return () => controller.abort();
  }, [user, userId]);

  const createPlaylist = () => {
    setIsCreatingPlaylist(true);
    setFullEditPlaylist("new");
    setDraftName("");
    setDraftDescription("");
    setDraftVisibility("private");
    setError("");
  };

  const deletePlaylist = async (id, event) => {
    event?.stopPropagation();
    try {
      await deletePlaylistRequest(id);
      const remaining = playlists.filter((playlist) => playlist.id !== id);
      setPlaylists(remaining);
      if (activePlaylistId === id) setActivePlaylistId(remaining[0]?.id || null);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const savePlaylistName = async (id) => {
    try {
      const updated = mapPlaylist(await updatePlaylistRequest(id, { name: editPlaylistName }));
      setPlaylists((current) => current.map((playlist) => playlist.id === id ? updated : playlist));
      setEditingPlaylistId(null);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const openFullEdit = (playlist) => {
    setIsCreatingPlaylist(false);
    setFullEditPlaylist(playlist.id);
    setDraftName(playlist.name);
    setDraftDescription(playlist.description || "");
    setDraftVisibility(playlist.visibility);
    setError("");
  };

  const closePlaylistModal = () => {
    setIsCreatingPlaylist(false);
    setFullEditPlaylist(null);
  };

  const saveFullEdit = async () => {
    try {
      if (isCreatingPlaylist) {
        const created = mapPlaylist(await createPlaylistRequest(
          draftName,
          draftVisibility === "public",
          draftDescription,
        ));
        setPlaylists((current) => [created, ...current]);
        setActivePlaylistId(created.id);
        setActiveTab("media");
        closePlaylistModal();
        setError("");
        return;
      }
      const updated = mapPlaylist(await updatePlaylistRequest(fullEditPlaylist, {
        name: draftName,
        description: draftDescription,
        isPublic: draftVisibility === "public",
      }));
      setPlaylists((current) => current.map((playlist) =>
        playlist.id === fullEditPlaylist ? updated : playlist,
      ));
      closePlaylistModal();
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const toggleVisibilityQuick = async (id, event) => {
    event.stopPropagation();
    const playlist = playlists.find((item) => item.id === id);
    if (!playlist) return;
    try {
      const updated = mapPlaylist(await updatePlaylistRequest(id, {
        isPublic: playlist.visibility !== "public",
      }));
      setPlaylists((current) => current.map((item) => item.id === id ? updated : item));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deleteMedia = async (contentId) => {
    try {
      const updated = mapPlaylist(await removePlaylistContent(activePlaylistId, contentId));
      setPlaylists((current) => current.map((playlist) =>
        playlist.id === activePlaylistId ? updated : playlist,
      ));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const openAddContent = async () => {
    if (showAddContent) {
      setShowAddContent(false);
      return;
    }
    try {
      setAvailableContent(await getPublishedContent());
      setSelectedContentId("");
      setShowAddContent(true);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const addContent = async () => {
    if (!selectedContentId || !activePlaylistId) return;
    try {
      const updated = mapPlaylist(await addPlaylistContent(activePlaylistId, selectedContentId));
      setPlaylists((current) => current.map((playlist) =>
        playlist.id === activePlaylistId ? updated : playlist,
      ));
      setShowAddContent(false);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const addNote = async () => {
    if (!activePlaylist) return;
    try {
      const notes = [
        { title: "New note", content: "" },
        ...activePlaylist.notes.map((note) => ({ _id: note.id, title: note.title, content: note.content })),
      ];
      const saved = mapPlaylist(await updatePlaylistRequest(activePlaylist.id, { notes }));
      setPlaylists((current) => current.map((item) => item.id === saved.id ? saved : item));
      setEditingNoteId(saved.notes[0]?.id || null);
      setNoteDraft({ title: saved.notes[0]?.title || "New note", content: "" });
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const startEditNote = (note) => {
    setEditingNoteId(note.id);
    setNoteDraft({ title: note.title, content: note.content });
  };
  const saveNote = async (id) => {
    if (!activePlaylist) return;
    try {
      const notes = activePlaylist.notes.map((note) => ({
        _id: note.id,
        title: note.id === id ? (noteDraft.title.trim() || "Untitled note") : note.title,
        content: note.id === id ? noteDraft.content : note.content,
      }));
      const saved = mapPlaylist(await updatePlaylistRequest(activePlaylist.id, { notes }));
      setPlaylists((current) => current.map((item) => item.id === saved.id ? saved : item));
      setEditingNoteId(null);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const deleteNote = async (id) => {
    if (!activePlaylist) return;
    try {
      const notes = activePlaylist.notes.filter((note) => note.id !== id)
        .map((note) => ({ _id: note.id, title: note.title, content: note.content }));
      const saved = mapPlaylist(await updatePlaylistRequest(activePlaylist.id, { notes }));
      setPlaylists((current) => current.map((item) => item.id === saved.id ? saved : item));
      if (editingNoteId === id) setEditingNoteId(null);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const activePlaylist = playlists.find((playlist) => playlist.id === activePlaylistId);
  const activeMedia = (activePlaylist?.items || []).filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const activeNotes = activePlaylist?.notes || [];

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-white">
        <p>Sign in to manage your playlists.</p>
        <button className="rounded-lg bg-purple-600 px-4 py-2" onClick={() => navigate("/signup")}>Sign in</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-transparent text-white font-sans selection:bg-purple-500/30 md:fixed md:flex-row relative z-10 pb-15">
      <Sidebar
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        setActivePlaylistId={setActivePlaylistId}
        setActiveTab={setActiveTab}
        createPlaylist={createPlaylist}
        editingPlaylistId={editingPlaylistId}
        editPlaylistName={editPlaylistName}
        setEditPlaylistName={setEditPlaylistName}
        savePlaylistName={savePlaylistName}
        toggleVisibilityQuick={toggleVisibilityQuick}
        openFullEdit={openFullEdit}
        deletePlaylist={deletePlaylist}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <main className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
        <PlaylistHeader
          activePlaylist={activePlaylist}
          activePlaylistId={activePlaylistId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeMediaCount={activeMedia.length}
          activeNotesCount={activeNotes.length}
          addNote={addNote}
          openFullEdit={openFullEdit}
          deletePlaylist={deletePlaylist}
        />
        <div className="mb-8 flex-1 overflow-y-auto bg-[#0b1220] p-2">
          {error && <p role="alert" className="mb-4 text-center text-sm text-red-300">{error}</p>}
          {loading ? (
            <p className="py-10 text-center text-gray-400">Loading playlists...</p>
          ) : !activePlaylistId ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-gray-500">
              <Folder size={48} className="mb-4 text-purple-400 opacity-20" />
              <p>Create a playlist to get started.</p>
            </div>
          ) : activeTab === "media" ? (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={openAddContent}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-500"
                >
                  {showAddContent ? "Cancel" : "Add published content"}
                </button>
              </div>
              {showAddContent && (
                <div className="mb-5 flex flex-col gap-2 rounded-xl border border-white/10 p-4 sm:flex-row">
                  <select
                    value={selectedContentId}
                    onChange={(event) => setSelectedContentId(event.target.value)}
                    className="min-w-0 flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">Choose published content</option>
                    {availableContent
                      .filter((item) => !activePlaylist.items.some((saved) => saved.id === item._id))
                      .map((item) => (
                        <option key={item._id} value={item._id}>{item.title}</option>
                      ))}
                  </select>
                  <button
                    onClick={addContent}
                    disabled={!selectedContentId}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Add to playlist
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeMedia.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-gray-500">
                    No items in this playlist yet.
                  </div>
                ) : activeMedia.map((item) => (
                  <div key={item.id} className="group relative min-w-0">
                    {item.type === "image" ? (
                      <ImageCard image={item} className="w-full" />
                    ) : item.type === "video" ? (
                      <VideoCard video={item} className="w-full animate-fade-in" />
                    ) : (
                      <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                        <p className="text-sm text-white">{item.title}</p>
                        <p className="mt-2 text-xs text-gray-400">{item.description}</p>
                      </div>
                    )}
                    <button
                      onClick={() => deleteMedia(item.id)}
                      aria-label={`Remove ${item.title} from playlist`}
                      title="Remove from playlist"
                      className="absolute left-3 top-3 z-30 rounded-md bg-rose-600/90 p-2 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-rose-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <NotesGrid
                activeNotes={activeNotes}
                editingNoteId={editingNoteId}
                setEditingNoteId={setEditingNoteId}
                noteDraft={noteDraft}
                setNoteDraft={setNoteDraft}
                startEditNote={startEditNote}
                saveNote={saveNote}
                deleteNote={deleteNote}
              />
            </>
          )}
        </div>
      </main>
      <EditPlaylistModal
        fullEditPlaylist={isCreatingPlaylist ? "new" : fullEditPlaylist}
        setFullEditPlaylist={setFullEditPlaylist}
        isCreating={isCreatingPlaylist}
        onClose={closePlaylistModal}
        error={error}
        draftName={draftName}
        setDraftName={setDraftName}
        draftDescription={draftDescription}
        setDraftDescription={setDraftDescription}
        draftVisibility={draftVisibility}
        setDraftVisibility={setDraftVisibility}
        saveFullEdit={saveFullEdit}
      />
    </div>
  );
}
