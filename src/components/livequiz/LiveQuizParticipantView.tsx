import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  LogOut,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import type {
  LiveQuizAnswerResult,
  LiveQuizRoomState,
} from '../../types';
import type { WsConnectionStatus } from '../../hooks/useLiveQuizSocket';
import {
  WAYGROUND_ARENA_SHELL,
  WAYGROUND_OPTION_TILES,
  WAYGROUND_TF_TILES,
} from '../../constants/waygroundTheme';

interface LiveQuizParticipantViewProps {
  roomState: LiveQuizRoomState;
  connectionStatus: WsConnectionStatus;
  lastAnswerResult: LiveQuizAnswerResult | null;
  onSubmitAnswer: (
    questionId: string,
    payload: { selectedOptionIndex?: number; textAnswer?: string; timeTakenMs: number }
  ) => void;
  onReportTabSwitch: () => void;
  onClearAnswerResult: () => void;
  onLeave: () => void;
  embedded?: boolean;
}

const ShapeGlyph: React.FC<{ shape: 'diamond' | 'circle' | 'square' | 'triangle' }> = ({ shape }) => {
  if (shape === 'diamond') {
    return (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true">
        <polygon points="8,1 15,8 8,15 1,8" />
      </svg>
    );
  }
  if (shape === 'circle') {
    return (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true">
        <circle cx="8" cy="8" r="6" />
      </svg>
    );
  }
  if (shape === 'square') {
    return (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true">
        <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true">
      <polygon points="8,2 15,14 1,14" />
    </svg>
  );
};

export const LiveQuizParticipantView: React.FC<LiveQuizParticipantViewProps> = ({
  roomState,
  connectionStatus,
  lastAnswerResult,
  onSubmitAnswer,
  onReportTabSwitch,
  onClearAnswerResult,
  onLeave,
  embedded = false,
}) => {
  const questions = roomState.questionsForParticipant || [];
  const reviewQuestions = roomState.reviewQuestions || [];
  const me = roomState.participants.find((p) => p.id === roomState.participantId);
  const answeredCount = me?.answeredCount || 0;

  const [currentIndex, setCurrentIndex] = useState<number>(answeredCount);
  const [textInput, setTextInput] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [tabWarningBanner, setTabWarningBanner] = useState(false);

  const questionStartRef = useRef<number>(Date.now());
  const submittedForQuestionRef = useRef<string | null>(null);
  const submitAnswerRef = useRef(onSubmitAnswer);
  submitAnswerRef.current = onSubmitAnswer;
  const clearResultRef = useRef(onClearAnswerResult);
  clearResultRef.current = onClearAnswerResult;

  const activeQuestion = questions[currentIndex];

  // Keep index synced if reconnecting mid-quiz
  useEffect(() => {
    if (roomState.status === 'active' && currentIndex < answeredCount) {
      setCurrentIndex(answeredCount);
    }
  }, [roomState.status, answeredCount, currentIndex]);

  // Auto-dismiss compact answer feedback toast after 2.5s without blocking gameplay
  useEffect(() => {
    if (!lastAnswerResult) return;
    const timeoutId = window.setTimeout(() => {
      clearResultRef.current();
    }, 2500);
    return () => window.clearTimeout(timeoutId);
  }, [lastAnswerResult?.questionId]);

  // Reset per-question countdown when moving to a new question
  useEffect(() => {
    if (roomState.status !== 'active' || !activeQuestion) return;
    questionStartRef.current = Date.now();
    submittedForQuestionRef.current = null;
    setTextInput('');
    setTimeLeft(activeQuestion.timeLimitSec);

    const timer = window.setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - questionStartRef.current) / 1000);
      const remaining = Math.max(0, activeQuestion.timeLimitSec - elapsedSec);
      setTimeLeft(remaining);
      if (remaining === 0 && submittedForQuestionRef.current !== activeQuestion.id) {
        submittedForQuestionRef.current = activeQuestion.id;
        window.clearInterval(timer);
        clearResultRef.current();
        submitAnswerRef.current(activeQuestion.id, {
          selectedOptionIndex: -1,
          textAnswer: '',
          timeTakenMs: activeQuestion.timeLimitSec * 1000,
        });
        setCurrentIndex((prev) => prev + 1);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [roomState.status, activeQuestion?.id]);

  // Test Mode tab-switch detection (disabled in embedded host self-test preview so host tab switches don't false-trigger)
  useEffect(() => {
    if (embedded || roomState.mode !== 'test' || roomState.status !== 'active' || me?.finished) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarningBanner(true);
        onReportTabSwitch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [embedded, roomState.mode, roomState.status, me?.finished, onReportTabSwitch]);

  const handleSelectOption = (oIdx: number) => {
    if (!activeQuestion || submittedForQuestionRef.current === activeQuestion.id) {
      return;
    }
    submittedForQuestionRef.current = activeQuestion.id;
    const elapsedMs = Date.now() - questionStartRef.current;
    clearResultRef.current();
    submitAnswerRef.current(activeQuestion.id, {
      selectedOptionIndex: oIdx,
      timeTakenMs: elapsedMs,
    });
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSubmitShortAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !activeQuestion ||
      !textInput.trim() ||
      submittedForQuestionRef.current === activeQuestion.id
    ) {
      return;
    }
    submittedForQuestionRef.current = activeQuestion.id;
    const elapsedMs = Date.now() - questionStartRef.current;
    clearResultRef.current();
    submitAnswerRef.current(activeQuestion.id, {
      textAnswer: textInput.trim(),
      timeTakenMs: elapsedMs,
    });
    setTextInput('');
    setCurrentIndex((prev) => prev + 1);
  };

  const sortedParticipants = [...roomState.participants].sort(
    (a, b) => b.score - a.score || b.correctCount - a.correctCount
  );
  const myRank = Math.max(1, sortedParticipants.findIndex((p) => p.id === roomState.participantId) + 1);
  const myInitials = (me?.name || 'P')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const timePct =
    activeQuestion && activeQuestion.timeLimitSec > 0
      ? Math.max(0, Math.min(100, (timeLeft / activeQuestion.timeLimitSec) * 100))
      : 100;

  return (
    <div className={`${WAYGROUND_ARENA_SHELL} ${embedded ? '' : 'max-w-4xl mx-auto'}`}>
      {/* Top Countdown Timer Strip during active question */}
      {roomState.status === 'active' && !me?.finished && activeQuestion && (
        <div className="h-1.5 w-full bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              timePct > 50 ? 'bg-[#00C985]' : timePct > 25 ? 'bg-[#F59E0B]' : 'bg-[#E53E51]'
            }`}
            style={{ width: `${timePct}%` }}
          />
        </div>
      )}

      {/* Wayground Top HUD */}
      <div className="px-4 sm:px-6 py-3.5 bg-[#1B0724]/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[11.5px] font-bold shrink-0 ring-2 ring-white/20 ${
              me?.avatarColor || 'bg-[#D6D4FF] text-[#3F3B99]'
            }`}
          >
            {myInitials || 'P'}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold text-white truncate">
                {me?.name || 'Peserta'}
              </span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  connectionStatus === 'connected' ? 'bg-[#00C985]' : 'bg-[#F59E0B] animate-pulse'
                }`}
                title={connectionStatus === 'connected' ? 'Terhubung' : 'Menghubungkan ulang'}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px] text-white/65 tabular-nums">
              <span>Room {roomState.code}</span>
              <span>·</span>
              <span>{roomState.mode === 'classic' ? 'Classic' : 'Test Mode'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 tabular-nums">
          {roomState.status === 'active' && roomState.mode === 'classic' && (
            <>
              {(me?.streak || 0) >= 2 && (
                <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full bg-[#EDA92A]/20 border border-[#EDA92A]/40 text-[#FCD34D] text-[12px] font-bold">
                  <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>{me?.streak}x</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/10 text-[12.5px] font-bold text-white">
                <Trophy className="w-3.5 h-3.5 text-[#FCD34D]" />
                <span>{(me?.score || 0).toLocaleString('id-ID')}</span>
              </span>
              <span className="hidden sm:inline-flex items-center h-8 px-2.5 rounded-full bg-white/10 text-[12px] font-semibold text-white/85">
                #{myRank}
              </span>
            </>
          )}

          <button
            type="button"
            onClick={onLeave}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full bg-white/10 hover:bg-[#E53E51]/25 border border-white/15 hover:border-[#E53E51]/60 text-white text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{embedded ? 'Tutup Uji Coba' : 'Keluar'}</span>
          </button>
        </div>
      </div>

      {/* Main Arena Body */}
      <div className="p-4 sm:p-6">
        {/* 1. LOBBY WAITING SCREEN */}
        {roomState.status === 'lobby' && (
          <div className="py-6 sm:py-10 max-w-xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#8854C0]/35 border border-[#C084FC]/40 text-[#F3E8FF] mx-auto shadow-lg">
              {roomState.mode === 'classic' ? (
                <Sparkles className="w-8 h-8" />
              ) : (
                <ShieldCheck className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-2">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[#C4B5FD]">
                {embedded ? 'Mode Uji Coba Peserta' : 'Ruang Tunggu Wayground Live'}
              </div>
              <h2 className="text-[22px] sm:text-[26px] font-bold text-white leading-tight">
                {roomState.quizTitle}
              </h2>
              <p className="text-[13.5px] text-white/75">
                {roomState.subject} · {roomState.totalQuestions} Pertanyaan ·{' '}
                {roomState.mode === 'classic'
                  ? 'Classic Mode (Skor Kecepatan & Streak)'
                  : 'Test Mode (Fokus Ujian)'}
              </p>
            </div>

            <div className="rounded-2xl bg-[#16061E]/85 border border-white/15 p-5 space-y-2">
              <div className="text-[15px] font-semibold text-[#00C985]">
                Kamu sudah berhasil masuk!
              </div>
              <p className="text-[13px] text-white/75">
                Menunggu Host menekan tombol <strong className="text-white">Mulai Kuis</strong>...
              </p>
              <div className="pt-2 inline-flex items-center gap-2 text-[12.5px] text-white/80 tabular-nums">
                <Users className="w-4 h-4 text-[#C084FC]" />
                <span>{roomState.participants.length} peserta bergabung di ruangan ini</span>
              </div>
            </div>

            {roomState.participants.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {roomState.participants.map((p) => {
                  const isMe = p.id === roomState.participantId;
                  return (
                    <span
                      key={p.id}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border ${
                        isMe
                          ? 'bg-[#00C985]/20 border-[#00C985]/60 text-[#6EE7B7]'
                          : 'bg-white/10 border-white/15 text-white/85'
                      }`}
                    >
                      {p.name}
                      {isMe ? ' (Kamu)' : ''}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. ACTIVE GAMEPLAY */}
        {roomState.status === 'active' && !me?.finished && activeQuestion && (
          <div className="space-y-5">
            {tabWarningBanner && roomState.mode === 'test' && (
              <div className="p-3.5 rounded-2xl bg-[#E53E51]/20 border border-[#E53E51]/50 text-[#FECDD3] text-[12.5px] font-medium flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Perpindahan tab terdeteksi dalam Test Mode dan dilaporkan ke Host.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTabWarningBanner(false)}
                  className="text-[12px] font-semibold underline shrink-0 cursor-pointer"
                >
                  Mengerti
                </button>
              </div>
            )}

            {/* Question Meta Row */}
            <div className="flex items-center justify-between gap-3 text-[12.5px] tabular-nums">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 font-semibold text-white">
                  Soal {Math.min(currentIndex + 1, questions.length)} / {questions.length}
                </span>
                <span className="text-white/70 hidden sm:inline">
                  {activeQuestion.type === 'multiple_choice'
                    ? 'Pilihan Ganda'
                    : activeQuestion.type === 'true_false'
                    ? 'Benar / Salah'
                    : 'Isian Singkat'}
                  {' · '}
                  {activeQuestion.points} poin
                </span>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold border ${
                  timeLeft <= 5
                    ? 'bg-[#E53E51]/25 border-[#E53E51]/60 text-[#FDA4AF]'
                    : 'bg-white/10 border-white/15 text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft} detik</span>
              </div>
            </div>

            {/* Non-blocking Instant Feedback Strip (Classic Mode) while already on the next question */}
            {lastAnswerResult && roomState.mode === 'classic' && (
              <div
                className={`rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[12.5px] font-semibold transition-all ${
                  lastAnswerResult.isCorrect
                    ? 'bg-[#00C985]/20 border border-[#00C985]/45 text-[#6EE7B7]'
                    : 'bg-[#E53E51]/20 border border-[#E53E51]/45 text-[#FDA4AF]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {lastAnswerResult.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate">
                    {lastAnswerResult.isCorrect
                      ? `Soal sebelumnya benar! +${lastAnswerResult.pointsAwarded.toLocaleString('id-ID')} poin`
                      : `Soal sebelumnya kurang tepat${
                          lastAnswerResult.correctDisplay
                            ? ` · Jawaban benar: ${lastAnswerResult.correctDisplay}`
                            : ''
                        }`}
                  </span>
                </div>
                {lastAnswerResult.streak >= 2 && (
                  <span className="inline-flex items-center gap-1 text-[#FCD34D] tabular-nums shrink-0">
                    <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                    Streak {lastAnswerResult.streak}x
                  </span>
                )}
              </div>
            )}

            {/* Active Question Prompt & Answer Options */}
            <div className="space-y-4">
              {/* Wayground Center Question Box */}
              <div className="rounded-2xl bg-[#14051B]/90 border border-white/15 p-6 sm:p-9 min-h-[140px] flex flex-col items-center justify-center text-center shadow-inner">
                <h3 className="text-[18px] sm:text-[23px] font-semibold text-white leading-snug max-w-2xl">
                  {activeQuestion.prompt}
                </h3>
              </div>

                {/* Multiple Choice: 4 Wayground Tactile Color Tiles */}
                {activeQuestion.type === 'multiple_choice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeQuestion.options.map((opt, idx) => {
                      const tile = WAYGROUND_OPTION_TILES[idx % WAYGROUND_OPTION_TILES.length];
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectOption(idx)}
                          className={`group rounded-2xl p-4 sm:p-5 text-left flex items-center gap-3.5 text-white transition-all active:translate-y-0.5 cursor-pointer ${tile.bg} ${tile.hoverBg} ${tile.borderBottom}`}
                        >
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center gap-1 text-[13px] font-bold shrink-0 ${tile.badgeBg}`}
                          >
                            <ShapeGlyph shape={tile.shape} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
                              Pilihan {tile.letter}
                            </div>
                            <div className="text-[15px] sm:text-[16px] font-semibold leading-snug break-words">
                              {opt}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True / False: 2 Wayground Tiles */}
                {activeQuestion.type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-3.5">
                    {activeQuestion.options.map((opt, idx) => {
                      const tile = WAYGROUND_TF_TILES[idx % WAYGROUND_TF_TILES.length];
                      const isTrue = idx === 0;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectOption(idx)}
                          className={`rounded-2xl p-5 sm:p-7 flex flex-col items-center justify-center gap-2 text-white transition-all active:translate-y-0.5 cursor-pointer ${tile.bg} ${tile.hoverBg} ${tile.borderBottom}`}
                        >
                          <span className={`w-10 h-10 rounded-full flex items-center justify-center ${tile.badgeBg}`}>
                            {isTrue ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                          </span>
                          <span className="text-[17px] sm:text-[19px] font-bold">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer */}
                {activeQuestion.type === 'short_answer' && (
                  <form onSubmit={handleSubmitShortAnswer} className="max-w-lg mx-auto space-y-3 pt-1">
                    <input
                      type="text"
                      autoFocus
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Ketik jawaban singkat kamu di sini..."
                      className="w-full px-4 py-3.5 rounded-2xl border border-white/25 bg-[#14051B] text-white placeholder:text-white/45 text-[15px] font-medium text-center outline-none focus:border-[#00C985]"
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim()}
                      className="w-full h-11 rounded-full bg-[#00C985] hover:bg-[#00B377] border-b-4 border-[#008C5C] disabled:opacity-45 text-[#082419] text-[14px] font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                      <span>Kirim Jawaban</span>
                    </button>
                  </form>
                )}
                </div>
              </div>
        )}

        {/* 3. FINISHED OR SESSION ENDED SUMMARY */}
        {(roomState.status === 'ended' || (roomState.status === 'active' && (me?.finished || currentIndex >= questions.length))) && (
          <div className="space-y-6 py-2">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#EDA92A]/20 border border-[#EDA92A]/50 text-[#FCD34D] flex items-center justify-center mx-auto">
                <Trophy className="w-7 h-7" />
              </div>
              <h2 className="text-[22px] sm:text-[25px] font-bold text-white">
                {roomState.status === 'ended' ? 'Kuis Selesai!' : 'Semua Soal Telah Dijawab'}
              </h2>
              <p className="text-[13px] text-white/75 max-w-md mx-auto">
                {roomState.status === 'ended'
                  ? 'Berikut adalah ringkasan skor akhir dan tinjauan jawabanmu.'
                  : roomState.mode === 'test'
                  ? 'Menunggu Host menekan Akhiri Kuis untuk membuka nilai akhir dan pembahasan.'
                  : 'Menunggu peserta lain selesai atau Host menutup sesi.'}
              </p>
            </div>

            {(roomState.status === 'ended' || roomState.mode === 'classic') && me && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                <div className="p-4 rounded-2xl bg-white/8 border border-white/12 text-center">
                  <div className="text-[11.5px] text-white/65">Skor Akhir</div>
                  <div className="text-[22px] font-bold text-white tabular-nums mt-0.5">
                    {me.score.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/8 border border-white/12 text-center">
                  <div className="text-[11.5px] text-white/65">Jawaban Benar</div>
                  <div className="text-[22px] font-bold text-[#6EE7B7] tabular-nums mt-0.5">
                    {me.correctCount}/{roomState.totalQuestions}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/8 border border-white/12 text-center">
                  <div className="text-[11.5px] text-white/65">Akurasi</div>
                  <div className="text-[22px] font-bold text-white tabular-nums mt-0.5">
                    {roomState.totalQuestions > 0
                      ? Math.round((me.correctCount / roomState.totalQuestions) * 100)
                      : 0}
                    %
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/8 border border-white/12 text-center">
                  <div className="text-[11.5px] text-white/65">Peringkat</div>
                  <div className="text-[22px] font-bold text-[#FCD34D] tabular-nums mt-0.5">
                    #{myRank}
                  </div>
                </div>
              </div>
            )}

            {(roomState.status === 'ended' || roomState.mode === 'classic') && me && me.answers.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-white/10">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-white/65">
                  Tinjauan Soal &amp; Jawaban
                </div>
                <div className="divide-y divide-white/10 rounded-2xl border border-white/12 overflow-hidden bg-[#14051B]/80">
                  {questions.map((q, idx) => {
                    const ans = me.answers.find((a) => a.questionId === q.id);
                    const fullQ = reviewQuestions.find((rq) => rq.id === q.id);
                    const correctText = fullQ
                      ? fullQ.type === 'short_answer'
                        ? (fullQ.acceptedAnswers || [])[0]
                        : fullQ.options[fullQ.correctOptionIndex ?? 0]
                      : undefined;

                    return (
                      <div key={q.id} className="p-4 space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-[13.5px] font-semibold text-white">
                            <span className="text-white/50 mr-1.5 tabular-nums">#{idx + 1}</span>
                            {q.prompt}
                          </div>
                          <span
                            className={`text-[12px] font-bold shrink-0 tabular-nums ${
                              ans?.isCorrect ? 'text-[#6EE7B7]' : 'text-[#FDA4AF]'
                            }`}
                          >
                            {ans?.isCorrect ? `+${ans.pointsAwarded}` : 'Salah'}
                          </span>
                        </div>
                        <div className="text-[12.5px] text-white/75 flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            Jawabanmu:{' '}
                            <strong className={ans?.isCorrect ? 'text-[#6EE7B7]' : 'text-[#FDA4AF]'}>
                              {ans?.submittedValue || '-'}
                            </strong>
                          </span>
                          {!ans?.isCorrect && correctText && (
                            <span>
                              Kunci: <strong className="text-[#6EE7B7]">{correctText}</strong>
                            </span>
                          )}
                        </div>
                        {fullQ?.explanation && (
                          <div className="text-[12px] text-white/65 leading-relaxed">
                            {fullQ.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
