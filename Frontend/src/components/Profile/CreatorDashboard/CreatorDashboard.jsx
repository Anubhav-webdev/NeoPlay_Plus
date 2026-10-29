import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { useCreatorProfile, generateUniqueUsername } from './hooks/useCreatorProfile';
import CreatorStudioView from './CreatorStudioView';
import CreatorSetupFormView from './CreatorSetupFormView';

export default function CreatorDashboard() {
  const { user, initialized } = useSelector((state) => state.auth);
  const { creator, loading, submitting, error, handleFullApplication, checkStatus } = useCreatorProfile(user);

  // Setup Form Steps Engine State
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.name || user?.username || '');
  const [username, setUsername] = useState('');
  const [isCustomUsername, setIsCustomUsername] = useState(false);
  const [tagline, setTagline] = useState('');
  const [about, setAbout] = useState('');
  
  // Media Files
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [wallpaperFile, setWallpaperFile] = useState(null);
  const [wallpaperPreview, setWallpaperPreview] = useState('');

  // Auto-generate Unique Username when Display Name changes
  useEffect(() => {
    if (displayName.trim() && !isCustomUsername) {
      const generated = generateUniqueUsername(displayName);
      setUsername(generated);
    }
  }, [displayName, isCustomUsername]);

  const handleRegenerateUsername = () => {
    if (displayName.trim()) {
      setUsername(generateUniqueUsername(displayName));
      setIsCustomUsername(false);
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleWallpaperSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setWallpaperFile(file);
      setWallpaperPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleFullApplication({
      name: displayName,
      username,
      tagline,
      about,
      avatarFile,
      wallpaperFile,
    });
  };

  if (!initialized) {
    return <main className="mx-auto max-w-3xl p-8 text-center text-slate-300">Checking your account...</main>;
  }

  if (!user) return <Navigate to="/signup" replace />;

  if (loading) {
    return <main className="mx-auto max-w-3xl p-8 text-center text-slate-300">Loading creator account...</main>;
  }

  if (creator?.applicationStatus === 'approved') {
    return <CreatorStudioView creator={creator} user={user} />;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-white font-sans">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
        
        {/* HEADER & STATUS INDICATOR */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Creator Studio Setup</p>
            <h1 className="mt-1 text-2xl font-bold">Build Your Channel Profile</h1>
          </div>
          {creator?.applicationStatus !== 'pending' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
              <span>Step {step} of 3</span>
            </div>
          )}
        </div>

        {/* PENDING / SUSPENDED STATE VIEWS */}
        {creator?.applicationStatus === 'pending' ? (
          <div className="mt-8 space-y-6 text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 animate-pulse">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">Application Under Review</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Your application for <strong className="text-cyan-300">@{creator.username || creator.displayName}</strong> is waiting for admin approval. Content uploading will be unlocked automatically upon approval.
              </p>
            </div>
            <button
              type="button"
              onClick={checkStatus}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-950"
            >
              <RefreshCw className="w-4 h-4" /> Check Application Status
            </button>
          </div>
        ) : creator?.applicationStatus === 'suspended' ? (
          <p className="mt-8 text-sm text-amber-300 bg-amber-950/30 border border-amber-500/30 p-4 rounded-xl">
            This creator account is currently suspended. Contact support for assistance.
          </p>
        ) : (
          <CreatorSetupFormView
            step={step}
            setStep={setStep}
            displayName={displayName}
            setDisplayName={setDisplayName}
            username={username}
            setUsername={setUsername}
            setIsCustomUsername={setIsCustomUsername}
            handleRegenerateUsername={handleRegenerateUsername}
            tagline={tagline}
            setTagline={setTagline}
            about={about}
            setAbout={setAbout}
            avatarPreview={avatarPreview}
            handleAvatarSelect={handleAvatarSelect}
            wallpaperPreview={wallpaperPreview}
            handleWallpaperSelect={handleWallpaperSelect}
            handleSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
        )}
      </section>
    </main>
  );
}