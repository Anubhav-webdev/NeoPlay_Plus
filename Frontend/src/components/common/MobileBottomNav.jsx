import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MOBILE_NAV_ITEMS } from "../../constants/mobileNavItems";

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="font-Manrope fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[#111827]/60 bg-[#0B1220]/90 backdrop-blur-md px-2 py-2 sm:hidden">
      {MOBILE_NAV_ITEMS.map((item, index) => {
        const isActive = location.pathname === item.to;

        return (
          <Link
            key={item.label}
            to={item.to}
            className="relative flex flex-col items-center gap-0.5 py-1 px-3"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: index * 0.04,
                ease: "easeOut",
              }}
              whileTap={{ scale: 0.85 }}
              className={`flex flex-col items-center gap-0.5 transition-colors ${
                isActive ? "text-[#00E5FF]" : "text-white/70 hover:text-[#00E5FF]"
              }`}
            >
              {/* Icon scale transition on active */}
              <motion.div
                animate={{
                  scale: isActive ? 1.15 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {item.icon}
              </motion.div>

              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.div>

            {/* Glowing active indicator line */}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute -bottom-2 h-[3px] w-6 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}