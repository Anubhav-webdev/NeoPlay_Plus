import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiSearch, FiMenu, FiX, FiUser, FiChevronDown } from "react-icons/fi";
import Logo from "../../photo&Video/logo.png";
import {motion}  from "framer-motion";
import { logout } from "../../redux/slices/authSlice";
import { logoutFromApi } from "../../api/authApi";

export function Header({ searchOpen, setSearchOpen, mobileSidebarOpen, setMobileSidebarOpen }) {
  const [scrolled, setScrolled] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = async () => {
    try {
      await logoutFromApi();
    } catch (error) {
      console.error("Could not end the server session", error);
    } finally {
      dispatch(logout());
      setAccountMenuOpen(false);
      navigate("/");
    }
  };

  // Adds a nice background blur when page scrolls down
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`font-Manrope fixed inset-x-0 top-0 z-50 w-full border-b transition-all duration-300 sidebar-font ${
        scrolled 
          ? "border-[#111827]/90 bg-[#0B1220]/90 backdrop-blur-md py-2.5" 
          : "border-[#111827]/70 bg-linear-to-tr from-[#070B14] via-[#0B1220] to-[#111827] py-4 shadow-sm"
      } px-4 md:px-2`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* LEFT: Premium Brand Identity */}
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Go to NeoPlay home"
          className="flex shrink-0 cursor-pointer items-center gap-3 group"
        >
          <div className="w-28 h-16 md:w-36 md:h-12 transition-transform duration-300 group-hover:scale-105">
            <img src={Logo} alt="NeoPlay+" className="h-full w-full object-contain" />
          </div>
        </button>

        {/* CENTER: Real, High-Fidelity Desktop Search Bar */}
        <div className="relative mx-8 hidden w-full max-w-md md:block group">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 transition-colors duration-200 group-focus-within:text-[#00E5FF]">
            <FiSearch className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search documentation, components..."
            className="w-full rounded-lg border border-white/10 bg-white/3 py-2 pl-10 pr-12 text-sm text-white placeholder-white/30 outline-none transition-all duration-200 hover:border-[#00E5FF]/30 focus:border-[#00E5FF] focus:bg-[#0B1220] focus:ring-1 focus:ring-[#00E5FF]/30"
          />
          {/* Real world shortcut pill key */}
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 font-Manrope text-[10px] font-medium text-white/40 shadow-sm sm:flex">
            <span>⌘</span>K
          </kbd>
        </div>

        {/* RIGHT: User Profile & Mobile Navigation Controls */}
        <div className="flex items-center gap-4">
          
          {/* Mobile Search Trigger Icon (Hidden on Desktop) */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`rounded-lg p-2 transition-all duration-200 md:hidden hover:bg-white/5 text-white/70 hover:text-white ${
              searchOpen ? "bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20" : ""
            }`}
            aria-label="Toggle search"
          >
            {searchOpen ? <FiSearch className="h-5 w-5" /> : <FiSearch className="h-5 w-5" />}
          </button>

          {/* Right Side Man Icon with Account Actions */}
       <div className="relative">
       <motion.button
  onClick={() => user ? setAccountMenuOpen((open) => !open) : navigate("/signup")}
  initial="rest"
  whileHover="hover"
  whileTap="tap"
  variants={{
    rest: { scale: 1 },
    hover: { scale: 1.02, borderColor: "rgba(0, 229, 255, 0.25)", backgroundColor: "rgba(0, 229, 255, 0.08)" },
    tap: { scale: 0.98 }
  }}
  className="flex items-center gap-1 rounded-full p-1 md:rounded-lg md:border md:border-[#00E5FF]/20 md:bg-[#070B14]/80 md:p-1.5 md:pr-3 cursor-pointer select-none"
  aria-label={user ? "Open profile menu" : "Sign in"}
>
  <motion.div 
    variants={{
      rest: { backgroundColor: "rgba(0, 229, 255, 0.12)", color: "#00E5FF", y: 0 },
      hover: { backgroundColor: "#00E5FF", color: "#070B14", y: -1 }
    }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#00E5FF]/20"
  >
    <FiUser className="h-4 w-4" />
  </motion.div>

  <div className="hidden md:flex flex-col items-start ml-2 text-left">
    <span className="text-xs font-semibold text-white/90 leading-none tracking-wider">{user ? "Profile" : "Sign In"}</span>
    <span className="text-[10px] text-white/40 mt-0.5 tracking-wider all-font">{user ? (user.username || "Account") : "Account"}</span>
  </div>

  <motion.div 
    className="hidden md:block ml-1"
    variants={{
      rest: { rotate: 0 },
      hover: { rotate: 180 }
    }}
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
  >
    <FiChevronDown className="h-3.5 w-3.5 text-white/30" />
  </motion.div>
</motion.button>
          {user && accountMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-white/10 bg-[#111827] p-2 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  navigate("/settings");
                  setAccountMenuOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
              >
                Account settings
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate("/creator-dashboard");
                  setAccountMenuOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
              >
                {user.role === "creator" ? "Creator Dashboard" : "Become a Creator"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
              >
                Sign out
              </button>
            </div>
          )}
          </div>

          {/* Hamburger Menu Toggle (STRICTLY MOBILE ONLY: hidden on md and up) */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className={`flex items-center justify-center rounded-lg p-2 text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 md:hidden ${
              mobileSidebarOpen ? "bg-[#00E5FF]/10 text-[#00E5FF]" : ""
            }`}
            aria-label={mobileSidebarOpen ? "Close menu" : "Open menu"}
          >
            {mobileSidebarOpen ? <FiX className="h-5.5 w-5.5" /> : <FiMenu className="h-5.5 w-5.5" />}
          </button>

        </div>
      </nav>

      {/* Responsive Inline Mobile Search Drawer (Hidden on Desktop) */}
      <div 
        className={`grid transition-all duration-300 ease-in-out md:hidden ${
          searchOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              <FiSearch className="h-4 w-4" />
            </span>
            <input
              autoFocus={searchOpen}
              type="text"
              placeholder="Search..."
              className="w-full rounded-lg border border-white/10 bg-white/2 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-[#00E5FF] focus:bg-[#0B1220]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}