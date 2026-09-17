import { Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Header } from "../common/Navbar";
import { Sidebar } from "../common/Sidebar";
import { MobileBottomNav } from "../common/MobileBottomNav";

/* Redux imports for uiSlice */
import {
  setSidebarExpanded,
  setMobileSidebarOpen,
  setSearchOpen,
} from "../../redux/slices/uiSlice";

/**
 * MainLayout - Wraps all routes with header, sidebar, and mobile nav
 * Uses Redux uiSlice for UI state management
 */
function Layout() {
  const dispatch = useDispatch();
  const { sidebarExpanded, mobileSidebarOpen, searchOpen } = useSelector(
    (state) => state.ui
  );

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F8FAFC] font-orbitron">
      
      <Header
        searchOpen={searchOpen}
        setSearchOpen={(val) => dispatch(setSearchOpen(val))}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={(val) => dispatch(setMobileSidebarOpen(val))}
      />

      <div className="h-[72px]" />

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => dispatch(setMobileSidebarOpen(false))}
        />
      )}

      <div className="flex flex-col sm:flex-row min-h-[calc(100vh-72px)]">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onClose={() => dispatch(setMobileSidebarOpen(false))}
          expanded={sidebarExpanded}
          onMouseEnter={() => dispatch(setSidebarExpanded(true))}
          onMouseLeave={() => dispatch(setSidebarExpanded(false))}
        />

        <main className="flex-1 mt-3 py-2">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export default Layout;
