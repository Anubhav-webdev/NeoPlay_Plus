import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../../redux/slices/authSlice';
import { uploadUserAvatar } from '../../api/mediaApi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Bell, Sliders, Trophy, 
  CheckCircle, Shield, Calendar, MapPin, Heart, MessageSquare, 
  Share2, Play, Image, FolderPlus, Clock,
  Tv, Eye, ChevronRight, UserMinus, ExternalLink, Moon, Sun,
  Sparkles, Award, Camera, Save, X, Upload
} from 'lucide-react';
import { FiTwitter } from "react-icons/fi";

// --- ANIMATION CONFIGURATIONS ---
const cardHover = {
  rest: { y: 0, scale: 1, boxShadow: '0px 0px 0px rgba(139, 92, 246, 0)' },
  hover: { 
    y: -6, 
    scale: 1.01, 
    boxShadow: '0px 10px 30px rgba(139, 92, 246, 0.12)',
    transition: { duration: 0.3, ease: 'easeOut' } 
  }
};

const pulseGlow = {
  animate: {
    opacity: [0.4, 0.7, 0.4],
    scale: [1, 1.02, 1],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
  }
};

// --- DEFAULT STATE FALLBACK ASSETS ---
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop";
const DEFAULT_BANNER = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop";

// --- REUSABLE COMPONENTS ---
const GlassCard = ({ children, className = '', ...props }) => (
  <motion.div 
    variants={cardHover}
    initial="rest"
    whileHover="hover"
    className={`bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-[24px] p-6 text-white shadow-xl transition-colors duration-300 hover:border-purple-500/30 ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

const GradientBadge = ({ children, color = 'purple' }) => {
  const colorMap = {
    purple: 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
  };
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border bg-gradient-to-r ${colorMap[color] || colorMap.purple}`}>
      {children}
    </span>
  );
};

