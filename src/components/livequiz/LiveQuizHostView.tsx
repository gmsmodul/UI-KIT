import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Flag,
  Flame,
  Gamepad2,
  LayoutDashboard,
  Link2,
  Monitor,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  UserX,
  Users,
  X,
} from 'lucide-react';
import type {
  LiveQuizAnswerResult,
  LiveQuizMode,
  LiveQuizRoomState,
  LiveQuizSessionReport,
  LiveQuizSettings,
} from '../../types';
import type { WsConnectionStatus } from '../../hooks/useLiveQuizSocket';
import { useApp } from '../../context/AppContext';
import {
  WAYGROUND_ARENA_SHELL,
  WAYGROUND_OPTION_TILES,
  WAYGROUND_TF_TILES,
} from '../../constants/waygroundTheme';
import { LiveQuizParticipantView } from './LiveQuizParticipantView';

interface LiveQuizHostViewProps {
  roomState: LiveQuizRoomState;
  connectionStatus: WsConnectionStatus;
  onUpdateSettings: (mode: LiveQuizMode, settings: LiveQuizSettings) => void;
  onKickParticipant: (participantId: string) => void;
  onStartGame: () => void;
  onEndGame: () => void;
  onLeave: () => void;
  fullWidth?: boolean;
  hostClientId?: string;
  previewRoomState?: LiveQuizRoomState | null;
  previewConnectionStatus?: WsConnectionStatus;
  previewLastAnswerResult?: LiveQuizAnswerResult | null;
  onJoinPreview?: (name?: string) => void;
  onLeavePreview?: () => void;
  onPreviewSubmitAnswer?: (
    questionId: string,
    payload: { selectedOptionIndex?: number; textAnswer?: string; timeTakenMs: number }
  ) => void;
  onPreviewReportTabSwitch?: () => void;
  onPreviewClearAnswerResult?: () => void;
}

