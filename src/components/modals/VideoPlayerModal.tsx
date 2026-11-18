import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { ACTION_BTN_BASE } from '../../constants/buttonStyles';

export const VideoPlayerModal: React.FC = () => {
  const { activeVideoPlayer, setActiveVideoPlayer, handleUpdateVideoProgress } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const { setSheetElement, backdropRef, animateClose } = useBottomSheetMotion({
    onClose: () => {
      setIsPlaying(false);
      setActiveVideoPlayer(null);
    },
  });

  const totalSeconds = activeVideoPlayer?.durationSeconds || 1440; // Default 24 mins

  // Sync state when activeVideoPlayer opens
  useEffect(() => {
    if (activeVideoPlayer) {
      const watched = activeVideoPlayer.watchedSeconds !== undefined
        ? activeVideoPlayer.watchedSeconds
        : Math.round(((activeVideoPlayer.watchProgress || 0) / 100) * totalSeconds);
      setCurrentSeconds(watched);
      setIsPlaying(false);
    }
  }, [activeVideoPlayer, totalSeconds]);

  // Video playback ticker simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && activeVideoPlayer) {
      interval = setInterval(() => {
        setCurrentSeconds((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            handleUpdateVideoProgress(activeVideoPlayer.id, 100, true, totalSeconds);
            return totalSeconds;
          }
          const nextSec = prev + 1;
          const prog = Math.round((nextSec / totalSeconds) * 100);
          handleUpdateVideoProgress(
            activeVideoPlayer.id,
            prog,
            prog >= 100,
            nextSec
          );
          return nextSec;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, activeVideoPlayer, totalSeconds, handleUpdateVideoProgress]);

  if (!activeVideoPlayer) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = Math.min(100, Math.round((currentSeconds / totalSeconds) * 100));
  const isCompleted = activeVideoPlayer.isWatchedCompleted || progressPct >= 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentSeconds(val);
    const pct = Math.round((val / totalSeconds) * 100);
    handleUpdateVideoProgress(
      activeVideoPlayer.id,
      pct,
      pct >= 100,
      val
    );
  };

  const handleTogglePlay = () => {
    if (currentSeconds >= totalSeconds) {
      setCurrentSeconds(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleMarkComplete = () => {
    setCurrentSeconds(totalSeconds);
    setIsPlaying(false);
    handleUpdateVideoProgress(activeVideoPlayer.id, 100, true, totalSeconds);
  };

  const handleReset = () => {
    setCurrentSeconds(0);
    setIsPlaying(false);
    handleUpdateVideoProgress(activeVideoPlayer.id, 0, false, 0);
  };

  return (
    <div
      ref={backdropRef}
      data-modal-sheet-backdrop="true"
      className="animate-ui-fade fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print"
    >
      <div
        ref={setSheetElement}
        className="bg-[#121316] text-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-white/10 flex flex-col animate-modal-sheet"
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-[#18191D] border-b border-white/5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                MP4 Video
              </span>
              <span className="text-xs text-gray-400">
                {activeVideoPlayer.classCode} · {activeVideoPlayer.subject}
              </span>
            </div>
            <h3 className="text-base font-bold text-white truncate mt-0.5">
              {activeVideoPlayer.title}
            </h3>
          </div>
          <button
            onClick={animateClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Canvas / Player Viewport */}
        <div className="relative aspect-video bg-black flex flex-col items-center justify-center overflow-hidden group">
          {/* Ambient Background Simulation */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-950/60 via-black to-slate-900/50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 shadow-lg">
              {isPlaying ? (
                <div className="flex items-center gap-1.5 h-6">
                  <span className="w-1 h-6 bg-rose-400 rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-rose-300 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-5 bg-rose-400 rounded-full animate-pulse delay-150" />
                </div>
              ) : (
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              )}
            </div>

            <h4 className="text-sm font-semibold text-white/90 max-w-md">
              {activeVideoPlayer.title}
            </h4>
            <p className="text-xs text-white/50 max-w-sm mt-1">
              {activeVideoPlayer.unitName} · {activeVideoPlayer.author}
            </p>

            {/* Current Watch State Badge */}
            <div className="mt-4">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sudah Ditonton Sampai Habis (100%)</span>
                </span>
              ) : progressPct > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sedang Ditonton ({progressPct}%) · Belum Habis</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 text-xs font-semibold border border-slate-500/40">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Belum Ditonton (0%)</span>
                </span>
              )}
            </div>
          </div>

          {/* Bottom Player Overlay Bar */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 space-y-2">
            {/* Interactive Progress Bar Slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={totalSeconds}
                value={currentSeconds}
                onChange={handleSliderChange}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePlay}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <span className="font-mono text-gray-300">
                  {formatTime(currentSeconds)} / {formatTime(totalSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-medium">
                  Progress: <strong className="text-white">{progressPct}%</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Detail & Quick Progress Actions */}
        <div className="p-4 sm:p-5 bg-[#18191D] border-t border-white/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status Pemutaran Video
              </div>
              <div className="text-sm text-gray-200 mt-0.5">
                {isCompleted
                  ? 'Video materi ini telah diselesaikan sampai menit terakhir.'
                  : `Tonton materi video untuk merekam pemahaman. Sisa durasi: ${formatTime(totalSeconds - currentSeconds)}`}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className={`${ACTION_BTN_BASE} flex-1 sm:flex-initial bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white`}
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">Ulang</span>
                <span className="hidden sm:inline">Ulang dari Awal</span>
              </button>

              <button
                onClick={handleMarkComplete}
                className={`${ACTION_BTN_BASE} flex-1 sm:flex-initial shadow-xs ${
                  isCompleted
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">{isCompleted ? 'Selesai' : 'Tandai'}</span>
                <span className="hidden sm:inline">
                  {isCompleted ? 'Sudah Selesai' : 'Tandai Selesai Ditonton (100%)'}
                </span>
              </button>
            </div>
          </div>

          {/* Description snippet */}
          <div className="text-xs text-gray-400 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
            {activeVideoPlayer.description}
          </div>
        </div>
      </div>
    </div>
  );
};
