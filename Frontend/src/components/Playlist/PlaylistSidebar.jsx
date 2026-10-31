import { LayoutGrid, Plus, Folder, Globe, Lock, Edit2, Trash2, Check, Search } from 'lucide-react';

export default function Sidebar({
  playlists = [],
  activePlaylistId,
  setActivePlaylistId,
  setActiveTab,
  createPlaylist,
  editingPlaylistId,
  editPlaylistName,
  setEditPlaylistName,
  savePlaylistName,
  toggleVisibilityQuick,
  openFullEdit,
  deletePlaylist,
  searchTerm,
  setSearchTerm
}) {
  return (
    <nav className="shrink-0 w-full md:w-72 bg-transparent backdrop-blur-2xl border-b md:border-b-0 md:border-r border-white/10 z-50 flex flex-col transition-all duration-300  overflow-x-scrol;l md:overflow-x-hidden md:overflow-y-auto *:[&::-webkit-scrollbar]:hidden"> 
      
      {/* Action Header Panel */}
      <div className="p-4 md:p-6 flex flex-col gap-3.5 md:gap-4 shrink-0">
        
        {/* Logo/Brand Title (Desktop Only) */}
        <div className="hidden md:flex items-center gap-2 text-gray-300">
          <LayoutGrid size={20} className="text-purple-400" />
          <span className="font-semibold tracking-wide sidebar-font text-xl">NeoPlaylists</span>
        </div>

        {/* Action Button Section */}
        <div className="grid grid-cols-1 gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
  {/* Button Wrapper */}
  <div className="w-full sm:w-auto">
    <button
      onClick={createPlaylist}
      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-2.5 px-5 rounded-lg transition-all shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] text-sm md:text-base active:scale-[0.98]"
    >
      <Plus size={18} className="shrink-0" />
      <span className="whitespace-nowrap">New Playlist</span>
    </button>
  </div>

  {/* Search Input Bar */}
  <div className="w-full sm:max-w-md flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 transition-all duration-200 focus-within:border-purple-500/40 focus-within:bg-black/30">
    <Search size={16} className="text-gray-500 shrink-0" />
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search dashboard assets..."
      className="bg-transparent outline-none text-sm text-gray-200 placeholder:text-gray-500 w-full font-light"
    />
  </div>
</div></div>

      {/* Playlists Container Section */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto px-4 pb-4 md:px-3 flex flex-row md:flex-col gap-2 md:space-y-1.5 [&::-webkit-scrollbar]:hidden">
        {playlists.map((pl) => {
          const isActive = activePlaylistId === pl.id;
          const isInlineEditing = editingPlaylistId === pl.id;

          return (
            <div
              key={pl.id}
              onClick={() => {
                setActivePlaylistId(pl.id);
                setActiveTab('media');
              }}
              className={`shrink-0 md:w-full group flex items-center justify-between px-4 py-2.5 md:px-3 md:py-3 rounded-xl cursor-pointer transition-all duration-200 select-none ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 text-purple-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                  : 'border border-white/5 text-gray-400 hover:bg-white/5 hover:text-gray-100 bg-white/5 md:bg-transparent'
              }`}
            >
              {/* Left Wing: Info & Inline Forms */}
              <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                <Folder size={16} className={`shrink-0 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />

                {isInlineEditing ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      type="text"
                      value={editPlaylistName}
                      onChange={(e) => setEditPlaylistName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && savePlaylistName(pl.id)}
                      className="bg-black/60 border border-purple-500/50 rounded-lg px-2 py-0.5 text-xs md:text-sm text-white outline-none w-full focus:border-purple-400 transition-colors"
                    />
                    <button 
                      onClick={() => savePlaylistName(pl.id)} 
                      className="text-emerald-400 hover:text-emerald-300 p-1 shrink-0 bg-emerald-500/10 rounded-md"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <span className="font-medium text-sm md:text-base truncate max-w-[120px] sm:max-w-[160px] md:max-w-full">
                    {pl.name}
                  </span>
                )}
              </div>

              {/* Right Wing: Metadata badges & Action Triggers */}
              {!isInlineEditing && (
                <div className="flex items-center gap-2 shrink-0">
                  {/* Public / Private Badge Toggle */}
                  <button
                    onClick={(e) => toggleVisibilityQuick(pl.id, e)}
                    title={pl.visibility === 'public' ? 'Public — click to make private' : 'Private — click to make public'}
                    className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${
                      pl.visibility === 'public'
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {pl.visibility === 'public' ? <Globe size={11} /> : <Lock size={11} />}
                    <span className="hidden md:inline">{pl.visibility}</span>
                  </button>

                  {/* Context Actions Dashboard Overlay */}
                  <div className="hidden md:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-150 transform translate-x-1 group-hover:translate-x-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openFullEdit(pl); }} 
                      className="text-gray-500 hover:text-blue-400 p-1 rounded-md hover:bg-white/5 transition-colors"
                      title="Edit Settings"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={(e) => deletePlaylist(pl.id, e)} 
                      className="text-gray-500 hover:text-red-400 p-1 rounded-md hover:bg-white/5 transition-colors"
                      title="Delete Playlist"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty Playlists Fallback Notice */}
        {playlists.length === 0 && (
          <div className="text-gray-500 text-xs md:text-sm px-3 py-6 text-center md:text-left font-light">
            No active lists.
          </div>
        )}
      </div>
    </nav>
  );
}
