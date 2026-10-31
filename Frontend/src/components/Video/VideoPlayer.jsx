import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX,
  Maximize, Minimize, Repeat, Gauge, PictureInPicture2,
  Camera, Clapperboard, Bookmark,
  MoreVertical, Download
} from 'lucide-react';

export default function VideoDetail({ video, onPlaybackStart, onPlaybackProgress }) {
  const resolvedVideo = video || null;
  
  // ── Player Core States ───────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  
  // Flash actions require a unique identifier (like a timestamp) to re-trigger the animation every single click
  const [flashAction, setFlashAction] = useState(null);

  // ── UI States ────────────────────────────────────────────────────
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [isPiP, setIsPiP] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);

  // ── Player Elements Refs ──────────────────────────────────────────
  const playerContainerRef = useRef(null);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const speedMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const canvasRef = useRef(null);
  const lastProgressSaveRef = useRef(0);

  const videoSrc = typeof resolvedVideo?.src === 'string' ? resolvedVideo.src : '';

  useEffect(() => {
    lastProgressSaveRef.current = 0;
  }, [resolvedVideo?.id]);

  // ── Auto-hide Controls Logic ─────────────────────────────────────
  const hideControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !showSpeedMenu && !showMobileMenu) {
      controlsTimeoutRef.current = setTimeout(() => setControlsVisible(false), 2500);
    }
  }, [isPlaying, showSpeedMenu, showMobileMenu]);

  const handleMouseMove = () => {
    setControlsVisible(true);
    hideControlsTimeout();
  };

  // ── Unified Playback Toggle ──────────────────────────────────────
  const handleTogglePlay = useCallback(() => {
    const videoObj = videoRef.current;
    if (!videoObj) return;
    
    // We let the native element run the action; the event listeners below will handle updating state cleanly.
    if (videoObj.paused || videoObj.ended) {
      videoObj.play().catch(() => setIsPlaying(false));
    } else {
      videoObj.pause();
    }
  }, []);

  // ── Fast Forward / Rewind Mechanics ─────────────────────────────
  const handleSkip = useCallback((seconds) => {
    const videoObj = videoRef.current;
    if (!videoObj) return;
    
    let targetTime = Math.max(0, Math.min(videoObj.currentTime + seconds, videoObj.duration));
    videoObj.currentTime = targetTime;
    setCurrentTime(targetTime);
    
    // Using a key timestamp forces Framer Motion to unmount the old animation card and mount a brand new instance instantly.
    setFlashAction({
      type: seconds > 0 ? 'forward' : 'rewind',
      id: Date.now()
    });
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    const player = playerContainerRef.current;
    if (!player) return;

    if (!document.fullscreenElement) {
      player.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Auto-clear flash indicator cards safely
  useEffect(() => {
    if (!flashAction) return;
    const t = setTimeout(() => setFlashAction(null), 600);
    return () => clearTimeout(t);
  }, [flashAction]);

  // ── Outside Dropdown click catcher ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) setShowSpeedMenu(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) setShowMobileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Synchronize HTML Video Element Attributes ──────────────────
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.pause();
    if (videoSrc) videoEl.src = videoSrc;
    else videoEl.removeAttribute('src');
    videoEl.load();
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setBookmarks([]);
  }, [videoSrc]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.loop = isLooping;
    }
  }, [playbackRate, isLooping]);

  // Picture-in-Picture Hooks
  useEffect(() => {
    const videoObj = videoRef.current;
    if (!videoObj) return;
    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);
    videoObj.addEventListener('enterpictureinpicture', onEnterPiP);
    videoObj.addEventListener('leavepictureinpicture', onLeavePiP);
    return () => {
      videoObj.removeEventListener('enterpictureinpicture', onEnterPiP);
      videoObj.removeEventListener('leavepictureinpicture', onLeavePiP);
    };
  }, []);

  // Fullscreen State Sync Hook
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      
      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'arrowright':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'm':
          setIsMuted(m => !m);
          break;
        case 'f':
          handleToggleFullscreen();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleSkip, handleToggleFullscreen]);

  const handleWheel = (e) => {
    if (isFullscreen) e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    setVolume(v => Math.min(1, Math.max(0, parseFloat((v + delta).toFixed(2)))));
    setIsMuted(false);
  };

  const handleTimelineScrub = (e) => {
    const videoObj = videoRef.current;
    if (!videoObj) return;
    const t = parseFloat(e.target.value);
    videoObj.currentTime = t;
    setCurrentTime(t);
  };

  const formatTime = (s) => {
    if (isNaN(s) || s < 0) return '00:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const handlePiP = async () => {
    const videoObj = videoRef.current;
    if (!videoObj) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoObj.requestPictureInPicture();
      }
    } catch (err) {
      console.error(err);
    }
    setShowMobileMenu(false);
  };

  const handleSnapshot = () => {
    const videoObj = videoRef.current;
    if (!videoObj) return;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = videoObj.videoWidth || 1280;
    canvas.height = videoObj.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoObj, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL('image/png');
    setSnapshotUrl(url);
    setShowMobileMenu(false);
  };

  const downloadSnapshot = () => {
    if (!snapshotUrl) return;
    const a = document.createElement('a');
    a.href = snapshotUrl;
    a.download = `snapshot-${formatTime(currentTime).replace(':', '-')}.png`;
    a.click();
    setSnapshotUrl(null);
  };

  const toggleBookmark = () => {
    const t = Math.floor(currentTime);
    setBookmarks(prev => {
      if (prev.includes(t)) return prev.filter(b => b !== t);
      return [...prev, t].sort((a, b) => a - b);
    });
    setShowMobileMenu(false);
  };

  const isBookmarked = bookmarks.includes(Math.floor(currentTime));
  const progressPct = (currentTime / (duration || 1)) * 100;

  return (
    <main className="w-full max-w-7xl mx-auto flex flex-col gap-2 selection:bg-teal-500/30 all-font">
      
      {/* ── Player Base Layer Window Container ─────────────────────────── */}
      <div 
        ref={playerContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && !showSpeedMenu && !showMobileMenu && setControlsVisible(false)}
        onWheel={handleWheel}
        className={`relative w-full overflow-hidden bg-zinc-950 border border-zinc-900 shadow-2xl transition-all duration-300 group/container
          ${isFullscreen ? 'h-screen w-screen rounded-none border-none fixed inset-0 z-50' : 'aspect-video rounded-2xl sm:rounded-3xl'}
          ${!controlsVisible ? 'cursor-none' : ''}
        `}
      >
        <canvas ref={canvasRef} className="hidden" />

        {/* Clean Media Hooks Sync State directly from native player components */}
        <video
          ref={videoRef}
          src={videoSrc || undefined}
          poster={resolvedVideo?.thumb}
          crossOrigin="anonymous"
          className="w-full h-full object-contain bg-black"
          onClick={handleTogglePlay}
          onDoubleClick={handleToggleFullscreen}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onTimeUpdate={(e) => {
            const { currentTime: playedSeconds, duration: totalSeconds } = e.currentTarget;
            setCurrentTime(playedSeconds);
            if (
              Number.isFinite(totalSeconds) && totalSeconds > 0 &&
              (playedSeconds - lastProgressSaveRef.current >= 15 ||
                (totalSeconds - playedSeconds <= 2 && totalSeconds - lastProgressSaveRef.current > 2))
            ) {
              lastProgressSaveRef.current = playedSeconds;
              onPlaybackProgress?.(Math.min(100, Math.round((playedSeconds / totalSeconds) * 100)));
            }
          }}
          onPlay={() => {
            setIsPlaying(true);
            onPlaybackStart?.();
            const player = videoRef.current;
            if (player && player.duration > 0) {
              lastProgressSaveRef.current = player.currentTime;
              onPlaybackProgress?.(Math.min(100, Math.round((player.currentTime / player.duration) * 100)));
            }
          }}
          onPause={(e) => {
            setIsPlaying(false);
            const player = e.currentTarget;
            if (player.duration > 0) {
              lastProgressSaveRef.current = player.currentTime;
              onPlaybackProgress?.(Math.min(100, Math.round((player.currentTime / player.duration) * 100)));
            }
          }}
          onEnded={() => {
            onPlaybackProgress?.(100);
            setIsPlaying(false);
          }}
          onWaiting={() => setIsBuffering(true)}
          onCanPlay={() => setIsBuffering(false)}
          onPlaying={() => setIsBuffering(false)}
        />

        {/* Loading Spinner Container Overlay */}
        <AnimatePresence>
          {isBuffering && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-[2px] pointer-events-none"
            >
              <div className="w-14 h-14 border-4 border-zinc-800 border-t-teal-400 rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed 10+ / 10- Skip Flash Alerts Animation Card */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {flashAction && (
              <motion.div 
                key={flashAction.id}
                initial={{ opacity: 0, scale: 0.5, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.2, y: -15 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="bg-zinc-950/80 border border-zinc-800/80 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-xl shadow-2xl"
              >
                {flashAction.type === 'forward' ? (
                  <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.4 }}><RotateCw className="h-5 w-5 text-teal-400" /></motion.div><span className=" text-sm font-bold text-zinc-100">+10s</span></>
                ) : (
                  <><motion.div animate={{ rotate: -360 }} transition={{ duration: 0.4 }}><RotateCcw className="h-5 w-5 text-teal-400" /></motion.div><span className=" text-sm font-bold text-zinc-100">-10s</span></>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Picture Frame Snapshot Canvas Previews */}
        <AnimatePresence>
          {snapshotUrl && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-4 right-4 z-50 flex flex-col gap-2 p-2 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl"
            >
              <img src={snapshotUrl} alt="snapshot" className="w-32 sm:w-44 rounded-lg object-cover aspect-video border border-zinc-800" />
              <div className="flex gap-1.5">
                <button
                  onClick={downloadSnapshot}
                  className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium bg-teal-500 hover:bg-teal-400 text-zinc-950 py-1.5 rounded-md transition-colors"
                >
                  <Download className="h-3 w-3" /> Save File
                </button>
                <button 
                  onClick={() => setSnapshotUrl(null)}
                  className="px-2.5 py-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Controls HUD Interface Wrapper */}
        <div 
          className={`absolute inset-0 flex flex-col justify-between z-20 transition-all duration-300 ${controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.9) 100%)' }}
        >
          {/* Top Title Utilities Area */}
          <div className="flex items-center justify-between p-4 sm:p-6 gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg">
                <Clapperboard className="h-4 w-4" />
              </div>
              <h1 className="text-sm font-medium text-zinc-100 truncate drop-shadow-md">
                {resolvedVideo?.title ?? "Video"}
              </h1>
            </div>

            {/* Desktop Settings Menu Panel */}
            <div className="hidden sm:flex items-center gap-2 bg-zinc-950/40 backdrop-blur-md border border-zinc-800/60 p-1 rounded-xl">
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-lg transition-all ${isBookmarked ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'}`}
                title="Bookmark frame"
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <button onClick={handleSnapshot} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 transition-colors" title="Snap frame">
                <Camera className="h-4 w-4" />
              </button>

              <button onClick={handlePiP} className={`p-2 rounded-lg transition-all ${isPiP ? 'bg-teal-500/20 text-teal-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'}`} title="Mini player">
                <PictureInPicture2 className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Actions Overlay Dropdown */}
            <div className="sm:hidden relative" ref={mobileMenuRef}>
              <button 
                onClick={() => setShowMobileMenu(m => !m)} 
                className="p-2.5 rounded-xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-zinc-200"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              <AnimatePresence>
                {showMobileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl p-1 shadow-2xl z-50 flex flex-col backdrop-blur-xl"
                  >
                    <button onClick={toggleBookmark} className="w-full text-left px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-lg flex items-center gap-2.5">
                      <Bookmark className="h-4 w-4 text-teal-400" /> {isBookmarked ? 'Remove Mark' : 'Add Bookmark'}
                    </button>
                    <button onClick={handleSnapshot} className="w-full text-left px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-lg flex items-center gap-2.5">
                      <Camera className="h-4 w-4 text-teal-400" /> Snap Frame
                    </button>
                    <button onClick={handlePiP} className="w-full text-left px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-lg flex items-center gap-2.5">
                      <PictureInPicture2 className="h-4 w-4 text-teal-400" /> Mini Player
                    </button>
                    <button onClick={() => { setIsLooping(l => !l); setShowMobileMenu(false); }} className="w-full text-left px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-lg flex items-center gap-2.5">
                      <Repeat className={`h-4 w-4 ${isLooping ? 'text-teal-400' : 'text-zinc-500'}`} /> Loop: {isLooping ? 'Active' : 'Disabled'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

         
          {/* Bottom Systems Core Playback Settings Toolbar */}
          <div className="flex flex-col gap-2 p-2 pt-8 sm:p-4 sm:pt-10 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent">
            
            {/* Timeline Progress Range Slider Track */}
            <div className="relative flex flex-col gap-1.5 group/timeline w-full ">
              <div className="relative h-2 w-full flex items-center">
                {bookmarks.map(b => (
                  <div
                    key={b}
                    className="absolute w-1.5 h-3 bg-amber-400 rounded-full z-30 pointer-events-none transform -translate-x-1/2 border border-zinc-950"
                    style={{ left: `${(b / (duration || 1)) * 100}%` }}
                  />
                ))}
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.05"
                  value={currentTime}
                  onChange={handleTimelineScrub}
                  className="w-full h-1 appearance-none cursor-pointer bg-transparent z-20 outline-none rounded-lg group-hover/timeline:h-1.5 transition-all accent-teal-400"
                  style={{
                    background: `linear-gradient(to right, #2dd4bf 0%, #2dd4bf ${progressPct}%, rgba(63, 63, 70, 0.6) ${progressPct}%, rgba(63, 63, 70, 0.6) 100%)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px]  font-medium text-zinc-400 px-0.5">
                <span className="text-teal-400">{formatTime(currentTime)}</span>
                <span>{bookmarks.length > 0 && `${bookmarks.length} marks · `}{formatTime(duration)}</span>
              </div>
            </div>

            {/* Core Action Operations Row */}
            <div className="flex items-center justify-between gap-4">
              
              {/* Left Side Control Blocks */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={() => handleSkip(-10)} className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors" title="Rewind 10 seconds">
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className={`p-2 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 text-xs font-semibold
                    ${isPlaying ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-teal-400 text-zinc-950 hover:bg-teal-300'}`}
                >
                  {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                </button>

                <button onClick={() => handleSkip(10)} className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors" title="Forward 10 seconds">
                  <RotateCw className="h-4 w-4" />
                </button>

              </div>

              {/* Right Side Control Blocks */}
              <div className="flex items-center gap-2">
                
                {/* Micro Sliding Expandable Audio Fader component */}
                <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 px-3 py-2 rounded-xl group/volume overflow-hidden max-w-[42px] hover:max-w-[160px] focus-within:max-w-[160px] transition-all duration-300 ease-out">
                  <button onClick={() => setIsMuted(m => !m)} className="text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0">
                    {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                    className="w-20 h-1 appearance-none cursor-pointer bg-zinc-700 accent-teal-400 rounded-lg opacity-0 group-hover/volume:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
                    style={{ background: `linear-gradient(to right, #2dd4bf 0%, #2dd4bf ${(isMuted ? 0 : volume) * 100}%, #4b5563 ${(isMuted ? 0 : volume) * 100}%, #4b5563 100%)` }}
                  />
                </div>

                {/* Playback Rate Option Panel context dropdown */}
                <div className="relative" ref={speedMenuRef}>
                  <button
                    onClick={() => setShowSpeedMenu(s => !s)}
                    className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs  transition-all ${showSpeedMenu || playbackRate !== 1 ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                  >
                    <Gauge className="h-4 w-4" />
                    <span className="font-bold hidden sm:inline">{playbackRate}x</span>
                  </button>
                  
                  <AnimatePresence>
                    {showSpeedMenu && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute bottom-full right-0 mb-2 w-32 bg-zinc-950 border border-zinc-800 rounded-xl p-1 shadow-2xl z-50 flex flex-col gap-0.5 backdrop-blur-xl"
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                          <button
                            key={rate}
                            onClick={() => { setPlaybackRate(rate); setShowSpeedMenu(false); }}
                            className={`w-full text-left px-2.5 py-2 text-xs  rounded-lg transition-colors ${playbackRate === rate ? 'bg-teal-400 text-zinc-950 font-bold' : 'text-zinc-400 hover:bg-zinc-900'}`}
                          >
                            {rate === 1 ? '1.0x Normal' : `${rate}x`}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Looping Control Button */}
                <button
                  onClick={() => setIsLooping(l => !l)}
                  className={`hidden sm:flex p-2 rounded-xl border items-center gap-1 transition-all ${isLooping ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                  <Repeat className="h-4 w-4" />
                </button>

                {/* Stage Window Screen Resize Trigger Button */}
                <button
                  onClick={handleToggleFullscreen}
                  className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-300 hover:text-teal-400 transition-colors"
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
