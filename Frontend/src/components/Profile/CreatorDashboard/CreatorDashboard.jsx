import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import "../../../App.css";

import IdentitySuite from '../../Profile/CreatorDashboard/CreatorIdentity';
import MetricArchitecture from '../../Profile/CreatorDashboard/CreatorAnalytics';
import UploadContentForm from '../../Profile/CreatorDashboard/UploadContentForm';
import ContentCatalogStream from '../../Profile/CreatorDashboard/ContentCatalogStream';
import DiagnosticMatrix from '../../Profile/CreatorDashboard/DiagnosticMatrix';
import RegistryModals from '../../Profile/CreatorDashboard/RegistryModals';

export default function CreatorDashboard() {
  // Global States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [catalogTab, setCatalogTab] = useState('all');
  const [commentTab, setCommentTab] = useState('all');
  const [toast, setToast] = useState(null);

  // Edit State Engine
  const [editingItemId, setEditingItemId] = useState(null);
  const [editFormState, setEditFormState] = useState({});
  const [editMediaMode, setEditMediaMode] = useState('');
  const editFileInputRef = useRef(null);
  const editThumbInputRef = useRef(null);

  // Identity States
  const [channelIdentity, setChannelIdentity] = useState({
    name: "Apex Cyber Studio",
    tagline: "High-Fidelity Engineering Pipelines & Next-Gen UI Layouts",
    about: "Building real-time web matrix graphics modules from scratch.",
    username: "@apex_cyber_studio",
    isVerified: true,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ApexStudio",
    wallpaper: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80"
  });
  const [isEditingProfileText, setIsEditingProfileText] = useState(false);
  const avatarInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);

  // Data Arrays
  const [followers] = useState([
    { id: 1, name: "Sarah Dev", handle: "@sarah_codes", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
    { id: 2, name: "Crypto Neo", handle: "@neo_matrix", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neo" },
    { id: 3, name: "Alex Code-Ops", handle: "@alex_ops", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" }
  ]);

  const [following, setFollowing] = useState([
    { id: 201, name: "Vite Core Studio", handle: "@vite_fast", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vite" },
    { id: 202, name: "Lucide Graphics", handle: "@lucide_icons", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucide" },
    { id: 203, name: "Tailwind Engineering", handle: "@tailwind_ui", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tailwind" }
  ]);

  // Form Pipeline Pipeline States
  const [contentType, setContentType] = useState('video');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Development');
  const [formVisibility, setFormVisibility] = useState('public');
  const [mediaInputMode, setMediaInputMode] = useState('local');
  const [mediaUrlString, setMediaUrlString] = useState('');
  const [thumbnailUrlString, setThumbnailUrlString] = useState('');
  const [uploadedFilesArray, setUploadedFilesArray] = useState([]);

  const [contentCatalog, setContentCatalog] = useState([
    { id: 1, type: "video", title: "Building a Zero-Dependency Web Matrix Engine from Scratch", views: 142000, date: "3 days ago", likes: 8900, commentsCount: 24, category: "Development", isSubscriberOnly: false, mediaUrl: "", thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&auto=format&fit=crop&q=60" },
    { id: 2, type: "image", title: "Next-Gen Spec Layout Sheets", views: 12400, date: "Yesterday", likes: 1950, commentsCount: 8, category: "Design", isSubscriberOnly: true, mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60", images: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60"] },
    { id: 3, type: "tweet", title: "Just optimized the backend matrix parsing layer. 60fps frame calculations locked down tightly! drop updates tonight.", views: 8500, date: "2 hours ago", likes: 640, commentsCount: 14, category: "Development", isSubscriberOnly: false, mediaUrl: "" }
  ]);

  const [comments, setComments] = useState([
    { id: 501, type: "video", author: "Sarah Dev", handle: "@sarah_codes", text: "Exceptional architecture walkthrough. Can you breakdown the canvas thread model next?", assetTitle: "Zero-Dependency Web Matrix Engine", replyText: "" },
    { id: 502, type: "tweet", author: "Crypto Neo", handle: "@neo_matrix", text: "Does this optimization path affect running builds over lower tier mobile chipsets?", assetTitle: "Backend matrix parsing layer update", replyText: "" }
  ]);

  // --- ACTIONS ENGINE HANDLERS ---
  const showToast = (message, tone = 'purple') => {
    setToast({ message, tone });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2600);
  };

  const handleUnfollowTarget = (id) => {
    if (window.confirm("Remove this connection?")) {
      setFollowing(following.filter(item => item.id !== id));
      showToast("Connection removed", "red");
    }
  };

  const executeProfileImageUpload = (e, targetProperty) => {
    const file = e.target.files[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setChannelIdentity(prev => ({ ...prev, [targetProperty]: localUrl }));
      showToast("Profile media updated", "purple");
    }
  };

  const handleMultiFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const mappedUrls = files.map(file => URL.createObjectURL(file));
      setUploadedFilesArray(prev => [...prev, ...mappedUrls]);
    }
  };

  const handlePublishAsset = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return showToast("Content context required!", "red");

    const payloadMedia = mediaInputMode === 'url' ? mediaUrlString : (uploadedFilesArray[0] || "");
    const newAsset = {
      id: Date.now(),
      type: contentType,
      title: formTitle,
      views: 0, likes: 0, commentsCount: 0, date: "Just now",
      category: formCategory,
      isSubscriberOnly: formVisibility === 'premium',
      mediaUrl: payloadMedia,
      thumbnail: thumbnailUrlString || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&auto=format&fit=crop&q=60",
      images: contentType === 'image' ? uploadedFilesArray : []
    };

    setContentCatalog([newAsset, ...contentCatalog]);
    setFormTitle('');
    setMediaUrlString('');
    setThumbnailUrlString('');
    setUploadedFilesArray([]);
    showToast("Asset published to the matrix", "green");
  };

  const handleDeleteAsset = (id) => {
    if (window.confirm("Permanently strip this asset from registry vectors?")) {
      setContentCatalog(contentCatalog.filter(item => item.id !== id));
      showToast("Asset deleted", "red");
    }
  };

  const startEditingAsset = (asset) => {
    setEditingItemId(asset.id);
    setEditFormState({ ...asset });
    setEditMediaMode('url');
  };

  const cancelEditingAsset = () => {
    setEditingItemId(null);
    setEditFormState({});
  };

  const saveEditedAsset = () => {
    setContentCatalog(contentCatalog.map(item => item.id === editingItemId ? editFormState : item));
    setEditingItemId(null);
    showToast("Asset updated", "green");
  };

  const handleEditMediaFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setEditFormState(prev => ({
        ...prev,
        mediaUrl: localUrl,
        ...(prev.type === 'image' ? { images: [...(prev.images || []), localUrl] } : {})
      }));
    }
  };

  const handleEditThumbFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setEditFormState(prev => ({ ...prev, thumbnail: localUrl }));
    }
  };

  const submitReplyToComment = (commentId, replyString) => {
    if (!replyString.trim()) return;
    showToast("Reply committed to thread", "blue");
    setComments(comments.map(c => c.id === commentId ? { ...c, replyText: replyString } : c));
  };

  // Filters Engine Mappings
  const filteredCatalog = contentCatalog.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = catalogTab === 'all' ? true : item.type === catalogTab;
    return matchesSearch && matchesTab;
  });

  const filteredComments = comments.filter(comment => {
    if (commentTab === 'all') return true;
    return comment.type === commentTab;
  });

  const typeAccent = {
    video: { text: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/30' },
    image: { text: 'text-green-400', bg: 'bg-green-950/30', border: 'border-green-500/30' },
    tweet: { text: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/30' },
  };

  const toastTone = {
    purple: 'bg-purple-950/90 border-purple-500/50 text-purple-200',
    blue: 'bg-blue-950/90 border-blue-500/50 text-blue-200',
    green: 'bg-green-950/90 border-green-500/50 text-green-200',
    red: 'bg-red-950/90 border-red-500/50 text-red-200',
  };

  return (
    <div className="cd-root bg-transparent text-slate-100 min-h-screen relative overflow-x-hidden font-sans selection:bg-purple-500/30 select-none pb-12 all-font">

      {/* AMBIENT GLOW CHASSIS */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-purple-950/15 via-blue-950/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-purple-600/5 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-cyan-600/5 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* SYSTEM TOAST PIPELINE */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[60] px-4 py-3 border rounded-xl shadow-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 backdrop-blur-md ${toastTone[toast.tone] || toastTone.purple}`}
          >
            <Check className="w-3.5 h-3.5 animate-pulse" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE FRAMEWORK CONTAINER LINKS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 relative z-10">
        
        <IdentitySuite 
          channelIdentity={channelIdentity}
          setChannelIdentity={setChannelIdentity}
          isEditingProfileText={isEditingProfileText}
          setIsEditingProfileText={setIsEditingProfileText}
          wallpaperInputRef={wallpaperInputRef}
          avatarInputRef={avatarInputRef}
          executeProfileImageUpload={executeProfileImageUpload}
        />

        <MetricArchitecture 
          followingCount={following.length}
          setActiveModal={setActiveModal}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <UploadContentForm 
              contentType={contentType} setContentType={setContentType}
              formTitle={formTitle} setFormTitle={setFormTitle}
              formCategory={formCategory} setFormCategory={setFormCategory}
              formVisibility={formVisibility} setFormVisibility={setFormVisibility}
              mediaInputMode={mediaInputMode} setMediaInputMode={setMediaInputMode}
              mediaUrlString={mediaUrlString} setMediaUrlString={setMediaUrlString}
              thumbnailUrlString={thumbnailUrlString} setThumbnailUrlString={setThumbnailUrlString}
              uploadedFilesArray={uploadedFilesArray} setUploadedFilesArray={setUploadedFilesArray}
              handleMultiFileChange={handleMultiFileChange} handlePublishAsset={handlePublishAsset}
            />
          </div>

          <div className="lg:col-span-2">
            <ContentCatalogStream 
              catalogTab={catalogTab} setCatalogTab={setCatalogTab}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              filteredCatalog={filteredCatalog} editingItemId={editingItemId}
              startEditingAsset={startEditingAsset} handleDeleteAsset={handleDeleteAsset}
              editFormState={editFormState} setEditFormState={setEditFormState}
              editMediaMode={editMediaMode} setEditMediaMode={setEditMediaMode}
              editFileInputRef={editFileInputRef} editThumbInputRef={editThumbInputRef}
              handleEditMediaFileChange={handleEditMediaFileChange} handleEditThumbFileChange={handleEditThumbFileChange}
              saveEditedAsset={saveEditedAsset} cancelEditingAsset={cancelEditingAsset}
              typeAccent={typeAccent}
            />
          </div>
        </div>

        <DiagnosticMatrix 
          commentTab={commentTab} setCommentTab={setCommentTab}
          filteredComments={filteredComments} submitReplyToComment={submitReplyToComment}
        />

      </div>

      <RegistryModals 
        activeModal={activeModal} setActiveModal={setActiveModal}
        followers={followers} following={following}
        handleUnfollowTarget={handleUnfollowTarget}
      />
    </div>
  );
}