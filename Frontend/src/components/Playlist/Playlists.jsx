import React, { useState } from 'react';
import { Folder,Trash2 } from 'lucide-react';


import Sidebar from '../Playlist/PlaylistSidebar';
import PlaylistHeader from '../Playlist/PlaylistHeader';
import NotesGrid from '../Playlist/PlaylistNotesGrid';
import EditPlaylistModal from '../Playlist/EditPlaylistModal';

// Card Component Imports
import ImageCard from '../Image/ImageCard'; 
import VideoCard from '../Video/Videocard';

export default function PlaylistDashboard() {
  const [playlists, setPlaylists] = useState([
    { id: 1, name: 'Project References', description: 'UI patterns and demos worth revisiting.', visibility: 'private', count: 4 },
    { id: 2, name: 'UI Inspirations', description: 'Public moodboard, shareable with the team.', visibility: 'public', count: 3 },
  ]);
  const [activePlaylistId, setActivePlaylistId] = useState(1);
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'notes'

  // Updated state matching the keys from export const VIDEOS and IMAGES datasets
  const [mediaItems, setMediaItems] = useState([
    // Videos mapped from VIDEOS mock data structure
    { id: 1, playlistId: 1, type: 'video', title: "Big Buck Bunny", views: "10.3k", time: "44 minutes ago", channel: "Bunny", duration: "0:38", thumb: "https://images.pexels.com/photos/1739849/pexels-photo-1739849.jpeg?auto=compress&cs=tinysrgb&w=600",avatar: "https://images.pexels.com/photos/2519812/pexels-photo-2519812.jpeg?auto=compress&cs=tinysrgb&w=100",  Catagory: "Cartoon" },
    { id: 2, playlistId: 1, type: 'video', title: "Getting Started with Express.js", views: "11k", time: "5 hours ago", channel: "Express Learner", duration: "3:44", thumb: "https://images.pexels.com/photos/1739849/pexels-photo-1739849.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/2519812/pexels-photo-2519812.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory: "Education" },
    
    // Images mapped from IMAGES mock data structure
    { id: 3, playlistId: 1, type: 'image', title: "Beautiful Landscape", views: "5.2k", time: "2 hours ago", channel: "Nature Lover", thumb: "https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory: "Nature" },
    { id: 4, playlistId: 1, type: 'image', title: "City Skyline at Night", views: "8.7k", time: "4 hours ago", channel: "Urban Explorer", thumb: "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory: "Urban" },
    { id: 5, playlistId: 1, type: 'video', title: "Big Buck Bunny", views: "10.3k", time: "44 minutes ago", channel: "Bunny", duration: "0:38", thumb: "https://images.pexels.com/photos/1739849/pexels-photo-1739849.jpeg?auto=compress&cs=tinysrgb&w=600",avatar: "https://images.pexels.com/photos/2519812/pexels-photo-2519812.jpeg?auto=compress&cs=tinysrgb&w=100",  Catagory: "Cartoon" },
    { id: 6, playlistId: 1, type: 'video', title: "Getting Started with Express.js", views: "11k", time: "5 hours ago", channel: "Express Learner", duration: "3:44", thumb: "https://images.pexels.com/photos/1739849/pexels-photo-1739849.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/2519812/pexels-photo-2519812.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory: "Education" },
    
    // Images mapped from IMAGES mock data structure
    { id: 7, playlistId: 1, type: 'image', title: "Beautiful Landscape", views: "5.2k", time: "2 hours ago", channel: "Nature Lover", thumb: "https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory: "Nature" },
    { id: 8, playlistId: 1, type: 'image', title: "City Skyline at Night", views: "8.7k", time: "4 hours ago", channel: "Urban Explorer", thumb: "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory: "Urban" },
    
    
    // Playlist 2 setup items
    { id: 5, playlistId: 2, type: 'video', title: "Building a RESTful API with Node.js and Express", views: "14.5k", time: "7 hours ago", channel: "API Builder", duration: "24:33", thumb: "https://images.pexels.com/photos/1739849/pexels-photo-1739849.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/1739942/pexels-photo-1739942.jpeg?auto=compress&cs=tinysrgb&w=100", Catagory: "Technology" },
    { id: 6, playlistId: 2, type: 'image', title: "Delicious Food Platter", views: "12.1k", time: "6 hours ago", channel: "Foodie", thumb: "https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100" },
    { id: 7, playlistId: 2, type: 'image', title: "Cute Puppy Playing", views: "9.4k", time: "8 hours ago", channel: "Animal Lover", thumb: "https://images.pexels.com/photos/4587990/pexels-photo-4587990.jpeg?auto=compress&cs=tinysrgb&w=600", avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100" }
  ]);

  const [notes, setNotes] = useState([
    { id: 1, playlistId: 1, title: 'Kickoff prep', content: 'Topics to cover: goals, timeline, who owns what.', updatedAt: 'Jul 2' },
  ]);

  // ---- playlist editing states ----
  const [editingPlaylistId, setEditingPlaylistId] = useState(null); 
  const [editPlaylistName, setEditPlaylistName] = useState('');
  const [fullEditPlaylist, setFullEditPlaylist] = useState(null); 
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftVisibility, setDraftVisibility] = useState('private');

  // ---- notes editing states ----
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState({ title: '', content: '' });

  const [searchTerm, setSearchTerm] = useState('');

  // ---------- playlist helpers ----------
  const createPlaylist = () => {
    const newPlaylist = { id: Date.now(), name: 'New Playlist', description: '', visibility: 'private', count: 0 };
    setPlaylists([...playlists, newPlaylist]);
    setActivePlaylistId(newPlaylist.id);
    setActiveTab('media');
    startEditingPlaylist(newPlaylist.id, newPlaylist.name);
  };

  const deletePlaylist = (id, e) => {
    e.stopPropagation();
    const remaining = playlists.filter(p => p.id !== id);
    setPlaylists(remaining);
    setMediaItems(mediaItems.filter(m => m.playlistId !== id));
    setNotes(notes.filter(n => n.playlistId !== id));
    if (activePlaylistId === id) setActivePlaylistId(remaining[0]?.id || null);
  };

  const startEditingPlaylist = (id, currentName) => {
    setEditingPlaylistId(id);
    setEditPlaylistName(currentName);
  };

  const savePlaylistName = (id) => {
    setPlaylists(playlists.map(p => p.id === id ? { ...p, name: editPlaylistName || p.name } : p));
    setEditingPlaylistId(null);
  };

  const openFullEdit = (playlist) => {
    setFullEditPlaylist(playlist.id);
    setDraftName(playlist.name);
    setDraftDesc(playlist.description || '');
    setDraftVisibility(playlist.visibility);
  };

  const saveFullEdit = () => {
    setPlaylists(playlists.map(p => p.id === fullEditPlaylist
      ? { ...p, name: draftName || p.name, description: draftDesc, visibility: draftVisibility }
      : p));
    setFullEditPlaylist(null);
  };

  const toggleVisibilityQuick = (id, e) => {
    e.stopPropagation();
    setPlaylists(playlists.map(p => p.id === id
      ? { ...p, visibility: p.visibility === 'public' ? 'private' : 'public' }
      : p));
  };

  const deleteMedia = (id) => {
    setMediaItems(mediaItems.filter(m => m.id !== id));
    setPlaylists(playlists.map(p => p.id === activePlaylistId ? { ...p, count: Math.max(0, p.count - 1) } : p));
  };

  // ---------- notes helpers ----------
  const addNote = () => {
    const newNote = { id: Date.now(), playlistId: activePlaylistId, title: 'New note', content: '', updatedAt: 'now' };
    setNotes([newNote, ...notes]);
    setEditingNoteId(newNote.id);
    setNoteDraft({ title: newNote.title, content: '' });
  };

  const startEditNote = (note) => {
    setEditingNoteId(note.id);
    setNoteDraft({ title: note.title, content: note.content });
  };

  const saveNote = (id) => {
    setNotes(notes.map(n => n.id === id
      ? { ...n, title: noteDraft.title || 'Untitled note', content: noteDraft.content, updatedAt: 'now' }
      : n));
    setEditingNoteId(null);
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(n => n.id !== id));
    if (editingNoteId === id) setEditingNoteId(null);
  };

  const activeMedia = mediaItems
    .filter(m => m.playlistId === activePlaylistId)
    .filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeNotes = notes.filter(n => n.playlistId === activePlaylistId);
  const activePlaylist = playlists.find(p => p.id === activePlaylistId);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-transparent text-white font-sans selection:bg-purple-500/30 md:fixed z-10 relative pb-15 ">
      
      {/* Sidebar Navigation */}
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
      />

      {/* Main Area */}
      <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden ">
        
        {/* Top Header */}
        <PlaylistHeader
          activePlaylist={activePlaylist}
          activePlaylistId={activePlaylistId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeMediaCount={activeMedia.length}
          activeNotesCount={activeNotes.length}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          addNote={addNote}
          openFullEdit={openFullEdit}
          deletePlaylist={deletePlaylist}
        />

        {/* Dynamic Body Content Grid */}
{/* Dynamic Body Content Grid */}
<div className="flex-1 overflow-y-auto p-2 md:p-2  mb-8 w-full bg-[#0b1220]">
  {!activePlaylistId ? (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 min-h-[50vh]">
      <Folder size={48} className="mb-4 opacity-20 text-purple-400" />
      <p>Create a playlist to get started.</p>
    </div>
  ) : activeTab === 'media' ? (
    /* Media uses the shared VideoCard and ImageCard presentation. */
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {activeMedia.length === 0 ? (
        <div className="col-span-full text-center text-gray-500 py-10">
          No items found matching "{searchTerm}"
        </div>
      ) : (
        activeMedia.map((item) => (
          <div key={item.id} className="group relative min-w-0">
            {item.type === 'image' ? (
              <ImageCard image={item} className="w-full" />
            ) : (
              <VideoCard video={item} className="w-full animate-fade-in" />
            )}

            {/* Delete Button overlaying the cards cleanly */}
            <button 
              onClick={() => deleteMedia(item.id)}
              aria-label={`Remove ${item.title} from playlist`}
              title="Remove from playlist"
              className="absolute left-3 top-3 z-30 rounded-md bg-rose-600/90 p-2 text-white opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100 hover:bg-rose-500"
            >
              <Trash2 size={14} /> 
            </button>
          </div>
        ))
      )}
    </div>
  ) : (
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
  )}
</div>
      </main>

      {/* Full Playlist Edit Modal Context */}
      <EditPlaylistModal
        fullEditPlaylist={fullEditPlaylist}
        setFullEditPlaylist={setFullEditPlaylist}
        draftName={draftName}
        setDraftName={setDraftName}
        draftDesc={draftDesc}
        setDraftDesc={setDraftDesc}
        draftVisibility={draftVisibility}
        setDraftVisibility={setDraftVisibility}
        saveFullEdit={saveFullEdit}
      />
    </div>
  );
}