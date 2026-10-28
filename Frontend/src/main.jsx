import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'

import { BrowserRouter, Routes, Route } from "react-router-dom";

// Critical imports - loaded immediately
import Layout from "./components/layouts/MainLayout.jsx";
import './index.css'
import App from './App.jsx'
import CreatorDashboard from './components/Profile/CreatorDashboard/CreatorDashboard.jsx'
import Trending from './components/pages/Trending.jsx'
import Subscriptions from './components/pages/Subscriptions.jsx'
import Videos from './components/Video/Videos.jsx'
import Images from './components/Image/Images.jsx'
import TweetsFeed from './components/Tweet/TweetsFeed.jsx'
import Playlists from './components/Playlist/Playlists.jsx'
import Wishlist from './components/Wishlist/Wishlist.jsx'
import WatchHistory from './components/History/WatchHistory.jsx'
import Settings from './components/pages/Settings.jsx'
import HelpSupport from './components/Help&Support/HelpSupport.jsx'
import Report from './components/pages/Report.jsx'
import MediaDuplicateReviews from './components/pages/MediaDuplicateReviews.jsx'
import CreatorProfile from './components/Profile/CreatorProfile/CreatorProfile.jsx'

import LoginAndSignup from './components/Auth/LoginAndSignup.jsx'
import VideoDetail from './components/Video/VideoDetail.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<App />} />
            <Route path="trending" element={<Trending />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="videos" element={<Videos />} />
            <Route path="images" element={<Images />} />
            <Route path="tweets-feed" element={<TweetsFeed />} />
            <Route path="playlists" element={<Playlists />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="watch-history" element={<WatchHistory />} />
            <Route path="creator-dashboard" element={<CreatorDashboard />} />
            <Route path="admin/media-reviews" element={<MediaDuplicateReviews />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help-support" element={<HelpSupport />} />
            <Route path="report" element={<Report />} />
            <Route path="video/:id" element={<VideoDetail />} />
            <Route path="creator/:creatorId" element={<CreatorProfile />} />
            <Route path="signup" element={<LoginAndSignup />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
