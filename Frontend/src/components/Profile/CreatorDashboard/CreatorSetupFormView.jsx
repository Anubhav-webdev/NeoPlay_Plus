import { Camera, RefreshCw, Upload, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CreatorSetupFormView({
  step,
  setStep,
  displayName,
  setDisplayName,
  username,
  setUsername,
  setIsCustomUsername,
  handleRegenerateUsername,
  tagline,
  setTagline,
  about,
  setAbout,
  avatarPreview,
  handleAvatarSelect,
  wallpaperPreview,
  handleWallpaperSelect,
  handleSubmit,
  submitting,
  error,
}) {
  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {/* STEP 1: CHANNEL NAME & UNIQUE USERNAME */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1" htmlFor="channel-name">
              Channel Display Name <span className="text-cyan-400">*</span>
            </label>
            <input
              id="channel-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              minLength={2}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              placeholder="e.g. Pixel Crafters Studio"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-slate-200" htmlFor="creator-username">
                Unique Creator Handle <span className="text-cyan-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleRegenerateUsername}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" /> Auto-generate new ID
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-500 font-mono text-sm">@</span>
              <input
                id="creator-username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setIsCustomUsername(true);
                }}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-4 py-3 text-white font-mono text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                placeholder="username_uniqueid"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Unique channel ID automatically generated from your name and a unique hash.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={!displayName.trim() || !username.trim()}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next: Bio & Tagline <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: TAGLINE & ABOUT / BIO */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1" htmlFor="channel-tagline">
              Channel Tagline
            </label>
            <input
              id="channel-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={150}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 transition-all"
              placeholder="e.g. Crafting futuristic digital experiences & tutorials"
            />
            <p className="text-xs text-slate-400 mt-1">A short 1-line slogan displayed on your profile card.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1" htmlFor="channel-about">
              About / Bio
            </label>
            <textarea
              id="channel-about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 transition-all resize-none"
              placeholder="Tell your viewers what your channel is about, your schedule, or your background..."
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold hover:bg-cyan-500 transition-all"
            >
              Next: Profile Images <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AVATAR & WALLPAPER IMAGES */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Banner / Wallpaper Upload Slot */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Channel Wallpaper / Banner Image
            </label>
            <div
              className="relative w-full h-36 rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center group cursor-pointer hover:border-cyan-500/50 transition-all"
              onClick={() => document.getElementById('wallpaper-file-input').click()}
            >
              {wallpaperPreview ? (
                <img src={wallpaperPreview} alt="Wallpaper preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-1">
                  <Upload className="w-6 h-6 mx-auto text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-xs text-slate-400 block">Click to upload banner image</span>
                </div>
              )}
              <input
                id="wallpaper-file-input"
                type="file"
                accept="image/*"
                onChange={handleWallpaperSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Avatar Photo Upload Slot */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Avatar Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <div
                className="relative w-20 h-20 rounded-full border-2 border-dashed border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-all shrink-0"
                onClick={() => document.getElementById('avatar-file-input').click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-slate-500" />
                )}
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => document.getElementById('avatar-file-input').click()}
                  className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 text-slate-200 transition-colors"
                >
                  Choose Photo
                </button>
                <p className="text-xs text-slate-500 mt-1">Recommended: Square image 400x400px</p>
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-300 bg-red-950/40 p-3 rounded-lg border border-red-500/30">
              {error}
            </p>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-wait transition-all shadow-lg shadow-cyan-950"
            >
              {submitting ? 'Submitting Application...' : 'Complete & Submit Application'}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}