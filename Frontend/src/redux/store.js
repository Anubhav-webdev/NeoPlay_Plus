import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import contentReducer from "./slices/contentSlice";
import socialReducer from "./slices/socialSlice";
import playlistReducer from "./slices/playlistSlice";
import uiReducer from "./slices/uiSlice";
import userReducer from "./slices/userSlice";

/**
 * Root Redux Store
 * Combines all feature slices into a single store
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    content: contentReducer,
    social: socialReducer,
    playlist: playlistReducer,
    ui: uiReducer,
    user: userReducer,
  },
  devTools: import.meta.env.DEV, // Enable Redux DevTools only in dev mode
});

export default store;
