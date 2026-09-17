import { createSlice } from "@reduxjs/toolkit";

/**
 * Content Slice — manages video & image content state
 * Covers: Home, Videos, VideoDetail, Videocard, ImageCard, Images, Trending
 */

const initialState = {
  // Mock data from constants/data.jsx is imported at component level
  // Here we manage active states/filters
  activeCategory: "All",
  searchQuery: "",
  sortBy: "newest", // newest | oldest | top-rated | most-viewed
  layout: "grid", // grid | dense
  isRefreshing: false,

  // User interactions with content
  bookmarkedVideos: {},   // { [videoId]: true/false }
  likedVideos: {},        // { [videoId]: true/false }
  likedImages: {},        // { [imageId]: true/false }
  isPlaying: false,       // Video playback state

  // Gallery/Slider states
  sliderActiveIndex: 0,
  isFilterOpen: false,
  selectedCategory: "All",
};

const contentSlice = createSlice({
  name: "content",
  initialState,
  reducers: {
    // Category filtering
    setActiveCategory: (state, action) => {
      state.activeCategory = action.payload;
    },
    // Search
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    // Sort options
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    // Layout toggle
    setLayout: (state, action) => {
      state.layout = action.payload;
    },
    // Refresh feed
    setIsRefreshing: (state, action) => {
      state.isRefreshing = action.payload;
    },

    // Toggle bookmark for a video
    toggleBookmark: (state, action) => {
      const videoId = action.payload;
      state.bookmarkedVideos[videoId] = !state.bookmarkedVideos[videoId];
    },
    // Toggle like for a video
    toggleLikeVideo: (state, action) => {
      const videoId = action.payload;
      state.likedVideos[videoId] = !state.likedVideos[videoId];
    },
    // Toggle like for an image
    toggleLikeImage: (state, action) => {
      const imageId = action.payload;
      state.likedImages[imageId] = !state.likedImages[imageId];
    },
    // Toggle video playback
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },

    // Slider active index
    setSliderActiveIndex: (state, action) => {
      state.sliderActiveIndex = action.payload;
    },
    // Filter dropdown
    setIsFilterOpen: (state, action) => {
      state.isFilterOpen = action.payload;
    },
    // Image gallery category
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },

    // Reset all content states
    resetContent: () => initialState,
  },
});

export const {
  setActiveCategory,
  setSearchQuery,
  setSortBy,
  setLayout,
  setIsRefreshing,
  toggleBookmark,
  toggleLikeVideo,
  toggleLikeImage,
  setIsPlaying,
  setSliderActiveIndex,
  setIsFilterOpen,
  setSelectedCategory,
  resetContent,
} = contentSlice.actions;

// Selectors
export const selectContent = (state) => state.content;
export const selectActiveCategory = (state) => state.content.activeCategory;
export const selectSearchQuery = (state) => state.content.searchQuery;
export const selectBookmarkedVideos = (state) => state.content.bookmarkedVideos;
export const selectLikedImages = (state) => state.content.likedImages;
export const selectSortBy = (state) => state.content.sortBy;
export const selectLayout = (state) => state.content.layout;

export default contentSlice.reducer;