const AnimatedToggle = ({ checked, onChange }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none flex items-center flex-shrink-0 ${checked ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-slate-800'}`}
  >
    <motion.div 
      layout
      className="w-6 h-6 rounded-full bg-white shadow-md"
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      animate={{ x: checked ? 24 : 0 }}
    />
  </button>
);

export default function NeoPlayDashboard() {
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const authUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');

  // Core Profile States (With protected initial assets)
  const [profile, setProfile] = useState({
    name: authUser?.name || "Your profile",
    username: authUser?.username || "",
    bio: "Digital architect & UI designer exploring interactive boundaries. Curating fresh digital media formats daily. 🌌",
    location: "Tokyo, Japan",
    tier: "Premium Pass",
    avatar: authUser?.avatar || DEFAULT_AVATAR,
    banner: DEFAULT_BANNER
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState({ ...profile });

  useEffect(() => {
    if (!authUser) return;
    setProfile((current) => ({
      ...current,
      name: authUser.name || current.name,
      username: authUser.username || current.username,
      avatar: authUser.avatar || current.avatar,
    }));
  }, [authUser]);

  const [isFollowing, setIsFollowing] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [aiLevel, setAiLevel] = useState(75);
  const [quality, setQuality] = useState('480p');
  const [settings, setSettings] = useState({ comments: true, replies: true, likes: false, uploads: true });

  const [subs, setSubs] = useState([
    { id: 1, name: 'Synthetix Media', subs: '240k', upload: 'Next-Gen Tailwind Architectures (2h ago)', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop' },
    { id: 2, name: 'Pixel Foundry', subs: '1.2M', upload: 'Mastering Realtime Shader Logic (1d ago)', img: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=150&auto=format&fit=crop' },
    { id: 3, name: 'Vector Horizon', subs: '89k', upload: 'Is UI Engineering Obsolete in 2026? (3d ago)', img: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=150&auto=format&fit=crop' },
    { id: 4, name: 'Aether Code Lab', subs: '450k', upload: 'Framer Motion Spring Physics Deep-Dive (5d ago)', img: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=150&auto=format&fit=crop' },
  ]);

  const statItems = [
    { label: 'Videos Watched', val: '1,420', icon: Play, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Images Viewed', val: '8,941', icon: Image, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Tweets Read', val: '3,219', icon: FiTwitter, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Likes Given', val: '12.4k', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Comments Left', val: '482', icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Content Shares', val: '956', icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Playlists Created', val: '14', icon: FolderPlus, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Watch Time', val: '312h', icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  const recommendations = [
    { title: 'Cyberpunk Aesthetic Design Systems', type: 'Video Mix', meta: '45 mins remaining', icon: Tv },
    { title: 'Abstract Geometry Showcase', type: 'Image Gallery', meta: '88 new elements', icon: Eye },
    { title: 'Web3 & Real-Time Client Rendering updates', type: 'Thread Stack', meta: '12 posts curated', icon: FiTwitter },
  ];

  const badges = [
    { title: 'System Initialized', desc: 'Completed authentication parameters.', progress: 100, status: 'Unlocked', icon: Shield, col: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Perpetual Consumer', desc: 'Maintained an unbroken 7-day watch configuration loop.', progress: 85, status: '85% Sync', icon: Clock, col: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Alpha Supporter', desc: 'Subscribed to founding network nodes early.', progress: 100, status: 'Unlocked', icon: Award, col: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const notificationRows = [
    { key: 'comments', label: 'Comments on my pipeline', desc: 'Alerts when new comments arrive on your pinned posts.' },
    { key: 'replies', label: 'Direct replies to remarks', desc: 'Receive immediate alerts when someone explicitly replies.' },
    { key: 'uploads', label: 'Creator subscription alerts', desc: 'Real-time pushed messages when channels update.' },
  ];

  const toggleNotification = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  const handleUnsubscribe = (id) => setSubs(subs.filter(sub => sub.id !== id));

  const startEditing = () => {
    setEditBuffer({ ...profile });
    setIsEditing(true);
  };

  const saveProfile = () => {
    setProfile({ ...editBuffer });
    setIsEditing(false);
  };

  const handleLocalAvatarChange = async (e) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setIsUploadingAvatar(true);
    setAvatarMessage('Uploading profile photo...');
    try {
      const updatedUser = await uploadUserAvatar(file);
      const nextUser = { ...authUser, ...updatedUser, id: authUser?.id || updatedUser._id };
      dispatch(loginSuccess(nextUser));
      localStorage.setItem('loggedInUser', JSON.stringify(nextUser));
      setProfile((current) => ({ ...current, avatar: updatedUser.avatar || DEFAULT_AVATAR }));
      setEditBuffer((current) => ({ ...current, avatar: updatedUser.avatar || DEFAULT_AVATAR }));
      setAvatarMessage('Profile photo saved.');
    } catch (error) {
      setAvatarMessage(error.message || 'Could not upload profile photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLocalBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const localImageUrl = URL.createObjectURL(file);
      setEditBuffer(prev => ({ ...prev, banner: localImageUrl }));
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 relative overflow-x-hidden font-sans selection:bg-purple-500/30 selection:text-purple-200 pb-12">
      <input 
        type="file" 
        ref={avatarInputRef} 
        accept="image/jpeg,image/png,image/webp"
        disabled={isUploadingAvatar}
        className="hidden" 
        onChange={handleLocalAvatarChange} 
      />
      <input 
        type="file" 
        ref={bannerInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleLocalBannerChange} 
      />

      {/* Atmospheric Layout Elements */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-purple-950/15 via-blue-950/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-purple-600/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-cyan-600/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 relative z-10">

        {/* 1. HERO PROFILE HEADER HUB */}
        <div className="relative rounded-[24px] overflow-hidden bg-slate-950 border border-slate-800/80 shadow-2xl">
          {/* Cover Banner Area (Fallback verified URL checks) */}
          <div 
            className="h-48 sm:h-60 relative overflow-hidden bg-cover bg-center transition-all duration-500 bg-slate-900"
            style={{ backgroundImage: `url(${(isEditing ? editBuffer.banner : profile.banner) || DEFAULT_BANNER})` }}
          >
            <motion.div variants={pulseGlow} animate="animate" className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(0,0,0,0.4),transparent_70%)]" />
            {isEditing && (
              <button 
                onClick={() => bannerInputRef.current.click()}
                className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white/90 font-medium text-sm hover:bg-black/60 transition-colors group cursor-pointer"
              >
                <Upload className="w-5 h-5 group-hover:scale-110 transition-transform text-purple-400" />
                <span>Upload Cover Image</span>
              </button>
            )}
          </div>
          
          <div className="px-6 sm:px-8 pb-8 relative flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
            {/* Avatar Cluster Container */}
            <div className="relative group flex-shrink-0 mx-auto md:mx-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 opacity-75 blur-md" />
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-950 bg-slate-900 z-10">
                <img 
                  src={(isEditing ? editBuffer.avatar : profile.avatar) || DEFAULT_AVATAR} 
                  alt="Avatar Frame" 
                  className="w-full h-full object-cover"
                />
                {isEditing && (
                  <button 
                    onClick={() => avatarInputRef.current.click()}
                    className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 cursor-pointer transition-opacity hover:bg-black/80"
                  >
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>{isUploadingAvatar ? 'SAVING' : 'UPLOAD'}</span>
                  </button>
                )}
              </div>
              {avatarMessage && <p role="status" className="relative z-10 mt-3 max-w-[12rem] text-center text-[10px] text-slate-300">{avatarMessage}</p>}
            </div>

            {/* Profile Text Display / Fields Grid */}
            <div className="flex-1 space-y-3 text-center md:text-left pt-2 md:pt-4 w-full">
              {!isEditing ? (
                <>
                  <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                    <h1 className="text-4xl font-bold tracking-tight text-white sidebar-font">{profile.name}</h1>
                    <CheckCircle className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                    <GradientBadge color="purple">{profile.tier}</GradientBadge>
                  </div>
                  <p className="text-slate-300  text-base font-medium ">@{profile.username}</p>
                  <p className="text-slate-300 max-w-xl text-sm sm:text-base leading-relaxed mx-auto md:mx-0">
                    {profile.bio}
                  </p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs sm:text-sm text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-purple-400" /> Joined March 2024</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-cyan-400" /> {profile.location}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-400" /> <strong className="text-white">14.2k</strong> Following</span>
                  </div>
                </>
              ) : (
                <div className="space-y-3 pt-4 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Channel Name</label>
                      <input 
                        type="text"
                        value={editBuffer.name}
                        onChange={(e) => setEditBuffer(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Username</label>
                      <input 
                        type="text"
                        value={editBuffer.username}
                        onChange={(e) => setEditBuffer(p => ({ ...p, username: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Account bio</label>
                    <textarea 
                      value={editBuffer.bio}
                      onChange={(e) => setEditBuffer(p => ({ ...p, bio: e.target.value }))}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Location</label>
                      <input 
                        type="text"
                        value={editBuffer.location}
                        onChange={(e) => setEditBuffer(p => ({ ...p, location: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Badge</label>
                      <select 
                        value={editBuffer.tier}
                        onChange={(e) => setEditBuffer(p => ({ ...p, tier: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option>Premium Pass</option>
                        <option>Standard Tier Node</option>
                        <option>Core Developer Account</option>
                        <option>VIP Guest Matrix</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Triggers Grid Matrix */}
            <div className="flex flex-row md:flex-col sm:flex-row gap-2.5 w-full md:w-auto pt-4 md:pt-0 flex-shrink-0">
              {!isEditing ? (
                <>
                  <button 
                    onClick={startEditing}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  <button 
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all whitespace-nowrap cursor-pointer ${isFollowing ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {isFollowing ? 'Account Active' : 'Activate Account'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={saveProfile}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-sm font-medium hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Cancel Sync
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. MAIN HUB TWO-COLUMN RESPONSIVE GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT CONTENT AREA */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* GRID STATUS METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {statItems.map((item, idx) => (
                <GlassCard key={idx} className="p-4 flex flex-col justify-between min-h-[100px]">
                  <div className={`p-2 rounded-xl max-w-max ${item.bg}`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 font-medium truncate">{item.label}</p>
                    <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">{item.val}</h3>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* CURATED RECOMMENDATIONS CONTENT */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Suggested Media Pipeline
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommendations.map((rec, idx) => (
                  <GlassCard key={idx} className="relative overflow-hidden group flex flex-col justify-between h-40 p-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-800/80 rounded text-slate-300 border border-slate-700/50">
                          {rec.type}
                        </span>
                        <rec.icon className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-slate-100 group-hover:text-white line-clamp-2 text-sm leading-snug">
                        {rec.title}
                      </h4>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <span>{rec.meta}</span>
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* SUBSCRIPTIONS PIPELINE HUB */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Active Channel Syncs
              </h2>
              <AnimatePresence mode="popLayout">
                {subs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-scroll scrollbar-none">
                    {subs.map((sub) => (
                      <motion.div
                        key={sub.id}
                        layout
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      >
                        <GlassCard className="p-3 flex flex-col justify-between h-full gap-4">
                          <div className="flex gap-3 items-center">
                            <img src={sub.img} alt={sub.name} className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700/40 flex-shrink-0" />
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <h3 className="font-bold text-sm text-white truncate">{sub.name}</h3>
                              <p className="text-[11px] text-slate-400 font-medium">{sub.subs} subscribers</p>
                              <p className="text-[11px] text-purple-300 truncate pt-0.5">
                                <span className="text-slate-500 font-normal">Latest:</span> {sub.upload}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 border-t border-slate-800/60 pt-3">
                            <button className="flex-1 py-1.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 flex items-center justify-center gap-1">
                              Visit <ExternalLink className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleUnsubscribe(sub.id)}
                              className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-medium text-rose-300 flex items-center justify-center gap-1"
                            >
                              <UserMinus className="w-3 h-3" /> Drop
                            </button>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-900/20 border border-slate-800/50 rounded-[24px]">
                    <p className="text-slate-400 text-sm">All channel sync nodes dropped.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* RIGHT SIDEBAR PANELS */}
          <div className="space-y-6">
            
            {/* TERMINAL PREFERENCES CONTROL PANEL */}
            <GlassCard className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-base text-slate-200">Terminal Control Layout</h3>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-slate-300">Operational Theme</h4>
                  <p className="text-[11px] text-slate-500">Visual runtime workspace</p>
                </div>
                <button 
                  onClick={() => setIsDark(!isDark)}
                  className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 text-xs font-medium"
                >
                  {isDark ? <Moon className="w-3.5 h-3.5 text-purple-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Media Frame Target</label>
                <select 
                  value={quality} 
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60"
                >
                  <option>2160p Cinematic (4K)</option>
                  <option>1080p Ultra</option>
                  <option>720p</option>
                  <option>480p</option>
                  <option>Auto</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300">AI Vector Strength</label>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">{aiLevel}%</span>
                </div>
                <input 
                  type="range" min="10" max="100" value={aiLevel} 
                  onChange={(e) => setAiLevel(Number(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500 border border-slate-800" 
                />
              </div>
            </GlassCard>

            {/* NOTIFICATION ROUTING MANAGERS */}
            <GlassCard className="p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-base text-slate-200">System Notification Routes</h3>
              </div>
              <div className="divide-y divide-slate-800/40 space-y-3">
                {notificationRows.map((row, i) => (
                  <div key={row.key} className={`flex items-center justify-between gap-4 ${i > 0 ? 'pt-3' : ''}`}>
                    <div className="space-y-0.5">
                      <label className="text-xs font-semibold text-slate-200">{row.label}</label>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{row.desc}</p>
                    </div>
                    <AnimatedToggle checked={settings[row.key]} onChange={() => toggleNotification(row.key)} />
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* TIER ACCOMPLISHMENTS WIDGET */}
            <GlassCard className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-base text-slate-200">Tier Core Accomplishments</h3>
              </div>
              <div className="space-y-3 max-h-72 overflow-scroll scrollbar-none">
                {badges.map((badge, idx) => {
                  const isComplete = badge.progress === 100;
                  return (
                    <div key={idx} className="bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl space-y-2">
                      <div className="flex gap-2.5 items-center">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${badge.bg}`}>
                          <badge.icon className={`w-4 h-4 ${badge.col}`} />
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <h4 className="font-bold text-slate-200 text-xs truncate">{badge.title}</h4>
                          <p className="text-[10px] text-slate-500 truncate">{badge.desc}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-semibold">
                          <span className={isComplete ? 'text-emerald-400' : 'text-purple-400'}>{badge.status}</span>
                          <span className="text-slate-500">{badge.progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${badge.progress}%` }}
                            className={`h-full rounded-full bg-gradient-to-r ${isComplete ? 'from-emerald-500 to-teal-400' : 'from-purple-500 to-blue-500'}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

          </div>
        </div>
      </div>
    </div>
  );
}