import { lazy } from "react";

export const CreatorDashboard = lazy(() => import("../components/Profile/CreatorDashboard/CreatorDashboard.jsx"));
export const Trending = lazy(() => import("../components/pages/Trending.jsx"));
export const Subscriptions = lazy(() => import("../components/pages/Subscriptions.jsx"));
export const Videos = lazy(() => import("../components/Video/Videos.jsx"));
export const Images = lazy(() => import("../components/Image/Images.jsx"));
export const TweetsFeed = lazy(() => import("../components/Tweet/TweetsFeed.jsx"));
export const Playlists = lazy(() => import("../components/Playlist/Playlists.jsx"));
export const WatchHistory = lazy(() => import("../components/History/WatchHistory.jsx"));
export const Settings = lazy(() => import("../components/pages/Settings.jsx"));
export const HelpSupport = lazy(() => import("../components/Help&Support/HelpSupport.jsx"));
export const Report = lazy(() => import("../components/pages/Report.jsx"));
export const MediaDuplicateReviews = lazy(() => import("../components/pages/MediaDuplicateReviews.jsx"));
export const CreatorProfile = lazy(() => import("../components/Profile/CreatorProfile/CreatorProfile.jsx"));
export const LoginAndSignup = lazy(() => import("../components/Auth/LoginAndSignup.jsx"));
export const VideoDetail = lazy(() => import("../components/Video/VideoDetail.jsx"));
