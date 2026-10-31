import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX,
  Maximize, Minimize, Gauge, Lock, Unlock, Subtitles, Settings, Clapperboard,
  DotIcon, SlidersHorizontal, PictureInPicture2
} from 'lucide-react';

export default function VideoDetail({ video, onPlaybackStart, onPlaybackProgress }) {
  const resolvedVideo = video || {};

  // Default Quality list if backend/props are missing
  const defaultQualities = [
    { label: 'Auto', src: '' },
    { label: '1080p', src: '' },
    { label: '720p', src: '' },
    { label: '480p', src: '' },
    { label: '360p', src: '' }
  ];

  const availableQualities = resolvedVideo?.qualities?.length > 0 
    ? resolvedVideo.qualities 
    : defaultQualities;

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  // Settings & Subtitle States
  const [selectedQuality, setSelectedQuality] = useState(availableQualities[0].label);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('main'); // 'main' | 'speed' | 'quality'

  // Dynamic Overlay states
  const [flashAction, setFlashAction] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);

  // References
  const playerContainerRef = useRef(null);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const lastProgressSaveRef = useRef(0);

  const activeQualityObj = availableQualities.find(q => q.label === selectedQuality);
  const videoSrc = activeQualityObj?.src || resolvedVideo?.src || '';

  // Auto-hide controls handler
  const hideControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !showSettingsMenu && !isLocked) {
      controlsTimeoutRef.current = setTimeout(() => setControlsVisible(false), 2500);
    }
  }, [isPlaying, showSettingsMenu, isLocked]);

  const handleMouseMove = () => {
    setControlsVisible(true);
    hideControlsTimeout();
  };

  // Playback Operations
  const handleTogglePlay = useCallback(() => {
    if (isLocked) return;
    const videoObj = videoRef.current;
    if (!videoObj) return;

    if (videoObj.paused || videoObj.ended) {
      videoObj.play().catch(() => setIsPlaying(false));
    } else {
      videoObj.pause();
    }
  }, [isLocked]);

  const handleSkip = useCallback((seconds) => {
    if (isLocked) return;
    const videoObj = videoRef.current;
    if (!videoObj) return;

    const targetTime = Math.max(0, Math.min(videoObj.currentTime + seconds, videoObj.duration));
    videoObj.currentTime = targetTime;
    setCurrentTime(targetTime);

    setFlashAction({
      type: seconds > 0 ? 'forward' : 'rewind',
      id: Date.now()
    });
  }, [isLocked]);

  // Fullscreen & Mobile Auto-Landscape Orientation Lock
  const handleToggleFullscreen = async () => {
    const el = playerContainerRef.current;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }

        // Lock mobile screen orientation to landscape
        if (window.screen?.orientation?.lock) {
          await window.screen.orientation.lock('landscape').catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }

        if (window.screen?.orientation?.unlock) {
          window.screen.orientation.unlock();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Picture-in-Picture (Popout / Miniplayer) Toggle
  const handleTogglePiP = async () => {
    const videoObj = videoRef.current;
    if (!videoObj) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && videoObj !== document.pictureInPictureElement) {
        await videoObj.requestPictureInPicture();
      }
    } catch (err) {
      console.error('Picture-in-Picture failed:', err);
    }
  };

  // Subtitles Switch Handler
  const toggleCaptions = () => {
    const videoObj = videoRef.current;
    const nextState = !captionsEnabled;
    setCaptionsEnabled(nextState);

    if (videoObj && videoObj.textTracks.length > 0) {
      videoObj.textTracks[0].mode = nextState ? 'showing' : 'hidden';
    }
  };

  // Quality Change Handler
  const handleQualityChange = (qualityLabel) => {
    const videoObj = videoRef.current;
    const preserveTime = videoObj ? videoObj.currentTime : currentTime;
    const wasPlaying = videoObj ? !videoObj.paused : false;

    setSelectedQuality(qualityLabel);
    setShowSettingsMenu(false);

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = preserveTime;
        if (wasPlaying) videoRef.current.play();
      }
    }, 50);
  };

  // Sync HTML Video Element
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.volume = volume;
    videoEl.muted = isMuted;
    videoEl.playbackRate = playbackRate;
  }, [volume, isMuted, playbackRate]);

  // Sync Picture-in-Picture Events
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleEnterPiP = () => setIsPiP(true);
    const handleLeavePiP = () => setIsPiP(false);

    videoEl.addEventListener('enterpictureinpicture', handleEnterPiP);
    videoEl.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      videoEl.removeEventListener('enterpictureinpicture', handleEnterPiP);
      videoEl.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  // Sync Fullscreen State
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || isLocked) return;

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
        case 'p':
          handleTogglePiP();
          break;
        case 'c':
          toggleCaptions();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleSkip, isLocked]);

  // Flash Clear
  useEffect(() => {
    if (!flashAction) return;
    const t = setTimeout(() => setFlashAction(null), 600);
    return () => clearTimeout(t);
  }, [flashAction]);

  // Outer Click Catch
  useEffect(() => {
    const handler = (e) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target)) {
        setShowSettingsMenu(false);
        setActiveTab('main');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatTime = (s) => {
    if (isNaN(s) || s < 0) return '00:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const progressPct = (currentTime / (duration || 1)) * 100;

  return (
    <main className="w-full max-w-7xl mx-auto flex flex-col gap-2 select-none">
      
      {/* Player Container - Mobile Fullscreen Optimized */}
      <div 
        ref={playerContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && !showSettingsMenu && setControlsVisible(false)}
        className={`relative w-full overflow-hidden bg-black border border-zinc-900 shadow-2xl transition-all duration-300 group/container
          ${isFullscreen 
            ? 'fixed inset-0 z-50 h-screen w-screen rounded-none border-none max-w-none flex items-center justify-center bg-black' 
            : 'aspect-video rounded-2xl sm:rounded-3xl'
          }
          ${!controlsVisible ? 'cursor-none' : ''}
        `}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          poster={resolvedVideo?.thumb}
          crossOrigin="anonymous"
          className="w-full h-full object-contain bg-black"
          onClick={handleTogglePlay}
          onDoubleClick={handleToggleFullscreen}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onTimeUpdate={(e) => {
            const playedSeconds = e.currentTarget.currentTime;
            const totalSeconds = e.currentTarget.duration;
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
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            onPlaybackProgress?.(100);
            setIsPlaying(false);
          }}
          onWaiting={() => setIsBuffering(true)}
          onCanPlay={() => setIsBuffering(false)}
          onPlaying={() => setIsBuffering(false)}
        >
          {resolvedVideo?.captionsSrc && (
            <track
              kind="subtitles"
              src={resolvedVideo.captionsSrc}
              srcLang={resolvedVideo.captionsLang || 'en'}
              label={resolvedVideo.captionsLabel || 'English'}
              default={captionsEnabled}
            />
          )}
        </video>

        {/* Buffering Spinner */}
        <AnimatePresence>
          {isBuffering && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-[2px] pointer-events-none"
            >
              <div className="w-12 h-12 border-4 border-zinc-800 border-t-teal-400 rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fast Skip Animation */}
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
                  <><RotateCw className="h-5 w-5 text-teal-400" /><span className="text-sm font-bold text-zinc-100">+10s</span></>
                ) : (
                  <><RotateCcw className="h-5 w-5 text-teal-400" /><span className="text-sm font-bold text-zinc-100">-10s</span></>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Unlock Button when Locked */}
        {isLocked && (
          <div className="absolute top-4 right-4 z-40">
            <button
              onClick={() => setIsLocked(false)}
              className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 backdrop-blur-md transition-all hover:scale-105"
              title="Unlock Controls"
            >
              <Lock className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Player Controls Interface */}
        <div 
          className={`absolute inset-0 flex flex-col justify-between z-20 transition-all duration-300 ${
            controlsVisible && !isLocked ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.9) 100%)' }}
        >
          {/* Top Title Bar */}
          <div className="flex items-center justify-between p-4 sm:p-6 gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg">
                <Clapperboard className="h-4 w-4" />
              </div>
              <h1 className="text-sm font-medium text-zinc-100 truncate drop-shadow-md">
                {resolvedVideo?.title ?? "Video"}
              </h1>
            </div>

            {/* Screen Lock Button */}
            <button
              onClick={() => setIsLocked(true)}
              className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Lock Controls"
            >
              <Unlock className="h-4 w-4" />
            </button>
          </div>

          {/* Bottom Controls Bar */}
          <div className="flex flex-col gap-2 p-3 sm:p-4 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent">
            
            {/* Timeline Bar */}
            <div className="relative flex flex-col gap-1.5 group/timeline w-full">
              <div className="relative h-2 w-full flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => {
                    const videoObj = videoRef.current;
                    if (!videoObj) return;
                    const t = parseFloat(e.target.value);
                    videoObj.currentTime = t;
                    setCurrentTime(t);
                  }}
                  className="w-full h-1 appearance-none cursor-pointer bg-transparent z-20 outline-none rounded-lg group-hover/timeline:h-1.5 transition-all accent-teal-400"
                  style={{
                    background: `linear-gradient(to right, #2dd4bf 0%, #2dd4bf ${progressPct}%, rgba(63, 63, 70, 0.6) ${progressPct}%, rgba(63, 63, 70, 0.6) 100%)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-medium text-zinc-400 px-0.5">
                <span className="text-teal-400">{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Core Action Operations Row */}
            <div className="flex items-center justify-between gap-4">
              
              {/* Left Group: Playback & Volume */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={() => handleSkip(-10)} className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className={`p-2 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 text-xs font-semibold
                    ${isPlaying ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-teal-400 text-zinc-950 hover:bg-teal-300'}`}
                >
                  {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                </button>

                <button onClick={() => handleSkip(10)} className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
                  <RotateCw className="h-4 w-4" />
                </button>

                {/* Volume Slider */}
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
              </div>

              {/* Right Group: CC, Settings (Quality & Speed), Miniplayer (PiP), Fullscreen */}
              <div className="flex items-center gap-2">
                
                {/* Settings Popup (Quality, CC & Speed) */}
                <div className="relative" ref={settingsMenuRef}>
                  <button
                    onClick={() => {
                      setShowSettingsMenu(s => !s);
                      setActiveTab('main');
                    }}
                    className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs transition-all ${
                      showSettingsMenu || playbackRate !== 1 || selectedQuality !== 'Auto'
                        ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Settings"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-[10px] font-bold hidden sm:inline">{selectedQuality}</span>
                  </button>
                  
                  <AnimatePresence>
                    {showSettingsMenu && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute bottom-full right-0 mb-2 w-44 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 backdrop-blur-xl"
                      >
                        {activeTab === 'main' && (
                          <>
                            <button
                              onClick={() => setActiveTab('quality')}
                              className="w-full text-left px-2.5 py-2 text-xs text-zinc-300 hover:bg-zinc-900 rounded-lg flex items-center justify-between"
                            >
                              <span className="flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5 text-teal-400" /> Quality</span>
                              <span className="text-[10px] text-teal-400 font-bold">{selectedQuality}</span>
                            </button>

                            <button
                              onClick={toggleCaptions}
                              className="w-full text-left px-2.5 py-2 text-xs text-zinc-300 hover:bg-zinc-900 rounded-lg flex items-center justify-between"
                            >
                              <span className="flex items-center gap-1.5"><Subtitles className="h-4 w-4" /> CC</span>
                              <span className={`p-1 rounded-xl border transition-all ${
                                captionsEnabled 
                                  ? 'bg-teal-500/70 border-teal-500/30 text-teal-400' 
                                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                              }`}>
                                <DotIcon className="h-1 w-1" />
                              </span>
                            </button>

                            <button
                              onClick={() => setActiveTab('speed')}
                              className="w-full text-left px-2.5 py-2 text-xs text-zinc-300 hover:bg-zinc-900 rounded-lg flex items-center justify-between"
                            >
                              <span className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-teal-400" /> Speed</span>
                              <span className="text-[10px] text-teal-400 font-bold">{playbackRate}x</span>
                            </button>
                          </>
                        )}

                        {activeTab === 'quality' && (
                          <div className="flex flex-col gap-0.5">
                            {availableQualities.map(q => (
                              <button
                                key={q.label}
                                onClick={() => handleQualityChange(q.label)}
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                                  selectedQuality === q.label ? 'bg-teal-400 text-zinc-950 font-bold' : 'text-zinc-400 hover:bg-zinc-900'
                                }`}
                              >
                                {q.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {activeTab === 'speed' && (
                          <div className="flex flex-col gap-0.5">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                              <button
                                key={rate}
                                onClick={() => { setPlaybackRate(rate); setShowSettingsMenu(false); }}
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                                  playbackRate === rate ? 'bg-teal-400 text-zinc-950 font-bold' : 'text-zinc-400 hover:bg-zinc-900'
                                }`}
                              >
                                {rate === 1 ? '1.0x Normal' : `${rate}x`}
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Picture-in-Picture / Popout Button */}
                <button
                  onClick={handleTogglePiP}
                  className={`p-2 rounded-xl border transition-all ${
                    isPiP 
                      ? 'bg-teal-500/20 border-teal-500/30 text-teal-400' 
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:text-teal-400'
                  }`}
                  title="Popout / Miniplayer"
                >
                  <PictureInPicture2 className="h-4 w-4" />
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={handleToggleFullscreen}
                  className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-300 hover:text-teal-400 transition-colors"
                  title="Fullscreen"
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