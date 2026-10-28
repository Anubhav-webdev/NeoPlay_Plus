import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/**
 * Auth Slice — manages user authentication state
 * Covers: LoginAndSignup, Navbar, Sidebar, Settings
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Async thunk for signup
export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userData),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) return rejectWithValue(data.message || "Signup failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Server error");
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
  loading: false,
  error: null,
  // Login form state
  loginData: { identifier: "", password: "" },
  signupData: { username: "", email: "", phone: "", password: "", confirmPassword: "" },
  showPassword: false,
  showSignupPassword: false,
  showSignupConfirm: false,
  isSignupMode: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set login form field
    setLoginField: (state, action) => {
      const { name, value } = action.payload;
      state.loginData[name] = value;
    },
    // Set signup form field
    setSignupField: (state, action) => {
      const { name, value } = action.payload;
      state.signupData[name] = value;
    },
    // Toggle password visibility
    toggleShowPassword: (state) => {
      state.showPassword = !state.showPassword;
    },
    toggleShowSignupPassword: (state) => {
      state.showSignupPassword = !state.showSignupPassword;
    },
    toggleShowSignupConfirm: (state) => {
      state.showSignupConfirm = !state.showSignupConfirm;
    },
    // Switch between login/signup mode
    setIsSignupMode: (state, action) => {
      state.isSignupMode = action.payload;
    },
    // Login success (called from LoginAndSignup)
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.initialized = true;
      state.error = null;
    },
    // Logout
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.initialized = true;
      state.loginData = { identifier: "", password: "" };
      localStorage.removeItem("loggedInUser");
      sessionStorage.removeItem("accessToken");
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    // Set user from localStorage on app init
    restoreUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.accessToken) {
          sessionStorage.setItem("accessToken", action.payload.accessToken);
        }
        state.user = {
          id: action.payload.user?._id || action.payload.user?.id,
          name: action.payload.user?.name,
          username: action.payload.user?.username,
          email: action.payload.user?.email,
          phone: action.payload.user?.phone,
          role: action.payload.user?.role || "user",
          avatar: action.payload.user?.avatar || null,
        };
        state.isAuthenticated = true;
        state.initialized = true;
        localStorage.setItem("loggedInUser", JSON.stringify(state.user));
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setLoginField,
  setSignupField,
  toggleShowPassword,
  toggleShowSignupPassword,
  toggleShowSignupConfirm,
  setIsSignupMode,
  loginSuccess,
  logout,
  clearError,
  restoreUser,
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
