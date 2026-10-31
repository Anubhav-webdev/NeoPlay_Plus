import { Globe, Lock, Edit2, Trash2, Film, StickyNote, Plus } from 'lucide-react';

export default function PlaylistHeader({
  activePlaylist,
  activePlaylistId,
  activeTab,
  setActiveTab,
  activeMediaCount,
  activeNotesCount,
  addNote,
  onAddContent,
  openFullEdit,
  deletePlaylist
}) {
  const activePlaylistName = activePlaylist?.name || 'Select a Playlist';

  return (
    <header className="flex flex-col gap-3 px-6 md:px-8 py-4 md:py-6 backdrop-blur-xl border-b border-white/5 z-10 shrink-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg md:text-2xl font-semibold text-white truncate">{activePlaylistName}</h1>
            {activePlaylist && (
              <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md ${
                activePlaylist.visibility === 'public' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'
              }`}>
                {activePlaylist.visibility === 'public' ? <Globe size={11} /> : <Lock size={11} />}
                {activePlaylist.visibility}
              </span>
            )}
          </div>
          {activePlaylist?.description && (
            <p className="text-gray-500 text-sm mt-1 truncate">{activePlaylist.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => activePlaylist && openFullEdit(activePlaylist)} className="text-gray-400 hover:text-blue-400 transition-colors" title="Edit playlist">
            <Edit2 size={18} />
          </button>
          <button onClick={(e) => activePlaylist && deletePlaylist(activePlaylist.id, e)} className="text-gray-400 hover:text-red-400 transition-colors" title="Delete playlist">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'media' ? 'bg-white/10 text-purple-300' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Film size={14} /> Media <span className="text-xs opacity-60">({activeMediaCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'notes' ? 'bg-white/10 text-blue-300' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <StickyNote size={14} /> Notes <span className="text-xs opacity-60">({activeNotesCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'media' && (
            <button
              type="button"
              onClick={onAddContent}
              disabled={!activePlaylistId}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={14} /> <span>Add media</span>
            </button>
          )}
          {activeTab === 'notes' && (
            <button
              onClick={addNote}
              disabled={!activePlaylistId}
              className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 text-white font-medium px-3 py-1.5 rounded-lg transition-all"
            >
              <Plus size={14} /> <span className="hidden sm:inline">Add Note</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
