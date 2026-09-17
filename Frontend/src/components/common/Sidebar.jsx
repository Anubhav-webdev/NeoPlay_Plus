import { Link, useLocation } from "react-router-dom";
import { 
  FiHome, FiTrendingUp, FiTv, FiPlayCircle, 
  FiImage, FiTwitter, FiList,
  FiClock, FiSettings, FiHelpCircle, 
  FiFlag, FiLogOut,FiDownload
} from "react-icons/fi";

function SidebarLink({ item, expanded, isActive, badge, dot, onClose }) {
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
          {badge && (
            <span className="bg-[#10B981] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
              {badge}
            </span>
          )}
          {dot && <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.35)]" />}
          {item.rightIcon && <span className="text-white/40 text-xl">{item.rightIcon}</span>}
        </div>
      )}
    </div>
  );

  return item.to ? (
    <Link to={item.to} onClick={onClose} className="block w-full">
      {content}
    </Link>
  ) : (
    <button type="button" className="block w-full text-left">
      {content}
    </button>
  );
}

export function Sidebar({ mobileOpen, expanded, onClose, onMouseEnter, onMouseLeave }) {
  const location = useLocation(); // Extracts current active client route URL path

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
        <SidebarLink item={{ label: "Trending", icon: <FiTrendingUp />, to: "/trending" }} expanded={expanded} isActive={checkActive("/trending")} badge="New" onClose={onClose} />
        <SidebarLink item={{ label: "Subscriptions", icon: <FiTv />, to: "/subscriptions" }} expanded={expanded} isActive={checkActive("/subscriptions")} dot={true} onClose={onClose} />
        
        <hr className="border-slate-500/40 my-1.5 mx-1" />

        {/* MEDIA FEED ITEMS */}
        <SidebarLink item={{ label: "NeoVideos", icon: <FiPlayCircle />, to: "/videos" }} expanded={expanded} isActive={checkActive("/videos")} />
        <SidebarLink item={{ label: "NeoShots", icon: <FiImage />, to: "/images" }} expanded={expanded} isActive={checkActive("/images")} />
        <SidebarLink item={{ label: "NeoFeed", icon: <FiTwitter />, to: "/tweets-feed" }} expanded={expanded} isActive={checkActive("/tweets-feed")} dot={true} />
        
        <hr className="border-slate-500/40 my-1.5 mx-1" />

        {/* USER ARCHIVE ITEMS */}
        <SidebarLink item={{ label: "Playlists", icon: <FiList />, to: "/playlists" }} expanded={expanded} isActive={checkActive("/playlists")} />
        <SidebarLink item={{ label: "Download", icon: <FiDownload />, to: "/download" }} expanded={expanded} isActive={checkActive("/download")} />
        <SidebarLink item={{ label: "Watch History", icon: <FiClock />, to: "/watch-history" }} expanded={expanded} isActive={checkActive("/watch-history")} />

        <hr className="border-slate-500/40 my-1.5 mx-1" />
        <SidebarLink item={{ label: "Creator Dashboard", icon: <FiTv />, to: "/creator-dashboard" }} expanded={expanded} isActive={checkActive("/creator-dashboard")} badge="Studio" />
      </nav>

      {/* BOTTOM BASE UTILITIES SECTION */}
      <div className="flex flex-col gap-0.5 p-2 border-t border-[#111827]/60 bg-[#0B1220]/40 backdrop-blur-md">
        <SidebarLink item={{ label: "Settings", icon: <FiSettings />, to: "/settings" }} expanded={expanded} isActive={checkActive("/settings")} />
        <SidebarLink item={{ label: "Help & Support", icon: <FiHelpCircle />, to: "/help-support" }} expanded={expanded} isActive={checkActive("/help-support")} />
        <SidebarLink item={{ label: "Report", icon: <FiFlag />, to: "/report" }} expanded={expanded} isActive={checkActive("/report")} />

        <SidebarLink item={{ label: "Logout", icon: <FiLogOut className="text-red-400/80 group-hover:text-red-400" /> }} expanded={expanded} isActive={false} />
      </div>
    </aside>
  );
}