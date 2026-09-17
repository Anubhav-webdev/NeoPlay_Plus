import React from 'react';
import { X, Lock, Globe } from 'lucide-react';

export default function EditPlaylistModal({
  fullEditPlaylist,
  setFullEditPlaylist,
  draftName,
  setDraftName,
  draftDesc,
  setDraftDesc,
  draftVisibility,
  setDraftVisibility,
  saveFullEdit
}) {
  if (fullEditPlaylist === null) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0d0e15] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Edit Playlist</h2>
          <button onClick={() => setFullEditPlaylist(null)} className="text-gray-500 hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1.5">Name</label>
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-400 mb-4"
        />

        <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1.5">Description</label>
        <textarea
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
          rows={3}
          placeholder="What's this playlist for?"
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-400 mb-4 resize-none"
        />

        <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">Visibility</label>
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setDraftVisibility('private')}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg border transition-colors ${
              draftVisibility === 'private' ? 'bg-gray-500/15 border-gray-400 text-gray-100' : 'border-white/10 text-gray-500 hover:bg-white/5'
            }`}
          >
            <Lock size={14} /> Private
          </button>
          <button
            onClick={() => setDraftVisibility('public')}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg border transition-colors ${
              draftVisibility === 'public' ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300' : 'border-white/10 text-gray-500 hover:bg-white/5'
            }`}
          >
            <Globe size={14} /> Public
          </button>
        </div>
        <p className="text-xs text-gray-600 -mt-4 mb-6">
          {draftVisibility === 'public' ? 'Anyone with the link can view this playlist.' : 'Only you can see this playlist.'}
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={() => setFullEditPlaylist(null)} className="text-sm text-gray-400 hover:text-gray-200 px-4 py-2">Cancel</button>
          <button onClick={saveFullEdit} className="text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium px-4 py-2 rounded-lg">Save changes</button>
        </div>
      </div>
    </div>
  );
}