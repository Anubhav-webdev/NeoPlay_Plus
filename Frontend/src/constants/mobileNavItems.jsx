import { FiHome, FiPlus, FiTrendingUp, FiTwitter, FiUser } from "react-icons/fi";

export const MOBILE_NAV_ITEMS = [
  { label: "Home", icon: <FiHome className="h-5 w-5 shrink-0" />, to: "/" },
  { label: "Tweets", icon: <FiTwitter className="h-5 w-5 shrink-0" />, to: "/tweets-feed" },
  { label: "Creator", icon: <FiPlus className="h-5 w-5 shrink-0" />, to: "/creator-dashboard" },
  { label: "Trending", icon: <FiTrendingUp className="h-5 w-5 shrink-0" />, to: "/trending" },
  { label: "Profile", icon: <FiUser className="h-5 w-5 shrink-0" />, to: "/settings" },
];
