import { createSlice } from "@reduxjs/toolkit";

/**
 * UI Slice — manages global UI/appearance state
 * Covers: Home, MainLayout, Sidebar, Navbar, MobileBottomNav, Settings
 */

const initialState = {
  // Sidebar state
  sidebarExpanded: false,
  mobileSidebarOpen: false,

  // Search
  searchOpen: false,
  globalSearchQuery: "",

  // Theme
  isDarkMode: true,
  quality: "480p",
  aiLevel: 75,

  // Scroll state
  isScrolled: false,

  // Settings notifications
  settings: {
    comments: true,
    replies: true,
    likes: false,
    uploads: true,
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Sidebar
    setSidebarExpanded: (state, action) => {
      state.sidebarExpanded = action.payload;
    },
    setMobileSidebarOpen: (state, action) => {
      state.mobileSidebarOpen = action.payload;
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },

    // Search
    setSearchOpen: (state, action) => {
      state.searchOpen = action.payload;
    },
    setGlobalSearchQuery: (state, action) => {
      state.globalSearchQuery = action.payload;
    },

    // Theme
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setQuality: (state, action) => {
      state.quality = action.payload;
    },
    setAiLevel: (state, action) => {
      state.aiLevel = action.payload;
    },

    // Scroll
    setIsScrolled: (state, action) => {
      state.isScrolled = action.payload;
    },

    // Notification settings
    setNotificationSetting: (state, action) => {
      const { key, value } = action.payload;
      if (key in state.settings) {
        state.settings[key] = value;
      }
    },
    toggleNotificationSetting: (state, action) => {
      const key = action.payload;
      if (key in state.settings) {
        state.settings[key] = !state.settings[key];
      }
    },

    // Reset UI
    resetUI: () => initialState,
  },
});

export const {
  setSidebarExpanded,
  setMobileSidebarOpen,
  toggleMobileSidebar,
  setSearchOpen,
  setGlobalSearchQuery,
  toggleDarkMode,
  setQuality,
  setAiLevel,
  setIsScrolled,
  setNotificationSetting,
  toggleNotificationSetting,
  resetUI,
} = uiSlice.actions;

// Selectors
export const selectUI = (state) => state.ui;
export const selectSidebarExpanded = (state) => state.ui.sidebarExpanded;
export const selectMobileSidebarOpen = (state) => state.ui.mobileSidebarOpen;
export const selectSearchOpen = (state) => state.ui.searchOpen;
export const selectIsDarkMode = (state) => state.ui.isDarkMode;
export const selectQuality = (state) => state.ui.quality;
export const selectAiLevel = (state) => state.ui.aiLevel;
export const selectSettings = (state) => state.ui.settings;

export default uiSlice.reducer;
