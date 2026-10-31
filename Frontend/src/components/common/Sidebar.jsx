import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { logoutFromApi } from "../../api/authApi";
import { 
  FiHome, FiTrendingUp, FiTv, FiPlayCircle, 
  FiImage, FiTwitter, FiList,
  FiClock, FiSettings, FiHelpCircle, 
  FiFlag, FiLogOut
} from "react-icons/fi";

const BADGE_COLOR_CLASSES = {
  "teal-500": "bg-teal-500",
  "amber-500": "bg-amber-500",
  "red-500": "bg-red-500",
};

function SidebarLink({ item, expanded, isActive, badge,badgeColor, dot, onClose , disabled }) {
  const content = (
    <div 
      className={`group flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left transition-all duration-150 outline-none ${
        isActive 
          ? "bg-cyan-500/20 text-[#00E5FF] font-bold shadow-sm" 
          : "text-white/70 hover:bg-[#111827]/70 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-x-3.5">
        <span className={`text-lg shrink-0 transition-colors duration-150 ${
          isActive ? "text-white" : "text-white/50 group-hover:text-white"
        }`}>
          {item.icon}
        </span>
        <span
          className="whitespace-nowrap overflow-hidden  font-semibold tracking-wide transition-all duration-200 text-balance"
          style={{ 
            opacity: expanded ? 1 : 0, 
            maxWidth: expanded ? "180px" : "0px",
            transform: expanded ? "translateX(0)" : "translateX(-5px)"
          }}
        >
          {item.label}
        </span>
      </div>

      {/* Badges and Notifications Right Side aligned */}
      {expanded && (
        <div className="flex items-center ml-2">
          {badge && badgeColor && (
            <span className={`${BADGE_COLOR_CLASSES[badgeColor] || "bg-slate-500"} text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider scale-90`}>
              {badge}
            </span>
          )}
          {dot && <span className="h-1.5 w-1.5 rounded-full bg-[#00ffc8] shadow-[0_0_8px_rgba(124,58,237,0.35)] animate-pulse" />}
          {item.rightIcon && <span className="text-white/40 text-xl">{item.rightIcon}</span>}
        </div>
      )}
    </div>
  );
if (disabled) {
  return <div aria-disabled="true" className="opacity-50 cursor-not-allowed">
    {content}
  </div>;
}
  return item.to ? (
    <Link to={item.to} onClick={onClose} className="block w-full">
      {content}
    </Link>
  ) : (
    <button type="button" onClick={item.onClick} className="block w-full text-left">
      {content}
    </button>
  );
}

export function Sidebar({ mobileOpen, expanded, onClose, onMouseEnter, onMouseLeave }) {
  const location = useLocation(); // Extracts current active client route URL path
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";
  const isAuthenticated = Boolean(user);

  const handleLogout = async () => {
    try {
      await logoutFromApi();
    } catch (error) {
      console.error("Could not end the server session", error);
    } finally {
      dispatch(logout());
      onClose?.();
    }
  };

  // Helper function to check if a specific nav item path matches the browser path
  const checkActive = (path) => location.pathname === path;

  return (
    <aside
      className={`sidebar-font flex flex-col ${mobileOpen ? "fixed inset-x-0 top-[72px] z-50 sm:hidden" : "hidden sm:flex sticky top-[72px]"} h-[calc(100vh-72px)] shrink-0 border-r border-[#111827]/70 bg-[#0B1220] overflow-x-hidden overflow-y-auto scrollbar-none transition-all duration-300 select-none ${expanded ? "sm:w-[240px] w-full" : "sm:w-[64px] w-full"}`}
      style={{ width: expanded ? "240px" : "64px" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* SECTION 1: CORE NAVIGATION FEED */}
      <nav className="flex flex-col gap-0.8 p-2 flex-1">
        <SidebarLink item={{ label: "Home", icon: <FiHome />, to: "/" }} expanded={expanded} isActive={checkActive("/")} onClose={onClose} />
        <SidebarLink item={{ label: "Trending", icon: <FiTrendingUp />, to: "/trending" }} expanded={expanded} isActive={checkActive("/trending")} badge="New" badgeColor="teal-500" onClose={onClose} />
        <SidebarLink item={{ label: "Subscriptions", icon: <FiTv />, to: "/subscriptions" }} expanded={expanded} isActive={checkActive("/subscriptions")} dot={true} onClose={onClose} />
        
        <hr className="border-slate-500/40 my-1.5 mx-1" />

        {/* MEDIA FEED ITEMS */}
        <SidebarLink item={{ label: "NeoVideos", icon: <FiPlayCircle />, to: "/videos" }} expanded={expanded} isActive={checkActive("/videos")} />
        <SidebarLink item={{ label: "NeoShots", icon: <FiImage />, to: "/images" }} expanded={expanded} isActive={checkActive("/images")} />
        <SidebarLink item={{ label: "NeoFeed", icon: <FiTwitter />, to: "/tweets-feed" }} expanded={expanded} isActive={checkActive("/tweets-feed")} dot={true} />
        {/* <SidebarLink item={{ label: "NeoMusic", icon: <FiMusic />, to: "/music" }} expanded={expanded} isActive={checkActive("/music")} badge="Upcoming..." badgeColor="red-500" disabled={true} /> */}
        
        <hr className="border-slate-500/40 my-1.5 mx-1" />

        {/* USER ARCHIVE ITEMS */}
        <SidebarLink item={{ label: "Playlists", icon: <FiList />, to: "/playlists" }} expanded={expanded} isActive={checkActive("/playlists")} />
        {/* <SidebarLink item={{ label: "Download", icon: <FiDownload />, to: "/download" }} expanded={expanded} isActive={checkActive("/download")}  disabled={true} /> */}
        <SidebarLink item={{ label: "Watch History", icon: <FiClock />, to: "/watch-history" }} expanded={expanded} isActive={checkActive("/watch-history")} />

        <hr className="border-slate-500/40 my-1.5 mx-1" />
        {/* <SidebarLink item={{ label: "Community Zone", icon: <FiUsers />, to: "/community" }} expanded={expanded} isActive={checkActive("/community")} badge="Upcoming..." badgeColor="red-500"  disabled={true} /> */}
        {isAuthenticated && <SidebarLink item={{ label: user.role === "creator" ? "Creator Dashboard" : "Become a Creator", icon: <FiTv />, to: "/creator-dashboard" }} expanded={expanded} isActive={checkActive("/creator-dashboard")} badge={user.role === "creator" ? "Studio" : undefined} badgeColor="teal-500" onClose={onClose} />}
        {isAdmin && <SidebarLink item={{ label: "Duplicate Reviews", icon: <FiFlag />, to: "/admin/media-reviews" }} expanded={expanded} isActive={checkActive("/admin/media-reviews")} badge="Admin" badgeColor="amber-500" />}
      </nav>

      {/* BOTTOM BASE UTILITIES SECTION */}
      <div className="flex flex-col gap-0.5 p-2 border-t border-[#111827]/60 bg-[#0B1220]/40 backdrop-blur-md">
        <SidebarLink item={{ label: "Settings", icon: <FiSettings />, to: "/settings" }} expanded={expanded} isActive={checkActive("/settings")} />
        <SidebarLink item={{ label: "Help & Support", icon: <FiHelpCircle />, to: "/help-support" }} expanded={expanded} isActive={checkActive("/help-support")} />
        <SidebarLink item={{ label: "Report", icon: <FiFlag />, to: "/report" }} expanded={expanded} isActive={checkActive("/report")} />

        {isAuthenticated && <SidebarLink item={{ label: "Logout", icon: <FiLogOut className="text-red-400/80 group-hover:text-red-400" />, to: undefined, onClick: handleLogout }} expanded={expanded} isActive={false} />}
      </div>
    </aside>
  );
}


//three features post poned (29.10.2026)