export const LiveQuizHostView: React.FC<LiveQuizHostViewProps> = ({
  roomState,
  connectionStatus,
  onUpdateSettings,
  onKickParticipant,
  onStartGame,
  onEndGame,
  onLeave,
  fullWidth = false,
  hostClientId,
  previewRoomState,
  previewConnectionStatus = 'connected',
  previewLastAnswerResult = null,
  onJoinPreview,
  onLeavePreview,
  onPreviewSubmitAnswer,
  onPreviewReportTabSwitch,
  onPreviewClearAnswerResult,
}) => {
  const { triggerToast, handleExportLiveQuizReportCsv } = useApp();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'host' | 'split' | 'participant'>('host');
  const [activeHostTab, setActiveHostTab] = useState<'dashboard' | 'stage'>('dashboard');
  const [focusedQuestionIdx, setFocusedQuestionIdx] = useState<number>(0);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);
  const [pendingStartWithPreview, setPendingStartWithPreview] = useState<boolean>(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?page=livequiz&code=${roomState.code}`
      : '';

  useEffect(() => {
    if (!shareUrl) return;
    let active = true;
    QRCode.toDataURL(shareUrl, {
      width: 220,
      margin: 1,
      color: { dark: '#1C1D21', light: '#FFFFFF' },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [shareUrl]);

  // If user clicked "Mulai & Coba Kuis" in lobby, auto-start once tester participant connects
  useEffect(() => {
    if (
      pendingStartWithPreview &&
      previewRoomState &&
      previewRoomState.code === roomState.code &&
      roomState.status === 'lobby'
    ) {
      setPendingStartWithPreview(false);
      setViewLayout('split');
      onStartGame();
    }
  }, [pendingStartWithPreview, previewRoomState, roomState.code, roomState.status, onStartGame]);

  // Always land on Live Dashboard + Ranking Board when Host starts the quiz
  useEffect(() => {
    if (roomState.status === 'active') {
      setActiveHostTab('dashboard');
    }
  }, [roomState.status]);

  const hostQuestions = roomState.hostQuestions || [];
  const safeQuestionIdx = Math.min(focusedQuestionIdx, Math.max(0, hostQuestions.length - 1));
  const currentHostQuestion = hostQuestions[safeQuestionIdx];
  const currentQuestionStat = currentHostQuestion
    ? (roomState.questionStats || []).find((qs) => qs.questionId === currentHostQuestion.id)
    : undefined;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomState.code);
      triggerToast('Kode Disalin', `Kode ruangan ${roomState.code} disalin ke clipboard.`, 'success');
    } catch {
      triggerToast('Salin Manual', `Gunakan kode: ${roomState.code}`, 'info');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      triggerToast('Tautan Disalin', 'Buka tautan di tab atau perangkat lain untuk bergabung.', 'success');
    } catch {
      triggerToast('Tautan Gabung', shareUrl, 'info');
    }
  };

  const handleEnablePreview = () => {
    if (!onJoinPreview) return;
    if (!previewRoomState || previewRoomState.code !== roomState.code) {
      onJoinPreview('Kamu (Tester)');
    }
    setViewLayout('split');
  };

  const handleStartAndTryQuiz = () => {
    if (previewRoomState && previewRoomState.code === roomState.code) {
      setViewLayout('split');
      onStartGame();
      return;
    }
    if (onJoinPreview) {
      setPendingStartWithPreview(true);
      onJoinPreview('Kamu (Tester)');
      return;
    }
    onStartGame();
  };

  const buildCurrentReport = (): LiveQuizSessionReport => {
    const totalAttempts = roomState.participants.reduce((acc, p) => acc + p.answeredCount, 0);
    const totalCorrect = roomState.participants.reduce((acc, p) => acc + p.correctCount, 0);
    const avgAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    const sorted = [...roomState.participants].sort((a, b) => b.score - a.score);
    return {
      id: `LQR-${roomState.code}-${Date.now()}`,
      code: roomState.code,
      quizId: roomState.quizId,
      quizTitle: roomState.quizTitle,
      subject: roomState.subject,
      mode: roomState.mode,
      endedAt: roomState.endedAt || new Date().toLocaleString('id-ID'),
      totalQuestions: roomState.totalQuestions,
      participantCount: roomState.participants.length,
      avgAccuracy,
      topScorer: sorted[0]?.name,
      participants: sorted,
      questionStats: roomState.questionStats || [],
    };
  };

  const connectedCount = roomState.participants.filter((p) => p.connected).length;
  const finishedCount = roomState.participants.filter((p) => p.finished).length;
  const totalTabAlerts = roomState.participants.reduce((acc, p) => acc + p.tabSwitches, 0);
  const totalAnsweredAll = roomState.participants.reduce((acc, p) => acc + p.answeredCount, 0);
  const totalCorrectAll = roomState.participants.reduce((acc, p) => acc + p.correctCount, 0);
  const overallAccuracy = totalAnsweredAll > 0 ? Math.round((totalCorrectAll / totalAnsweredAll) * 100) : 0;

  const sortedParticipants = [...roomState.participants].sort(
    (a, b) => b.score - a.score || b.correctCount - a.correctCount || b.answeredCount - a.answeredCount
  );
  const topScore = Math.max(1, sortedParticipants[0]?.score || 1);
  const formattedCode = `${roomState.code.slice(0, 3)} ${roomState.code.slice(3)}`;
  const isPreviewActive = Boolean(previewRoomState && previewRoomState.code === roomState.code);

  const fullWidthHostUrl = `/?liveQuizHost=1&code=${encodeURIComponent(roomState.code)}${
    hostClientId ? `&hostKey=${encodeURIComponent(hostClientId)}` : ''
  }`;

  const arenaStageClass =
    fullWidth && !(isPreviewActive && viewLayout === 'split')
      ? 'min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_#4A1C59_0%,_#2A0E35_55%,_#1A0722_100%)] text-white flex flex-col'
      : WAYGROUND_ARENA_SHELL;

  const renderHostStage = () => (
    <div className={arenaStageClass}>
      {/* Top Wayground Host Control Header */}
      <div className="px-5 sm:px-6 lg:px-8 py-4 bg-[#1B0724]/85 border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-white/70">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-[#00C985]'
                    : connectionStatus === 'reconnecting'
                    ? 'bg-[#F59E0B] animate-pulse'
                    : 'bg-gray-400'
                }`}
              />
              Wayground Host
            </span>
            <span>·</span>
            <span>{roomState.subject}</span>
            <span>·</span>
            <span className="tabular-nums">{roomState.totalQuestions} Soal</span>
            <span>·</span>
            <span className="font-semibold text-[#FCD34D]">
              {roomState.mode === 'classic' ? 'Classic Mode' : 'Test Mode'}
            </span>
          </div>
          <h2 className="text-[19px] sm:text-[21px] font-bold text-white truncate">
            {roomState.quizTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!fullWidth && (
            <a
              href={fullWidthHostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-full bg-white/12 hover:bg-white/20 border border-white/15 text-white text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>Tab Baru Full-Width</span>
            </a>
          )}

          {!isPreviewActive && roomState.status !== 'ended' && onJoinPreview && (
            <button
              type="button"
              onClick={handleEnablePreview}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-full bg-[#8854C0] hover:bg-[#9B66D3] text-white text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Gamepad2 className="w-4 h-4 shrink-0" />
              <span>Coba sebagai Peserta</span>
            </button>
          )}

          {roomState.status === 'active' && (
            <button
              type="button"
              onClick={onEndGame}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-full bg-[#E53E51] hover:bg-[#CF2D40] text-white text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Flag className="w-4 h-4 shrink-0" />
              <span>Akhiri Kuis</span>
            </button>
          )}

          {roomState.status === 'ended' && (
            <button
              type="button"
              onClick={() => handleExportLiveQuizReportCsv(buildCurrentReport())}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Ekspor CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLeave}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-full bg-white/10 hover:bg-[#E53E51]/25 border border-white/15 hover:border-[#E53E51]/60 text-white text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 shrink-0" />
            <span>{roomState.status === 'ended' ? 'Kembali ke Hub' : 'Tutup Room'}</span>
          </button>
        </div>
      </div>

      {/* Arena Content */}
      <div className={`p-5 sm:p-6 ${fullWidth ? 'lg:px-8 flex-1' : ''} space-y-6`}>
        {/* PHASE 1: WAYGROUND PROJECTOR LOBBY */}
        {roomState.status === 'lobby' && (
          <div className="space-y-6">
            {/* Hero Join Card + QR Code */}
            <div className="rounded-2xl bg-[#16061E]/85 border border-white/15 p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
                <div className="space-y-1">
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-[#C4B5FD]">
                    Langkah 1 · Buka menu LiveQuiz di tab atau perangkat peserta
                  </div>
                  <div className="text-[13.5px] text-white/80">
                    Langkah 2 · Masukkan Kode Ruangan berikut atau scan QR Code di samping:
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <div className="px-6 py-3 rounded-2xl bg-[#2B1038] border border-white/20 text-[38px] sm:text-[46px] font-extrabold font-mono tabular-nums tracking-[0.18em] text-white leading-none shadow-inner">
                    {formattedCode}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-full bg-white/12 hover:bg-white/20 border border-white/15 text-white text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors"
                    >
                      <Copy className="w-4 h-4 shrink-0" />
                      <span>Salin Kode</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-full bg-[#8854C0] hover:bg-[#9B66D3] text-white text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors"
                    >
                      <Link2 className="w-4 h-4 shrink-0" />
                      <span>Salin Tautan</span>
                    </button>
                  </div>
                </div>

                {/* Primary Lobby Start Actions (Always Enabled!) */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={handleStartAndTryQuiz}
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#00C985] hover:bg-[#00B377] border-b-4 border-[#008C5C] text-[#05261A] text-[13.5px] font-bold whitespace-nowrap cursor-pointer transition-colors"
                  >
                    <Gamepad2 className="w-4 h-4 shrink-0" />
                    <span>Mulai &amp; Coba Kuis Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={onStartGame}
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-white text-[#1C1D21] hover:bg-white/90 border-b-4 border-white/60 text-[13.5px] font-bold whitespace-nowrap cursor-pointer transition-colors"
                  >
                    <Play className="w-4 h-4 shrink-0" />
                    <span>Mulai Kuis (Host Saja)</span>
                  </button>
                </div>
              </div>

              {/* Scannable QR Code */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center">
                <div className="p-3 rounded-2xl bg-white shadow-xl">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code untuk gabung Room ${roomState.code}`}
                      className="w-36 h-36 sm:w-40 sm:h-40 block"
                    />
                  ) : (
                    <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-xl bg-gray-100 flex items-center justify-center text-[#1C1D21] text-[12px] font-semibold">
                      Room {roomState.code}
                    </div>
                  )}
                </div>
                <span className="mt-2 text-[11.5px] text-white/70 font-medium">
                  Scan QR untuk gabung instan
                </span>
              </div>
            </div>

            {/* Settings & Mode Grid + Lobby Participants */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Mode & Options */}
              <div className="lg:col-span-5 rounded-2xl bg-[#16061E]/75 border border-white/12 p-5 space-y-4">
                <div className="text-[11.5px] font-bold uppercase tracking-wider text-white/65">
                  Mode &amp; Pengaturan Wayground
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings('classic', {
                        ...roomState.settings,
                        streakBonus: true,
                      })
                    }
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      roomState.mode === 'classic'
                        ? 'bg-[#8854C0]/35 border-[#C084FC] text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                      <Sparkles className="w-4 h-4 text-[#FCD34D]" />
                      <span>Classic</span>
                    </div>
                    <p className="text-[11.5px] text-white/70 mt-1 leading-snug">
                      Skor kecepatan, streak api, &amp; leaderboard langsung.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings('test', {
                        ...roomState.settings,
                        streakBonus: false,
                      })
                    }
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      roomState.mode === 'test'
                        ? 'bg-[#2F6DAE]/40 border-[#60A5FA] text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                      <ShieldCheck className="w-4 h-4 text-[#93C5FD]" />
                      <span>Test Mode</span>
                    </div>
                    <p className="text-[11.5px] text-white/70 mt-1 leading-snug">
                      Ujian fokus tanpa gamifikasi + monitor pindah tab.
                    </p>
                  </button>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  {[
                    {
                      key: 'shuffleQuestions' as const,
                      label: 'Acak Urutan Soal',
                      desc: 'Setiap sesi mengacak urutan pertanyaan.',
                    },
                    {
                      key: 'shuffleOptions' as const,
                      label: 'Acak Opsi Pilihan Ganda',
                      desc: 'Urutan pilihan A–D diacak otomatis.',
                    },
                    {
                      key: 'showExplanation' as const,
                      label: 'Tampilkan Pembahasan',
                      desc:
                        roomState.mode === 'classic'
                          ? 'Muncul setelah menjawab tiap soal.'
                          : 'Muncul saat sesi Test Mode diakhiri.',
                    },
                    ...(roomState.mode === 'classic'
                      ? [
                          {
                            key: 'streakBonus' as const,
                            label: 'Streak Bonus',
                            desc: 'Tambahan poin untuk jawaban benar beruntun.',
                          },
                        ]
                      : []),
                  ].map((opt) => {
                    const enabled = roomState.settings[opt.key];
                    return (
                      <label
                        key={opt.key}
                        className="flex items-center justify-between gap-3 py-1 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-white">{opt.label}</div>
                          <div className="text-[11.5px] text-white/60">{opt.desc}</div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          onClick={() =>
                            onUpdateSettings(roomState.mode, {
                              ...roomState.settings,
                              [opt.key]: !enabled,
                            })
                          }
                          className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer ${
                            enabled ? 'bg-[#00C985]' : 'bg-white/20'
                          }`}
                        >
                          <span
                            className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                              enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Joined Participants Arena */}
              <div className="lg:col-span-7 rounded-2xl bg-[#16061E]/75 border border-white/12 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-white">
                    <Users className="w-4 h-4 text-[#00C985]" />
                    <span className="tabular-nums">
                      Peserta di Lobi ({roomState.participants.length})
                    </span>
                  </div>
                  <span className="text-[12px] text-white/65">
                    Bisa langsung dimulai atau tunggu peserta lain
                  </span>
                </div>

                {roomState.participants.length === 0 ? (
                  <div className="py-10 text-center space-y-2.5 rounded-2xl border border-dashed border-white/15 bg-white/[0.03]">
                    <Users className="w-8 h-8 text-white/45 mx-auto" />
                    <div className="text-[14px] font-semibold text-white">
                      Belum ada peserta eksternal di lobi
                    </div>
                    <p className="text-[12.5px] text-white/65 max-w-md mx-auto">
                      Klik <strong className="text-[#6EE7B7]">Mulai &amp; Coba Kuis Sekarang</strong> untuk langsung mencoba layar Host &amp; Peserta, atau bagikan kode{' '}
                      <span className="font-mono font-bold text-white">{roomState.code}</span> ke peserta.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {roomState.participants.map((p) => {
                      const initials = p.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() || '')
                        .join('');
                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl border border-white/12 bg-white/8 flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${p.avatarColor}`}
                            >
                              {initials || 'U'}
                            </span>
                            <div className="min-w-0">
                              <div className="text-[13.5px] font-semibold text-white truncate">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-[#6EE7B7]">
                                {p.connected ? 'Terhubung' : 'Menghubungkan ulang'}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onKickParticipant(p.id)}
                            title={`Keluarkan ${p.name}`}
                            className="w-8 h-8 rounded-full hover:bg-[#E53E51]/25 text-white/60 hover:text-[#FDA4AF] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: ACTIVE WAYGROUND HOST SCREEN (Default: Dashboard & Papan Ranking Live) */}
        {roomState.status === 'active' && (
          <div className="space-y-5">
            {/* Top Sub-Tabs & Live Room PIN Strip */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1 bg-white/10 p-1 rounded-xl self-start">
                <button
                  type="button"
                  onClick={() => setActiveHostTab('dashboard')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeHostTab === 'dashboard'
                      ? 'bg-white text-[#1C1D21]'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard &amp; Ranking Live ({roomState.participants.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHostTab('stage')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeHostTab === 'stage'
                      ? 'bg-white text-[#1C1D21]'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Detail Soal ({hostQuestions.length})</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[12px] tabular-nums">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2B1038] hover:bg-[#3A164B] border border-white/20 text-white cursor-pointer transition-colors"
                  title="Salin kode ruangan untuk peserta susulan"
                >
                  <span className="text-white/65">PIN:</span>
                  <strong className="font-mono tracking-wider">{formattedCode}</strong>
                  <Copy className="w-3 h-3 text-white/70" />
                </button>
                <span className="px-3 py-1.5 rounded-full bg-[#00C985]/20 border border-[#00C985]/40 text-[#6EE7B7]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00C985] mr-1.5 align-middle animate-pulse" />
                  Live · <strong>{totalAnsweredAll}</strong> jawaban
                </span>
              </div>
            </div>

            {/* TAB A (DEFAULT): WAYGROUND HOST LIVE DASHBOARD + LIVE RANKING BOARD */}
            {activeHostTab === 'dashboard' && (
              <div className="space-y-5">
                {/* 4-Card Live Host Dashboard Telemetry */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="rounded-2xl bg-[#16061E]/85 border border-white/15 p-4 flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between text-[11.5px] text-white/65 font-medium">
                      <span>Peserta Aktif</span>
                      <Users className="w-4 h-4 text-[#C084FC]" />
                    </div>
                    <div className="flex items-baseline justify-between gap-2 tabular-nums">
                      <span className="text-[24px] font-bold text-white leading-none">
                        {connectedCount}
                        <span className="text-[14px] font-medium text-white/55">/{roomState.participants.length}</span>
                      </span>
                      <span className="text-[11.5px] font-semibold text-[#6EE7B7]">
                        {finishedCount} selesai
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#16061E]/85 border border-white/15 p-4 flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between text-[11.5px] text-white/65 font-medium">
                      <span>Akurasi Kelas Live</span>
                      <Award className="w-4 h-4 text-[#00C985]" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2 tabular-nums">
                        <span className="text-[24px] font-bold text-[#6EE7B7] leading-none">
                          {overallAccuracy}%
                        </span>
                        <span className="text-[11px] text-white/60">
                          {totalCorrectAll}/{totalAnsweredAll} benar
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#00C985] transition-all duration-300"
                          style={{ width: `${overallAccuracy}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#16061E]/85 border border-white/15 p-4 flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between text-[11.5px] text-white/65 font-medium">
                      <span>Progres Jawaban</span>
                      <BarChart3 className="w-4 h-4 text-[#60A5FA]" />
                    </div>
                    {(() => {
                      const expectedTotal = Math.max(1, roomState.participants.length * roomState.totalQuestions);
                      const completionPct =
                        roomState.participants.length > 0
                          ? Math.min(100, Math.round((totalAnsweredAll / expectedTotal) * 100))
                          : 0;
                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2 tabular-nums">
                            <span className="text-[24px] font-bold text-white leading-none">
                              {completionPct}%
                            </span>
                            <span className="text-[11px] text-white/60">
                              {totalAnsweredAll}/{roomState.participants.length * roomState.totalQuestions} item
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#60A5FA] transition-all duration-300"
                              style={{ width: `${completionPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {roomState.mode === 'test' ? (
                    <div className="rounded-2xl bg-[#16061E]/85 border border-white/15 p-4 flex flex-col justify-between gap-2">
                      <div className="flex items-center justify-between text-[11.5px] text-white/65 font-medium">
                        <span>Monitor Fokus (Test)</span>
                        <AlertTriangle
                          className={`w-4 h-4 ${totalTabAlerts > 0 ? 'text-[#FDA4AF]' : 'text-[#6EE7B7]'}`}
                        />
                      </div>
                      <div className="flex items-baseline justify-between gap-2 tabular-nums">
                        <span
                          className={`text-[24px] font-bold leading-none ${
                            totalTabAlerts > 0 ? 'text-[#FDA4AF]' : 'text-white'
                          }`}
                        >
                          {totalTabAlerts}
                        </span>
                        <span className="text-[11.5px] font-semibold text-white/70">
                          {totalTabAlerts > 0 ? 'Pindah tab terdeteksi' : 'Semua fokus'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#16061E]/85 border border-white/15 p-4 flex flex-col justify-between gap-2">
                      <div className="flex items-center justify-between text-[11.5px] text-white/65 font-medium">
                        <span>Peringkat #1 Saat Ini</span>
                        <Trophy className="w-4 h-4 text-[#FCD34D]" />
                      </div>
                      <div className="flex items-baseline justify-between gap-2 tabular-nums">
                        <span className="text-[24px] font-bold text-[#FCD34D] leading-none">
                          {(sortedParticipants[0]?.score || 0).toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11.5px] font-medium text-white/75 truncate max-w-[120px]">
                          {sortedParticipants[0]?.name || 'Menunggu'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Split: Live Ranking Board (Left 8 Cols) + Question Progress Monitor (Right 4 Cols) */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                  {/* LIVE RANKING BOARD */}
                  <div className="xl:col-span-8 rounded-2xl bg-[#16061E]/85 border border-white/15 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                        <Trophy className="w-4.5 h-4.5 text-[#FCD34D]" />
                        <span>
                          {roomState.mode === 'classic'
                            ? 'Papan Ranking Live'
                            : 'Monitor Peringkat & Progres Test Mode'}
                        </span>
                      </h3>
                      <span className="text-[12px] text-white/65 tabular-nums">
                        {sortedParticipants.length} peserta · Room {roomState.code}
                      </span>
                    </div>

                    {sortedParticipants.length === 0 ? (
                      <div className="p-10 text-center space-y-3">
                        <Users className="w-9 h-9 text-white/40 mx-auto" />
                        <div className="text-[14.5px] font-semibold text-white">
                          Menunggu peserta bergabung &amp; menjawab kuis
                        </div>
                        <p className="text-[12.5px] text-white/65 max-w-md mx-auto">
                          Bagikan PIN <span className="font-mono font-bold text-white">{roomState.code}</span> ke peserta. Peringkat dan skor akan bergerak otomatis secara real-time di sini.
                        </p>
                        {!isPreviewActive && onJoinPreview && (
                          <button
                            type="button"
                            onClick={handleEnablePreview}
                            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-[#8854C0] hover:bg-[#9B66D3] text-white text-[13px] font-medium cursor-pointer transition-colors"
                          >
                            <Gamepad2 className="w-4 h-4" />
                            <span>Coba sebagai Peserta</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-white/10">
                        {sortedParticipants.map((p, idx) => {
                          const pct =
                            roomState.totalQuestions > 0
                              ? Math.round((p.answeredCount / roomState.totalQuestions) * 100)
                              : 0;
                          const acc =
                            p.answeredCount > 0 ? Math.round((p.correctCount / p.answeredCount) * 100) : 0;
                          const scoreBarWidth = Math.max(
                            6,
                            Math.round((p.score / topScore) * 100)
                          );
                          const initials = p.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase() || '')
                            .join('');

                          return (
                            <div
                              key={p.id}
                              className={`px-5 py-3.5 space-y-2 transition-colors ${
                                idx === 0 && p.score > 0 ? 'bg-[#EDA92A]/[0.06]' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold tabular-nums shrink-0 ${
                                      idx === 0
                                        ? 'bg-[#EDA92A] text-[#241502]'
                                        : idx === 1
                                        ? 'bg-white/25 text-white'
                                        : idx === 2
                                        ? 'bg-[#D5546D]/75 text-white'
                                        : 'bg-white/10 text-white/75'
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>

                                  <span
                                    className={`w-8 h-8 rounded-full hidden sm:flex items-center justify-center text-[11px] font-bold shrink-0 ${p.avatarColor}`}
                                  >
                                    {initials || 'U'}
                                  </span>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[14px] font-semibold text-white truncate">
                                        {p.name}
                                      </span>
                                      {p.finished && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6EE7B7]">
                                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                          Selesai
                                        </span>
                                      )}
                                      {!p.connected && (
                                        <span className="text-[11px] font-medium text-white/50">
                                          (Terputus)
                                        </span>
                                      )}
                                      {roomState.mode === 'classic' && p.streak >= 2 && (
                                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#FCD34D] tabular-nums">
                                          <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                                          {p.streak}x streak
                                        </span>
                                      )}
                                      {roomState.mode === 'test' && p.tabSwitches > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FDA4AF] tabular-nums">
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          {p.tabSwitches}x pindah tab
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11.5px] text-white/65 tabular-nums">
                                      Progres {p.answeredCount}/{roomState.totalQuestions} ({pct}%) · {p.correctCount} benar (Akurasi {acc}%)
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0 tabular-nums">
                                  <div className="text-[16px] font-bold text-white">
                                    {p.score.toLocaleString('id-ID')}
                                  </div>
                                  <div className="text-[11px] text-white/60">poin</div>
                                </div>
                              </div>

                              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#8854C0] via-[#A855F7] to-[#00C985] transition-all duration-300"
                                  style={{ width: `${p.score > 0 ? scoreBarWidth : pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* COMPACT QUESTION PROGRESS MATRIX */}
                  <div className="xl:col-span-4 rounded-2xl bg-[#16061E]/85 border border-white/15 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-2">
                      <h3 className="text-[14.5px] font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#00C985]" />
                        <span>Progres per Soal</span>
                      </h3>
                      <span className="text-[11.5px] text-white/60 tabular-nums">
                        {hostQuestions.length} Soal
                      </span>
                    </div>

                    <div className="divide-y divide-white/10 max-h-[520px] overflow-y-auto">
                      {hostQuestions.map((hq, idx) => {
                        const qs = (roomState.questionStats || []).find((s) => s.questionId === hq.id);
                        const attempts = qs?.totalAttempts || 0;
                        const accuracy = qs?.accuracyPct || 0;
                        return (
                          <button
                            key={hq.id}
                            type="button"
                            onClick={() => {
                              setFocusedQuestionIdx(idx);
                              setActiveHostTab('stage');
                            }}
                            className="w-full text-left px-5 py-3 hover:bg-white/[0.04] transition-colors space-y-1.5 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2 tabular-nums">
                              <span className="text-[12.5px] font-semibold text-white">
                                Soal #{idx + 1}
                                <span className="ml-2 text-[11px] font-normal text-white/55">
                                  ({hq.points} pts)
                                </span>
                              </span>
                              <span
                                className={`text-[12px] font-bold ${
                                  attempts === 0
                                    ? 'text-white/50'
                                    : accuracy >= 70
                                    ? 'text-[#6EE7B7]'
                                    : accuracy >= 40
                                    ? 'text-[#FCD34D]'
                                    : 'text-[#FDA4AF]'
                                }`}
                              >
                                {attempts === 0 ? 'Belum ada' : `${accuracy}% benar`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    accuracy >= 70
                                      ? 'bg-[#00C985]'
                                      : accuracy >= 40
                                      ? 'bg-[#F59E0B]'
                                      : 'bg-[#E53E51]'
                                  }`}
                                  style={{ width: `${attempts > 0 ? accuracy : 0}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-white/60 tabular-nums shrink-0">
                                {attempts}/{roomState.participants.length} dijawab
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB A: PANGGUNG SOAL (Wayground Question Projection View) */}
            {activeHostTab === 'stage' && currentHostQuestion && (
              <div className="rounded-2xl bg-[#16061E]/85 border border-white/15 p-5 sm:p-6 space-y-5">
                {/* Question Navigator & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safeQuestionIdx === 0}
                      onClick={() => setFocusedQuestionIdx((i) => Math.max(0, i - 1))}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-35 flex items-center justify-center text-white cursor-pointer disabled:cursor-not-allowed transition-colors"
                      title="Soal Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[13.5px] font-bold text-white tabular-nums">
                      Pertanyaan {safeQuestionIdx + 1} / {hostQuestions.length}
                    </span>
                    <button
                      type="button"
                      disabled={safeQuestionIdx >= hostQuestions.length - 1}
                      onClick={() =>
                        setFocusedQuestionIdx((i) => Math.min(hostQuestions.length - 1, i + 1))
                      }
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-35 flex items-center justify-center text-white cursor-pointer disabled:cursor-not-allowed transition-colors"
                      title="Soal Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="hidden sm:flex items-center gap-1 ml-2">
                      {hostQuestions.map((hq, idx) => (
                        <button
                          key={hq.id}
                          type="button"
                          onClick={() => setFocusedQuestionIdx(idx)}
                          className={`w-7 h-7 rounded-lg text-[12px] font-bold tabular-nums cursor-pointer transition-colors ${
                            idx === safeQuestionIdx
                              ? 'bg-[#00C985] text-[#05261A]'
                              : 'bg-white/10 text-white/75 hover:bg-white/20'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-white/75 tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {currentHostQuestion.timeLimitSec}s · {currentHostQuestion.points} pts
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAnswerKey((prev) => !prev)}
                      className={`inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                        showAnswerKey
                          ? 'bg-[#00C985] text-[#05261A]'
                          : 'bg-white/10 hover:bg-white/20 border border-white/15 text-white'
                      }`}
                    >
                      {showAnswerKey ? (
                        <EyeOff className="w-4 h-4 shrink-0" />
                      ) : (
                        <Eye className="w-4 h-4 shrink-0" />
                      )}
                      <span>{showAnswerKey ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}</span>
                    </button>
                  </div>
                </div>

                {/* Projected Question Prompt */}
                <div className="rounded-2xl bg-[#240A30] border border-white/15 p-6 sm:p-8 text-center space-y-2">
                  <div className="text-[11.5px] font-semibold uppercase tracking-wider text-[#C4B5FD]">
                    {currentHostQuestion.type === 'multiple_choice'
                      ? 'Pilihan Ganda'
                      : currentHostQuestion.type === 'true_false'
                      ? 'Benar / Salah'
                      : 'Isian Singkat'}
                    {' · '}
                    <span className="tabular-nums">
                      {currentQuestionStat?.totalAttempts || 0} jawaban masuk ({currentQuestionStat?.accuracyPct || 0}% benar)
                    </span>
                  </div>
                  <h3 className="text-[19px] sm:text-[23px] font-semibold text-white leading-snug max-w-3xl mx-auto">
                    {currentHostQuestion.prompt}
                  </h3>
                </div>

                {/* Projected Wayground Option Tiles with Live Response Distribution */}
                {currentHostQuestion.type !== 'short_answer' ? (
                  <div
                    className={`grid gap-3 ${
                      currentHostQuestion.type === 'true_false'
                        ? 'grid-cols-1 sm:grid-cols-2'
                        : 'grid-cols-1 sm:grid-cols-2'
                    }`}
                  >
                    {currentHostQuestion.options.map((opt, oIdx) => {
                      const tile =
                        currentHostQuestion.type === 'true_false'
                          ? WAYGROUND_TF_TILES[oIdx % WAYGROUND_TF_TILES.length]
                          : WAYGROUND_OPTION_TILES[oIdx % WAYGROUND_OPTION_TILES.length];
                      const votes = currentQuestionStat?.optionCounts?.[oIdx] || 0;
                      const totalVotes = Math.max(1, currentQuestionStat?.totalAttempts || 0);
                      const votePct =
                        (currentQuestionStat?.totalAttempts || 0) > 0
                          ? Math.round((votes / totalVotes) * 100)
                          : 0;
                      const isCorrect = currentHostQuestion.correctOptionIndex === oIdx;

                      return (
                        <div
                          key={oIdx}
                          className={`rounded-2xl p-4 text-white relative overflow-hidden transition-all ${tile.bg} ${tile.borderBottom} ${
                            showAnswerKey
                              ? isCorrect
                                ? 'ring-3 ring-[#00C985] opacity-100'
                                : 'opacity-50'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 relative z-10">
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 ${tile.badgeBg}`}
                              >
                                {tile.letter}
                              </span>
                              <span className="text-[15px] font-semibold leading-snug break-words">
                                {opt}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 tabular-nums">
                              {showAnswerKey && isCorrect && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00C985] text-[#05261A] text-[11px] font-bold">
                                  <Check className="w-3 h-3" />
                                  Benar
                                </span>
                              )}
                              <span className="px-2.5 py-1 rounded-full bg-black/25 text-[12px] font-bold">
                                {votes} ({votePct}%)
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 h-1.5 rounded-full bg-black/20 overflow-hidden">
                            <div
                              className="h-full bg-white/85 rounded-full transition-all duration-300"
                              style={{ width: `${votePct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 border border-white/12 p-4 space-y-2">
                    <div className="text-[12px] font-semibold text-white/75">
                      Soal Isian Singkat —{' '}
                      <span className="tabular-nums">
                        {currentQuestionStat?.correctAttempts || 0}/{currentQuestionStat?.totalAttempts || 0} peserta menjawab benar
                      </span>
                    </div>
                    {showAnswerKey && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[12px] text-[#6EE7B7] font-semibold">Kunci Diterima:</span>
                        {(currentHostQuestion.acceptedAnswers || []).map((ans) => (
                          <span
                            key={ans}
                            className="px-3 py-1 rounded-full bg-[#00C985]/20 border border-[#00C985]/50 text-[#6EE7B7] text-[12.5px] font-bold"
                          >
                            {ans}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {showAnswerKey && currentHostQuestion.explanation && (
                  <div className="rounded-xl bg-[#00C985]/12 border border-[#00C985]/35 px-4 py-3 text-[13px] text-white/90">
                    <strong className="text-[#6EE7B7] mr-1.5">Pembahasan:</strong>
                    {currentHostQuestion.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PHASE 3: ENDED PODIUM & QUESTION BREAKDOWN */}
        {roomState.status === 'ended' && (
          <div className="space-y-6">
            {/* 4-Column Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-2xl bg-white/8 border border-white/12 p-4">
                <div className="text-[11.5px] text-white/65">Total Peserta</div>
                <div className="text-[24px] font-bold text-white tabular-nums mt-1">
                  {roomState.participants.length}
                </div>
              </div>
              <div className="rounded-2xl bg-white/8 border border-white/12 p-4">
                <div className="text-[11.5px] text-white/65">Selesai</div>
                <div className="text-[24px] font-bold text-white tabular-nums mt-1">
                  {finishedCount}/{roomState.participants.length}
                </div>
              </div>
              <div className="rounded-2xl bg-white/8 border border-white/12 p-4">
                <div className="text-[11.5px] text-white/65">Rata-rata Akurasi</div>
                <div className="text-[24px] font-bold text-[#6EE7B7] tabular-nums mt-1">
                  {overallAccuracy}%
                </div>
              </div>
              <div className="rounded-2xl bg-white/8 border border-white/12 p-4">
                <div className="text-[11.5px] text-white/65">Skor Tertinggi</div>
                <div className="text-[24px] font-bold text-[#FCD34D] tabular-nums mt-1">
                  {(sortedParticipants[0]?.score || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Classic 3-Tier Wayground Podium */}
            {sortedParticipants.length > 0 && (
              <div className="rounded-2xl bg-[#16061E]/85 border border-white/15 p-6">
                <div className="text-center mb-6 space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#FCD34D]">
                    <Trophy className="w-4 h-4" />
                    <span>Podium Wayground LiveQuiz</span>
                  </div>
                  <h3 className="text-[20px] sm:text-[22px] font-bold text-white">
                    Peraih Skor Tertinggi Sesi Ini
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto items-end">
                  {[1, 0, 2].map((rankIdx) => {
                    const p = sortedParticipants[rankIdx];
                    if (!p) return <div key={rankIdx} className="hidden sm:block" />;
                    const rank = rankIdx + 1;
                    const style =
                      rank === 1
                        ? 'sm:py-8 bg-gradient-to-b from-[#EDA92A]/35 to-[#EDA92A]/15 border-[#FCD34D]/60'
                        : rank === 2
                        ? 'sm:py-5 bg-gradient-to-b from-[#8854C0]/35 to-[#8854C0]/15 border-[#C084FC]/50'
                        : 'sm:py-4 bg-gradient-to-b from-[#2C9CA6]/35 to-[#2C9CA6]/15 border-[#5EEAD4]/50';
                    return (
                      <div
                        key={p.id}
                        className={`rounded-2xl border p-4 text-center space-y-1.5 ${style}`}
                      >
                        <div className="text-[12px] font-bold uppercase tracking-wider text-white/80 tabular-nums">
                          Peringkat #{rank}
                        </div>
                        <div className="text-[16px] font-bold text-white truncate">{p.name}</div>
                        <div className="text-[23px] font-extrabold text-white tabular-nums">
                          {p.score.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[11.5px] text-white/75 tabular-nums">
                          {p.correctCount}/{roomState.totalQuestions} benar · Streak {p.bestStreak}x
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Question-by-Question Accuracy Matrix */}
            <div className="rounded-2xl bg-[#16061E]/85 border border-white/15 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00C985]" />
                  <span>Analisis Akurasi per Pertanyaan</span>
                </h3>
              </div>
              <div className="divide-y divide-white/10">
                {(roomState.questionStats || []).map((qs, idx) => (
                  <div key={qs.questionId} className="px-5 py-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[13px] font-medium text-white">
                        <span className="font-bold text-white/55 mr-1.5 tabular-nums">#{idx + 1}</span>
                        {qs.prompt}
                      </span>
                      <span className="text-[13px] font-bold text-white tabular-nums shrink-0">
                        {qs.accuracyPct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            qs.accuracyPct >= 70
                              ? 'bg-[#00C985]'
                              : qs.accuracyPct >= 40
                              ? 'bg-[#F59E0B]'
                              : 'bg-[#E53E51]'
                          }`}
                          style={{ width: `${qs.accuracyPct}%` }}
                        />
                      </div>
                      <span className="text-[11.5px] text-white/65 tabular-nums shrink-0">
                        {qs.correctAttempts}/{qs.totalAttempts} benar
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={
        fullWidth
          ? isPreviewActive
            ? 'min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_#4A1C59_0%,_#2A0E35_55%,_#1A0722_100%)] text-white p-4 sm:p-6 space-y-4'
            : 'min-h-screen w-full'
          : 'space-y-4'
      }
    >
      {/* Split / Single View Switcher Strip when Host Tester Preview is Active */}
      {isPreviewActive && (
        <div
          className={`rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
            fullWidth
              ? 'bg-[#16061E]/85 border border-white/15 text-white'
              : 'bg-white border border-black/[0.07] text-[#4B4E57]'
          }`}
        >
          <div className={`text-[13px] font-medium ${fullWidth ? 'text-white/80' : 'text-[#4B4E57]'}`}>
            Mode Uji Coba Aktif — Tampilan{' '}
            <strong className={fullWidth ? 'text-white' : 'text-[#1C1D21]'}>Host</strong> &amp;{' '}
            <strong className={fullWidth ? 'text-white' : 'text-[#1C1D21]'}>Peserta</strong> tersinkron langsung via WebSocket.
          </div>

          <div
            className={`inline-flex items-center gap-1 p-1 rounded-xl ${
              fullWidth ? 'bg-white/10' : 'bg-[#F4F5F8]'
            }`}
          >
            <button
              type="button"
              onClick={() => setViewLayout('split')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors ${
                viewLayout === 'split'
                  ? 'bg-white text-[#1C1D21] shadow-xs'
                  : fullWidth
                  ? 'text-white/75 hover:text-white'
                  : 'text-[#6E717A] hover:text-[#1C1D21]'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Split Host + Peserta</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('host')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors ${
                viewLayout === 'host'
                  ? 'bg-white text-[#1C1D21] shadow-xs'
                  : fullWidth
                  ? 'text-white/75 hover:text-white'
                  : 'text-[#6E717A] hover:text-[#1C1D21]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Layar Host</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('participant')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors ${
                viewLayout === 'participant'
                  ? 'bg-white text-[#1C1D21] shadow-xs'
                  : fullWidth
                  ? 'text-white/75 hover:text-white'
                  : 'text-[#6E717A] hover:text-[#1C1D21]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Layar Peserta</span>
            </button>
          </div>
        </div>
      )}

      {/* Render Chosen Host / Split / Participant Layout */}
      {isPreviewActive && viewLayout === 'split' && previewRoomState ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <div className="xl:col-span-7">{renderHostStage()}</div>
          <div className="xl:col-span-5">
            <LiveQuizParticipantView
              embedded
              roomState={previewRoomState}
              connectionStatus={previewConnectionStatus}
              lastAnswerResult={previewLastAnswerResult}
              onSubmitAnswer={(qId, payload) => onPreviewSubmitAnswer?.(qId, payload)}
              onReportTabSwitch={() => onPreviewReportTabSwitch?.()}
              onClearAnswerResult={() => onPreviewClearAnswerResult?.()}
              onLeave={() => {
                onLeavePreview?.();
                setViewLayout('host');
              }}
            />
          </div>
        </div>
      ) : isPreviewActive && viewLayout === 'participant' && previewRoomState ? (
        <LiveQuizParticipantView
          embedded
          roomState={previewRoomState}
          connectionStatus={previewConnectionStatus}
          lastAnswerResult={previewLastAnswerResult}
          onSubmitAnswer={(qId, payload) => onPreviewSubmitAnswer?.(qId, payload)}
          onReportTabSwitch={() => onPreviewReportTabSwitch?.()}
          onClearAnswerResult={() => onPreviewClearAnswerResult?.()}
          onLeave={() => {
            onLeavePreview?.();
            setViewLayout('host');
          }}
        />
      ) : (
        renderHostStage()
      )}
    </div>
  );
};
