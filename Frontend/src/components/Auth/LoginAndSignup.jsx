import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Logo from "../../photo&Video/logo.png";
import { motion, AnimatePresence } from "framer-motion";

/* Redux Actions - authSlice manages form states and visibility toggles */
import {
  setLoginField,
  setSignupField,
  toggleShowPassword,
  toggleShowSignupPassword,
  toggleShowSignupConfirm,
  setIsSignupMode,
  loginSuccess,
} from "../../redux/slices/authSlice";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Reusable input field component with floating label logic
 */
const NeoPlayField = ({ name, type = "text", label, value, error, onChange, formType = "signup" }) => (
  <div className="relative group">
    <input
      type={type}
      name={name}
      required
      placeholder=" "
      value={value}
      onChange={(e) => onChange(e, formType)}
      className="w-full bg-transparent border border-[#3f3f3f] rounded-md text-sm px-4 py-3.5 outline-none focus:border-[#3ea6ff] transition-all duration-150 text-white peer placeholder-shown:border-[#3f3f3f]"
    />
    <label className="absolute left-3 top-[-9px] bg-[#0f0f0f] px-1 text-xs text-gray-400 transform transition-all duration-150 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-focus:top-[-9px] peer-focus:text-xs peer-focus:text-[#3ea6ff]">
      {label}
    </label>
    {error && <p className="text-[#ff4e4e] text-xs mt-1.5 pl-1">{error}</p>}
  </div>
);

