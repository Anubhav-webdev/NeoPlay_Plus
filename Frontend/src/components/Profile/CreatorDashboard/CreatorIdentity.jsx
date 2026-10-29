import { motion } from 'framer-motion';
import { Edit2, Sliders, UploadCloud } from 'lucide-react';

export default function IdentitySuite({ 
  channelIdentity, 
  setChannelIdentity, 
  isEditingProfileText, 
  setIsEditingProfileText, 
  wallpaperInputRef, 
  avatarInputRef, 
  executeProfileImageUpload,
  onSaveProfile,
  isSavingProfile = false,
  isUploadingProfileImage = false,
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-[32px] overflow-hidden relative shadow-2xl"
    >
      {/* Wallpaper Media Slot */}
      <div className="h-40 sm:h-52 w-full relative group bg-transparent overflow-hidden">
        {channelIdentity.wallpaper ? (
          <img src={channelIdentity.wallpaper} alt="Creator channel banner" className="h-full w-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div aria-hidden="true" className="h-full w-full bg-gradient-to-br from-purple-950 via-slate-900 to-cyan-950" />
        )}
        <div className="absolute inset-0 " />
        <button
          type="button"
          aria-label="Change creator channel banner"
          disabled={isUploadingProfileImage}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-950/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 disabled:cursor-wait"
          onClick={() => wallpaperInputRef.current?.click()}
        >
          <Sliders className="w-5 h-5 text-purple-400 mr-2" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">{isUploadingProfileImage ? "Saving profile image..." : "Modify Studio Wallpaper"}</span>
        </button>
        <input type="file" ref={wallpaperInputRef} accept="image/jpeg,image/png,image/webp" disabled={isUploadingProfileImage} onChange={(e) => executeProfileImageUpload(e, "wallpaper")} className="hidden" />
      </div>

      {/* Profile Details Layout */}
      <div className="p-6 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 -mt-10 sm:-mt-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative group z-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] overflow-hidden border-4 border-slate-950 bg-slate-900 shadow-2xl relative ring-2 ring-purple-500/20 transition-all duration-300 group-hover:ring-purple-500/60">
              {channelIdentity.avatar ? (
                <img src={channelIdentity.avatar} alt="Creator profile photo" className="h-full w-full object-cover" />
              ) : (
                <div aria-hidden="true" className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-400">
                  {(channelIdentity.name || 'C').trim().charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                aria-label="Change creator profile photo"
                disabled={isUploadingProfileImage}
                className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-950/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 disabled:cursor-wait"
                onClick={() => avatarInputRef.current?.click()}
              >
                <UploadCloud className="w-5 h-5 text-white" />
              </button>
            </div>
            <input type="file" ref={avatarInputRef} accept="image/jpeg,image/png,image/webp" disabled={isUploadingProfileImage} onChange={(e) => executeProfileImageUpload(e, "avatar")} className="hidden" />
          </div>

          <div className="pt-2 sm:pt-6">
            {isEditingProfileText ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 max-w-sm">
                <input type="text" value={channelIdentity.name} onChange={(e) => setChannelIdentity({ ...channelIdentity, name: e.target.value })} className="bg-slate-950 border border-slate-800 text-sm px-3 py-1.5 rounded-xl text-white w-full focus:outline-none focus:border-purple-500 transition-colors" placeholder="Creator Name" />
                <input type="text" value={channelIdentity.username} readOnly className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-xl text-slate-500 w-full focus:outline-none" aria-label="Account handle" />
                <input type="text" maxLength={160} value={channelIdentity.tagline} onChange={(e) => setChannelIdentity({ ...channelIdentity, tagline: e.target.value })} className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-xl text-purple-400 w-full focus:outline-none focus:border-purple-500 transition-colors" placeholder="Tagline" />
                <textarea maxLength={2000} value={channelIdentity.about} onChange={(e) => setChannelIdentity({ ...channelIdentity, about: e.target.value })} className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-xl text-slate-400 w-full focus:outline-none focus:border-purple-500 transition-colors resize-none h-16" placeholder="About" />
                <button type="button" onClick={onSaveProfile} disabled={isSavingProfile || isUploadingProfileImage} className="bg-purple-600 hover:bg-purple-500 px-4 py-1.5 text-[10px] uppercase tracking-widest font-black text-white rounded-xl transition-all disabled:opacity-60">{isSavingProfile ? "Saving..." : "Save Profile"}</button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-white sidebar-font tracking-wider">{channelIdentity.name}</h2>
                  {channelIdentity.isVerified && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[9px] px-2 py-0.5 font-bold uppercase rounded-md tracking-widest">Creator</span>}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{channelIdentity.username}</p>
                <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">{channelIdentity.about}</p>
                <p className="text-xs text-purple-400 font-semibold mt-1.5 tracking-wide">{channelIdentity.tagline}</p>
              </motion.div>
            )}
          </div>
        </div>

        <button disabled={isSavingProfile || isUploadingProfileImage} onClick={() => setIsEditingProfileText(!isEditingProfileText)} className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-purple-300 border border-slate-800/80 hover:border-purple-500/40 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 self-end sm:self-center shadow-inner">
          <Edit2 className="w-3.5 h-3.5" />Edit Profile
        </button>
      </div>
    </motion.div>
  );
}
