import { createSlice } from "@reduxjs/toolkit";

/**
 * Playlist Slice — manages playlists, media items, and notes
 * Covers: Playlists, PlaylistSidebar, PlaylistHeader, PlaylistNotesGrid, EditPlaylistModal
 */

const initialState = {
  // Playlists array
  playlists: [
    { id: 1, name: 'Project References', description: 'UI patterns and demos worth revisiting.', visibility: 'private', count: 4 },
    { id: 2, name: 'UI Inspirations', description: 'Public moodboard, shareable with the team.', visibility: 'public', count: 3 },
  ],
  activePlaylistId: 1,
  activeTab: 'media', // media | notes

  // Media items within playlists
  mediaItems: [
    { id: 1, playlistId: 1, type: 'video', title: "Big Buck Bunny", views: "10.3k", time: "44 minutes ago", channel: "Bunny", duration: "0:38", thumb: "https://images.pexels.com/photos/1739849/pexels-photo-1739849.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/2519812/pexels-photo-2519812.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory: "Cartoon" },
    { id: 2, playlistId: 1, type: 'video', title: "Getting Started with Express.js", views: "11k", time: "5 hours ago", channel: "Express Learner", duration: "3:44", thumb: "https://images.pexels.com/photos/1739849/pexels-photo-1739849.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/2519812/pexels-photo-2519812.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory: "Education" },
  ],

  // Notes within playlists
  notes: [
    { id: 1, playlistId: 1, title: 'Kickoff prep', content: 'Topics to cover: goals, timeline, who owns what.', updatedAt: 'Jul 2' },
  ],

  // Editing states
  editingPlaylistId: null,
  editPlaylistName: '',
  fullEditPlaylist: null,
  draftName: '',
  draftDesc: '',
  draftVisibility: 'private',
  editingNoteId: null,
  noteDraft: { title: '', content: '' },

  // Search
  searchTerm: '',
};

const playlistSlice = createSlice({
  name: "playlist",
  initialState,
  reducers: {
    // --- Playlist CRUD ---
    createPlaylist: (state) => {
      const newPlaylist = {
        id: Date.now(),
        name: 'New Playlist',
        description: '',
        visibility: 'private',
        count: 0,
      };
      state.playlists.push(newPlaylist);
      state.activePlaylistId = newPlaylist.id;
      state.activeTab = 'media';
    },

    deletePlaylist: (state, action) => {
      const id = action.payload;
      state.playlists = state.playlists.filter(p => p.id !== id);
      state.mediaItems = state.mediaItems.filter(m => m.playlistId !== id);
      state.notes = state.notes.filter(n => n.playlistId !== id);
      if (state.activePlaylistId === id) {
        state.activePlaylistId = state.playlists[0]?.id || null;
      }
    },

    setActivePlaylistId: (state, action) => {
      state.activePlaylistId = action.payload;
    },

    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    // --- Playlist editing ---
    startEditingPlaylist: (state, action) => {
      const { id, name } = action.payload;
      state.editingPlaylistId = id;
      state.editPlaylistName = name;
    },

    setEditPlaylistName: (state, action) => {
      state.editPlaylistName = action.payload;
    },

    savePlaylistName: (state) => {
      state.playlists = state.playlists.map(p =>
        p.id === state.editingPlaylistId
          ? { ...p, name: state.editPlaylistName || p.name }
          : p
      );
      state.editingPlaylistId = null;
    },

    // --- Full edit modal ---
    openFullEdit: (state, action) => {
      const playlist = action.payload;
      state.fullEditPlaylist = playlist.id;
      state.draftName = playlist.name;
      state.draftDesc = playlist.description || '';
      state.draftVisibility = playlist.visibility;
    },

    setDraftName: (state, action) => {
      state.draftName = action.payload;
    },

    setDraftDesc: (state, action) => {
      state.draftDesc = action.payload;
    },

    setDraftVisibility: (state, action) => {
      state.draftVisibility = action.payload;
    },

    saveFullEdit: (state) => {
      state.playlists = state.playlists.map(p =>
        p.id === state.fullEditPlaylist
          ? { ...p, name: state.draftName || p.name, description: state.draftDesc, visibility: state.draftVisibility }
          : p
      );
      state.fullEditPlaylist = null;
    },

    closeFullEdit: (state) => {
      state.fullEditPlaylist = null;
    },

    toggleVisibilityQuick: (state, action) => {
      const id = action.payload;
      state.playlists = state.playlists.map(p =>
        p.id === id
          ? { ...p, visibility: p.visibility === 'public' ? 'private' : 'public' }
          : p
      );
    },

    // --- Media items ---
    addMediaItem: (state, action) => {
      state.mediaItems.push({ ...action.payload, id: Date.now() });
      state.playlists = state.playlists.map(p =>
        p.id === state.activePlaylistId ? { ...p, count: p.count + 1 } : p
      );
    },

    deleteMediaItem: (state, action) => {
      const id = action.payload;
      state.mediaItems = state.mediaItems.filter(m => m.id !== id);
      state.playlists = state.playlists.map(p =>
        p.id === state.activePlaylistId ? { ...p, count: Math.max(0, p.count - 1) } : p
      );
    },

    // --- Notes ---
    addNote: (state) => {
      const newNote = {
        id: Date.now(),
        playlistId: state.activePlaylistId,
        title: 'New note',
        content: '',
        updatedAt: 'now',
      };
      state.notes.unshift(newNote);
      state.editingNoteId = newNote.id;
      state.noteDraft = { title: newNote.title, content: '' };
    },

    startEditNote: (state, action) => {
      const note = action.payload;
      state.editingNoteId = note.id;
      state.noteDraft = { title: note.title, content: note.content };
    },

    setNoteDraft: (state, action) => {
      state.noteDraft = action.payload;
    },

    saveNote: (state) => {
      state.notes = state.notes.map(n =>
        n.id === state.editingNoteId
          ? { ...n, title: state.noteDraft.title || 'Untitled note', content: state.noteDraft.content, updatedAt: 'now' }
          : n
      );
      state.editingNoteId = null;
    },

    deleteNote: (state, action) => {
      const id = action.payload;
      state.notes = state.notes.filter(n => n.id !== id);
      if (state.editingNoteId === id) state.editingNoteId = null;
    },

    // --- Search ---
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },

    // Reset playlist state
    resetPlaylist: () => initialState,
  },
});

export const {
  createPlaylist,
  deletePlaylist,
  setActivePlaylistId,
  setActiveTab,
  startEditingPlaylist,
  setEditPlaylistName,
  savePlaylistName,
  openFullEdit,
  setDraftName,
  setDraftDesc,
  setDraftVisibility,
  saveFullEdit,
  closeFullEdit,
  toggleVisibilityQuick,
  addMediaItem,
  deleteMediaItem,
  addNote,
  startEditNote,
  setNoteDraft,
  saveNote,
  deleteNote,
  setSearchTerm,
  resetPlaylist,
} = playlistSlice.actions;

// Selectors
export const selectPlaylist = (state) => state.playlist;
export const selectActivePlaylistId = (state) => state.playlist.activePlaylistId;
export const selectActivePlaylist = (state) =>
  state.playlist.playlists.find(p => p.id === state.playlist.activePlaylistId);
export const selectActiveMedia = (state) =>
  state.playlist.mediaItems.filter(m => m.playlistId === state.playlist.activePlaylistId);
export const selectActiveNotes = (state) =>
  state.playlist.notes.filter(n => n.playlistId === state.playlist.activePlaylistId);
export const selectSearchTerm = (state) => state.playlist.searchTerm;

export default playlistSlice.reducer;