const LoginAndSignup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* Extract global state from Redux */
  const {
    loginData,
    signupData,
    showPassword,
    showSignupPassword,
    showSignupConfirm,
    isSignupMode,
  } = useSelector((state) => state.auth);

  const [errors, setErrors] = useState({});
  const isSignup = isSignupMode;

  /* Handle typing changes and forward data to Redux slice */
  const handleChange = (e, form) => {
    const { name, value } = e.target;
    if (form === "login") dispatch(setLoginField({ name, value }));
    else dispatch(setSignupField({ name, value }));
  };

  /* Client-side Login Validation */
  const validateLogin = () => {
    const err = {};
    if (!loginData.identifier.trim()) err.identifier = "Email or username required";
    if (!loginData.password.trim()) err.password = "Password required";
    return err;
  };

  /* Client-side Signup Validation */
  const validateSignup = () => {
    const err = {};
    if (!signupData.username.trim()) err.username = "Choose a channel username";
    if (!signupData.email.trim()) err.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(signupData.email)) err.email = "Invalid email address";
    if (!signupData.phone.trim()) err.phone = "Phone number is required";
    else if (!/^\+?[0-9]{10,15}$/.test(signupData.phone)) {
      err.phone = "Enter 10 valid digit ";
    }
    if (!signupData.password.trim()) err.password = "Password is required";
    else if (signupData.password.length < 8) err.password = "Must be at least 8 characters";
    if (!signupData.confirmPassword.trim()) err.confirmPassword = "Confirm your password";
    else if (signupData.password !== signupData.confirmPassword) err.confirmPassword = "Passwords do not match";
    return err;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const validation = validateLogin();
    setErrors(validation);
    if (Object.keys(validation).length === 0) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(loginData),
        });
        const data = await res.json();
        if (!res.ok) return alert(data.message || "Login failed");
        const user = {
          id: data.user._id || data.user.id,
          name: data.user.name,
          username: data.user.username,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role || "user",
          avatar: data.user.avatar || null,
        };
        sessionStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        dispatch(loginSuccess(user));
        dispatch(setLoginField({ name: "password", value: "" }));
        navigate("/");
      } catch (error) {
        alert(error.message || "Server error, try again later");
      }
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const validation = validateSignup();
    setErrors(validation);
    
    if (Object.keys(validation).length === 0) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: signupData.username,
            email: signupData.email,
            phone: signupData.phone,
            password: signupData.password,
          }),
        });
        
        const text = await res.text();
        let data = {};
        try { 
          data = text ? JSON.parse(text) : {}; 
        } catch { 
          return alert("Invalid server response"); 
        }
        
        if (!res.ok) return alert(data.message || "Signup failed");
        sessionStorage.setItem("accessToken", data.accessToken);
        
        const newUser = { 
          id: data.user._id || data.user.id, 
          name: data.user.name || signupData.username,
          username: data.user.username, 
          email: data.user.email, 
          phone: data.user.phone, 
          role: data.user.role || "user",
          avatar: data.user.avatar || null
        };
        
        localStorage.setItem("loggedInUser", JSON.stringify(newUser));
        dispatch(loginSuccess(newUser));
        dispatch(setSignupField({ name: "password", value: "" }));
        dispatch(setSignupField({ name: "confirmPassword", value: "" }));
        alert("Account created successfully!");
        navigate("/");
      } catch { 
        alert("Server error, try again later"); 
      }
    }
  };

  /* Form submission availability checks */
  const loginFilled = loginData.identifier.trim() && loginData.password.trim();
  const signupFilled = signupData.username.trim() && signupData.email.trim() && signupData.phone.trim() && signupData.password.trim() && signupData.confirmPassword.trim();

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex font-Manrope antialiased selection:bg-[#00E5FF]/30 selection:text-[#F8FAFC] mb-8">
      
      {/* Left Panel: Branding Sidebar (Visible on desktop) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#0B1220] to-[#7C3AED] p-5 flex-col justify-between border-r border-[#00E5FF]/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,229,255,0.08),transparent_45%)]" />
        <div className="flex items-center gap-2 cursor-pointer relative z-10">
          {Logo && <img src={Logo} alt="NeoPlay+" className="h-10 w-auto object-contain" />}
        </div>
        <div className="space-y-6 max-w-md relative z-10">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">Welcome to NeoPlay+</h2>
          <p className="text-gray-400 text-base leading-relaxed">Join our vibrant community of creators and viewers, where you can upload videos, share images, post tweets, create playlists, and connect with your audience like never before.</p>
        </div>
        <p className="text-xs text-gray-500 relative z-10">&copy; 2026 NeoPlay+ Built for independent creators.</p>
      </div>

      {/* Right Panel: Interactive Form Container */}
      <div className="w-full min-h-screen md:w-1/2 flex pt-4 justify-center p-2 sm:p-2 bg-[#070B14]">
        <div className="w-full max-w-[420px] flex flex-col">
          <div className="flex items-center justify-center gap-2 cursor-pointer relative z-10 mb-6">
            {Logo && <img src={Logo} alt="NeoPlay+" className="h-10 w-auto object-contain" />}
          </div>

          <AnimatePresence mode="wait">
            {!isSignup ? (
              /* SIGN IN CONTAINER */
              <motion.div key="loginCard" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.2 }}>
                <h1 className="text-2xl font-bold text-white mb-2">Sign in</h1>
                <p className="text-sm text-gray-400 mb-8">to continue sharing and interacting</p>

                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="relative group">
                    <input 
                      type="text" 
                      name="identifier" 
                      required 
                      placeholder=" " 
                      value={loginData.identifier} 
                      onChange={(e) => handleChange(e, "login")}
                      className="w-full bg-transparent border border-[#3f3f3f] rounded-md text-sm px-4 py-3.5 outline-none focus:border-[#00E5FF] transition-all duration-150 text-white peer placeholder-shown:border-[#3f3f3f]"
                    />
                    <label className="absolute left-3 top-[-9px] bg-[#0f0f0f] px-1 text-xs text-gray-400 transform transition-all duration-150 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-focus:top-[-9px] peer-focus:text-xs peer-focus:text-[#3ea6ff]">Email or username</label>
                    {errors.identifier && <p className="text-[#ff4e4e] text-xs mt-1.5 pl-1">{errors.identifier}</p>}
                  </div>

                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      required 
                      placeholder=" " 
                      value={loginData.password} 
                      onChange={(e) => handleChange(e, "login")}
                      className="w-full bg-transparent border border-[#3f3f3f] rounded-md text-sm px-4 py-3.5 pr-14 outline-none focus:border-[#3ea6ff] transition-all duration-150 text-white peer placeholder-shown:border-[#3f3f3f]" 
                    />
                    <label className="absolute left-3 top-[-9px] bg-[#0f0f0f] px-1 text-xs text-gray-400 transform transition-all duration-150 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-focus:top-[-9px] peer-focus:text-xs peer-focus:text-[#3ea6ff]">Password</label>
                    <button type="button" onClick={() => dispatch(toggleShowPassword())} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#3ea6ff] z-10">{showPassword ? "Hide" : "Show"}</button>
                    {errors.password && <p className="text-[#ff4e4e] text-xs mt-1.5 pl-1">{errors.password}</p>}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <a href="#" className="text-sm font-semibold text-[#3ea6ff]">Forgot email?</a>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={() => { setErrors({}); dispatch(setIsSignupMode(true)); }} className="text-sm font-semibold text-[#3ea6ff] hover:bg-[#263850] px-3 py-2 rounded-full transition-colors">Create account</button>
                    <button type="submit" disabled={!loginFilled} className="bg-[#f1f1f1] text-[#0f0f0f] px-6 py-2 rounded-full text-sm font-semibold disabled:bg-[#313131] disabled:text-[#717171] transition-colors">Sign in</button>
                  </div>
                </form>

                {/* Third-Party Authentication Options */}
                <div className="relative flex py-5 items-center mt-2">
                  <div className="flex-grow border-t border-[#272727]"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-gray-500 uppercase">OR</span>
                  <div className="flex-grow border-t border-[#272727]"></div>
                </div> {/* Added missing closing tag here */}

                <button type="button" className="w-full flex items-center justify-center gap-2 border border-[#3f3f3f] text-[#f1f1f1] rounded-full py-2 text-sm font-semibold hover:bg-[#272727] transition-colors">
                  <FaGoogle size={18} className="text-[#4285F4]" /> Sign in with Google
                </button>
              </motion.div>
            ) : (
              /* SIGN UP CONTAINER */
              <motion.div key="signupCard" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.2 }}>
                <h1 className="text-2xl text-white mb-2 font-bold">Create your account</h1>
                <p className="text-sm text-gray-400 mb-8">Set up your Account details</p>

                <form onSubmit={handleSignupSubmit} className="space-y-5">
                  <NeoPlayField name="username" label="Username" value={signupData.username} error={errors.username} onChange={handleChange} formType="signup" />
                  <NeoPlayField name="email" type="email" label="Email address" value={signupData.email} error={errors.email} onChange={handleChange} formType="signup" />
                  <NeoPlayField name="phone" type="tel" label="Phone number" value={signupData.phone} error={errors.phone} onChange={handleChange} formType="signup" />
                  

                  <div className="relative group">
                    <input 
                      type={showSignupPassword ? "text" : "password"} 
                      name="password" 
                      required 
                      placeholder=" " 
                      value={signupData.password} 
                      onChange={(e) => handleChange(e, "signup")}
                      className="w-full bg-transparent border border-[#3f3f3f] rounded-md text-sm px-4 py-3.5 pr-14 outline-none focus:border-[#3ea6ff] text-white peer transition-all duration-150" 
                    />
                    <label className="absolute left-3 top-[-9px] bg-[#0f0f0f] px-1 text-xs text-gray-400 transform transition-all duration-150 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-focus:top-[-9px] peer-focus:text-xs peer-focus:text-[#3ea6ff]">Password</label>
                    <button type="button" onClick={() => dispatch(toggleShowSignupPassword())} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#3ea6ff] z-10">{showSignupPassword ? "Hide" : "Show"}</button>
                    {errors.password && <p className="text-[#ff4e4e] text-xs mt-1.5 pl-1">{errors.password}</p>}
                  </div>

                  <div className="relative group">
                    <input 
                      type={showSignupConfirm ? "text" : "password"} 
                      name="confirmPassword" 
                      required 
                      placeholder=" " 
                      value={signupData.confirmPassword} 
                      onChange={(e) => handleChange(e, "signup")}
                      className="w-full bg-transparent border border-[#3f3f3f] rounded-md text-sm px-4 py-3.5 pr-14 outline-none focus:border-[#3ea6ff] text-white peer transition-all duration-150" 
                    />
                    <label className="absolute left-3 top-[-9px] bg-[#0f0f0f] px-1 text-xs text-gray-400 transform transition-all duration-150 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-focus:top-[-9px] peer-focus:text-xs peer-focus:text-[#3ea6ff]">Confirm password</label>
                    <button type="button" onClick={() => dispatch(toggleShowSignupConfirm())} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#3ea6ff] z-10">{showSignupConfirm ? "Hide" : "Show"}</button>
                    {errors.confirmPassword && <p className="text-[#ff4e4e] text-xs mt-1.5 pl-1">{errors.confirmPassword}</p>}
                  </div>

                  <p className="text-xs text-gray-500 leading-normal pt-2">
                    By creating an account, you agree to our <a href="#" className="text-[#3ea6ff] hover:underline">Terms of Service</a> and <a href="#" className="text-[#3ea6ff] hover:underline">Privacy Policy</a>.
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={() => { setErrors({}); dispatch(setIsSignupMode(false)); }} className="text-sm font-semibold text-[#3ea6ff] hover:bg-[#263850] px-3 py-2 rounded-full transition-colors">Sign in Instead</button>
                    <button type="submit" disabled={!signupFilled} className="bg-[#f1f1f1] text-[#0f0f0f] px-6 py-2 rounded-full text-sm font-semibold disabled:bg-[#313131] disabled:text-[#717171] disabled:cursor-not-allowed transition-colors">Sign up</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};

export default LoginAndSignup;