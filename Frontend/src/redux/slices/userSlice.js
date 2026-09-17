import { createSlice } from "@reduxjs/toolkit";

/**
 * User Slice — manages user profile, settings, watch history, and creator dashboard state
 * Covers: Settings, CreatorDashboard, CreatorProfile, WatchHistory
 */

const initialState = {
  /* --- User Profile (Settings page) --- */
  profile: {
    name: "Aria Vance",
    username: "aria_codes",
    bio: "Digital architect and UI designer exploring interactive boundaries.",
    location: "Tokyo, Japan",
    tier: "Premium Pass",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
  },
  isEditing: false,
  isFollowing: true,

  /* --- Creator Dashboard --- */
  channelIdentity: {
    name: "Apex Cyber Studio",
    tagline: "High-Fidelity Engineering Pipelines and Next-Gen UI Layouts",
    about: "Building real-time web matrix graphics modules from scratch.",
    username: "@apex_cyber_studio",
    isVerified: true,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ApexStudio",
    wallpaper: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80",
  },
  isEditingProfileText: false,
  dashboardSearchQuery: "",
  activeModal: null,
  catalogTab: "all",
  commentTab: "all",
  toast: null,
  contentType: "video",
  formTitle: "",
  formCategory: "Development",
  formVisibility: "public",
  mediaInputMode: "local",
  mediaUrlString: "",
  thumbnailUrlString: "",
  uploadedFilesArray: [],
  contentCatalog: [
    { id: 1, type: "video", title: "Building a Zero-Dependency Web Matrix Engine", views: 142000, date: "3 days ago", likes: 8900, commentsCount: 24, category: "Development", isSubscriberOnly: false, mediaUrl: "", thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&auto=format&fit=crop&q=60" },
  ],
  editingItemId: null,
  editFormState: {},
  editMediaMode: "",
  comments: [
    { id: 501, type: "video", author: "Sarah Dev", handle: "@sarah_codes", text: "Exceptional architecture walkthrough.", assetTitle: "Zero-Dependency Web Matrix Engine", replyText: "" },
  ],
  followers: [
    { id: 1, name: "Sarah Dev", handle: "@sarah_codes", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
  ],
  following: [
    { id: 201, name: "Vite Core Studio", handle: "@vite_fast", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vite" },
  ],

  /* --- Creator Profile --- */
  profileTab: "all",
  isSubscribed: false,
  streamCatalog: [
    { id: 1, type: "video", title: "Building a Zero-Dependency Web Matrix Engine from Scratch", views: "142K", date: "3 days ago", duration: "18:42", likes: "8.9K", category: "Development", isSubscriberOnly: false, thumb: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=600&q=80" },
  ],

  /* --- Watch History --- */
  history: [
    { id: "v1", title: "Building a Production Ready Custom Mesh Infrastructure in React", channel: "ByteCraft", views: "45K views", duration: "18:42", progress: 85, watchedAt: "2026-06-30T14:22:00Z", category: "Development", thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80" },
    { id: "v2", title: "Why Spacecraft Systems Still Depend on 40-Year-Old Processors", channel: "Orbital Mechanics", views: "1.2M views", duration: "24:10", progress: 100, watchedAt: "2026-06-30T09:15:00Z", category: "Aerospace", thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80" },
    { id: "v3", title: "Designing the Perfect Dark Mode Palette", channel: "RefineUI", views: "89K views", duration: "12:05", progress: 30, watchedAt: "2026-06-29T21:40:00Z", category: "Design", thumbnail: "https://images.unsplash.com/photo-1541462608141-ad4979e408c9?w=500&q=80" },
  ],
  historySearchQuery: "",
  historyDateFilter: "all",
  isHistoryPaused: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    /* --- Profile (Settings) --- */
    setProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    setIsEditing: (state, action) => {
      state.isEditing = action.payload;
    },
    setIsFollowing: (state, action) => {
      state.isFollowing = action.payload;
    },

    /* --- Creator Dashboard --- */
    setChannelIdentity: (state, action) => {
      state.channelIdentity = { ...state.channelIdentity, ...action.payload };
    },
    setIsEditingProfileText: (state, action) => {
      state.isEditingProfileText = action.payload;
    },
    setDashboardSearchQuery: (state, action) => {
      state.dashboardSearchQuery = action.payload;
    },
    setActiveModal: (state, action) => {
      state.activeModal = action.payload;
    },
    setCatalogTab: (state, action) => {
      state.catalogTab = action.payload;
    },
    setCommentTab: (state, action) => {
      state.commentTab = action.payload;
    },
    setToast: (state, action) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    },
    setContentType: (state, action) => {
      state.contentType = action.payload;
    },
    setFormTitle: (state, action) => {
      state.formTitle = action.payload;
    },
    setFormCategory: (state, action) => {
      state.formCategory = action.payload;
    },
    setFormVisibility: (state, action) => {
      state.formVisibility = action.payload;
    },
    setMediaInputMode: (state, action) => {
      state.mediaInputMode = action.payload;
    },
    setMediaUrlString: (state, action) => {
      state.mediaUrlString = action.payload;
    },
    setThumbnailUrlString: (state, action) => {
      state.thumbnailUrlString = action.payload;
    },
    addUploadedFile: (state, action) => {
      state.uploadedFilesArray.push(action.payload);
    },
    clearUploadedFiles: (state) => {
      state.uploadedFilesArray = [];
    },
    addContent: (state, action) => {
      state.contentCatalog.unshift(action.payload);
    },
    deleteContent: (state, action) => {
      state.contentCatalog = state.contentCatalog.filter(item => item.id !== action.payload);
    },
    updateContent: (state, action) => {
      state.contentCatalog = state.contentCatalog.map(item =>
        item.id === action.payload.id ? action.payload : item
      );
    },
    setEditingItemId: (state, action) => {
      state.editingItemId = action.payload;
    },
    setEditFormState: (state, action) => {
      state.editFormState = action.payload;
    },
    setEditMediaMode: (state, action) => {
      state.editMediaMode = action.payload;
    },
    addComment: (state, action) => {
      state.comments.unshift(action.payload);
    },
    updateCommentReply: (state, action) => {
      const { id, replyText } = action.payload;
      state.comments = state.comments.map(c =>
        c.id === id ? { ...c, replyText } : c
      );
    },
    addFollower: (state, action) => {
      state.followers.push(action.payload);
    },
    removeFollowing: (state, action) => {
      state.following = state.following.filter(f => f.id !== action.payload);
    },

    /* --- Creator Profile --- */
    setProfileTab: (state, action) => {
      state.profileTab = action.payload;
    },
    setIsSubscribed: (state, action) => {
      state.isSubscribed = action.payload;
    },

    /* --- Watch History --- */
    setHistorySearchQuery: (state, action) => {
      state.historySearchQuery = action.payload;
    },
    setHistoryDateFilter: (state, action) => {
      state.historyDateFilter = action.payload;
    },
    setIsHistoryPaused: (state, action) => {
      state.isHistoryPaused = action.payload;
    },
    deleteHistoryItem: (state, action) => {
      state.history = state.history.filter(item => item.id !== action.payload);
    },
    clearAllHistory: (state) => {
      state.history = [];
    },
    addToHistory: (state, action) => {
      state.history.unshift(action.payload);
    },

    resetUser: () => initialState,
  },
});

export const {
  setProfile,
  setIsEditing,
  setIsFollowing,
  setChannelIdentity,
  setIsEditingProfileText,
  setDashboardSearchQuery,
  setActiveModal,
  setCatalogTab,
  setCommentTab,
  setToast,
  clearToast,
  setContentType,
  setFormTitle,
  setFormCategory,
  setFormVisibility,
  setMediaInputMode,
  setMediaUrlString,
  setThumbnailUrlString,
  addUploadedFile,
  clearUploadedFiles,
  addContent,
  deleteContent,
  updateContent,
  setEditingItemId,
  setEditFormState,
  setEditMediaMode,
  addComment,
  updateCommentReply,
  addFollower,
  removeFollowing,
  setProfileTab,
  setIsSubscribed,
  setHistorySearchQuery,
  setHistoryDateFilter,
  setIsHistoryPaused,
  deleteHistoryItem,
  clearAllHistory,
  addToHistory,
  resetUser,
} = userSlice.actions;

/* Selectors */
export const selectUser = (state) => state.user;
export const selectProfile = (state) => state.user.profile;
export const selectChannelIdentity = (state) => state.user.channelIdentity;
export const selectContentCatalog = (state) => state.user.contentCatalog;
export const selectHistory = (state) => state.user.history;
export const selectDashboardSearchQuery = (state) => state.user.dashboardSearchQuery;
export const selectHistorySearchQuery = (state) => state.user.historySearchQuery;
export const selectHistoryDateFilter = (state) => state.user.historyDateFilter;
export const selectIsHistoryPaused = (state) => state.user.isHistoryPaused;

export default userSlice.reducer;
