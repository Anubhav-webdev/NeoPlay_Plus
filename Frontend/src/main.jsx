import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Critical imports - loaded immediately
import Layout from "./components/layouts/MainLayout.jsx";
import './index.css'
import App from './App.jsx'
import {
  CreatorDashboard,
  Trending,
  Subscriptions,
  Videos,
  Images,
  TweetsFeed,
  Playlists,
  WatchHistory,
  Settings,
  HelpSupport,
  AdminDashboard,
  CreatorProfile,
  LoginAndSignup,
  VideoDetail,
} from "./routes/routeComponents.js";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Suspense fallback={<main role="status" className="min-h-screen p-8 text-center text-slate-300">Loading page...</main>}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<App />} />
              <Route path="trending" element={<Trending />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="videos" element={<Videos />} />
              <Route path="images" element={<Images />} />
              <Route path="tweets-feed" element={<TweetsFeed />} />
              <Route path="playlists" element={<Playlists />} />
              <Route path="watch-history" element={<WatchHistory />} />
              <Route path="creator-dashboard" element={<CreatorDashboard />} />
              <Route path="admin/media-reviews" element={<Navigate to="/admin" replace />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="settings" element={<Settings />} />
              <Route path="help-support" element={<HelpSupport />} />
              <Route path="video/:id" element={<VideoDetail />} />
              <Route path="creator/:creatorId" element={<CreatorProfile />} />
              <Route path="signup" element={<LoginAndSignup />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
