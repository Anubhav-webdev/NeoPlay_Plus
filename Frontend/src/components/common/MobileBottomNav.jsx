import { BOTTOM_NAV_ITEMS } from "../../constants/data";

export function MobileBottomNav() {
  return (
    <nav className="font-Manrope fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[#111827]/60 bg-[#0B1220] px-2 py-2 sm:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => (
        <button
          key={item.label}
          className="flex flex-col items-center gap-0.5 text-white/70 hover:text-[#00E5FF] focus:text-[#00E5FF] transition-colors py-1 px-2"
        >
          {item.icon}
          <span className="text-[10px]">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
