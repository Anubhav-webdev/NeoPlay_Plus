import React from 'react';
import { StickyNote, FileText, Edit2, Trash2, X, Save } from 'lucide-react';

export default function NotesGrid({
  activeNotes,
  editingNoteId,
  setEditingNoteId,
  noteDraft,
  setNoteDraft,
  startEditNote,
  saveNote,
  deleteNote
}) {
  if (activeNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 min-h-[50vh]">
        <StickyNote size={48} className="mb-4 opacity-20 text-blue-400" />
        <p>No notes yet. Jot down prep for any topic.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {activeNotes.map((note) => (
        <div key={note.id} className="bg-[#0d0e15] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 hover:border-blue-500/30 transition-colors">
          {editingNoteId === note.id ? (
            <>
              <input
                autoFocus
                value={noteDraft.title}
                onChange={(e) => setNoteDraft({ ...noteDraft, title: e.target.value })}
                placeholder="Note title"
                className="bg-black/40 border border-blue-500/40 rounded-lg px-3 py-1.5 text-sm font-medium text-white outline-none focus:border-blue-400"
              />
              <textarea
                value={noteDraft.content}
                onChange={(e) => setNoteDraft({ ...noteDraft, content: e.target.value })}
                placeholder="Write your prep notes here..."
                rows={5}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-400 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingNoteId(null)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 px-2 py-1">
                  <X size={13} /> Cancel
                </button>
                <button onClick={() => saveNote(note.id)} className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md">
                  <Save size={13} /> Save
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-gray-100 flex items-center gap-2">
                  <FileText size={14} className="text-blue-400 shrink-0" /> {note.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEditNote(note)} className="text-gray-500 hover:text-blue-400 p-1 rounded hover:bg-white/10">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => deleteNote(note.id)} className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/10">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-400 whitespace-pre-wrap line-clamp-5">{note.content || 'Empty note — click edit to add prep details.'}</p>
              <span className="text-[11px] text-gray-600 mt-auto">Updated {note.updatedAt}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}