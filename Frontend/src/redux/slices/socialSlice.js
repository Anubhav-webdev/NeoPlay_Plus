import { createSlice } from "@reduxjs/toolkit";

/**
 * Social Slice — manages social/interaction state (tweets, subscriptions, follows)
 * Covers: TweetsFeed, TweetCard, Subscriptions
 */

const initialState = {
  // Tweets feed
  activeTab: "forYou", // forYou | following | trending
  sortBy: "latest", // latest | popular
  showMediaOnly: false,
  isSubscribed: false, // Premium subscription for posting

  // Subscriptions
  followingCreators: {},  // { [creatorId]: true/false }
  creators: [],           // List of subscribed creators

  // Tweet interactions
  likedTweets: {},        // { [tweetId]: true/false }
  retweetedTweets: {},    // { [tweetId]: true/false }
};

const socialSlice = createSlice({
  name: "social",
  initialState,
  reducers: {
    // Tweets feed tab
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    // Sort tweets
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    // Filter media only
    setShowMediaOnly: (state, action) => {
      state.showMediaOnly = action.payload;
    },
    // Toggle premium subscription
    setIsSubscribed: (state, action) => {
      state.isSubscribed = action.payload;
    },

    // Follow/unfollow a creator
    toggleFollowCreator: (state, action) => {
      const creatorId = action.payload;
      state.followingCreators[creatorId] = !state.followingCreators[creatorId];
    },
    // Set all creators (from data)
    setCreators: (state, action) => {
      state.creators = action.payload;
    },

    // Like a tweet
    toggleLikeTweet: (state, action) => {
      const tweetId = action.payload;
      state.likedTweets[tweetId] = !state.likedTweets[tweetId];
    },
    // Retweet
    toggleRetweet: (state, action) => {
      const tweetId = action.payload;
      state.retweetedTweets[tweetId] = !state.retweetedTweets[tweetId];
    },

    // Reset social state
    resetSocial: () => initialState,
  },
});

export const {
  setActiveTab,
  setSortBy,
  setShowMediaOnly,
  setIsSubscribed,
  toggleFollowCreator,
  setCreators,
  toggleLikeTweet,
  toggleRetweet,
  resetSocial,
} = socialSlice.actions;

// Selectors
export const selectSocial = (state) => state.social;
export const selectFollowingCreators = (state) => state.social.followingCreators;
export const selectIsSubscribed = (state) => state.social.isSubscribed;
export const selectActiveTab = (state) => state.social.activeTab;

export default socialSlice.reducer;
