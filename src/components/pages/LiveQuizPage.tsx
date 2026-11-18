import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Download,
  Edit3,
  History,
  Library,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PASTEL_THEMES } from '../../constants/theme';
import { useLiveQuizSocket } from '../../hooks/useLiveQuizSocket';
import { LiveQuizEditor } from '../livequiz/LiveQuizEditor';
import { LiveQuizHostView } from '../livequiz/LiveQuizHostView';
import { LiveQuizParticipantView } from '../livequiz/LiveQuizParticipantView';
import { LiveQuizJoinAccordion } from '../livequiz/LiveQuizJoinAccordion';
import type { LiveQuiz, LiveQuizMode, LiveQuizSessionReport } from '../../types';
import {
  ACTION_BTN_PRIMARY,
  ACTION_BTN_SECONDARY,
} from '../../constants/buttonStyles';

const AVATAR_COLORS = [
  'bg-[#D6D4FF] text-[#3F3B99]',
  'bg-[#C4F0DC] text-[#146C43]',
  'bg-[#FDE6C4] text-[#8C5811]',
  'bg-[#FAD2CF] text-[#942922]',
];

export const LiveQuizPage: React.FC = () => {
  const {
    liveQuizzes,
    liveQuizReports,
    handleSaveLiveQuiz,
    handleDeleteLiveQuiz,
    handleDuplicateLiveQuiz,
    handleAddLiveQuizReport,
    handleExportLiveQuizReportCsv,
    initialLiveQuizCode,
    setInitialLiveQuizCode,
    pendingLiveQuizJoin,
    setPendingLiveQuizJoin,
    triggerToast,
  } = useApp();

  const {
    connectionStatus,
    roomState,
    lastAnswerResult,
    errorMessage,
    hostClientId,
    createRoom,
    updateRoomSettings,
    kickParticipant,
    startGame,
    endGame,
    joinRoom,
    submitAnswer,
    reportTabSwitch,
    leaveRoom,
    clearAnswerResult,
    clearError,
  } = useLiveQuizSocket();

  const previewSocket = useLiveQuizSocket('_preview');

  const [hubTab, setHubTab] = useState<'library' | 'history'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingQuiz, setEditingQuiz] = useState<LiveQuiz | null | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Join Session Form & Accordion State
  const [joinAccordionOpen, setJoinAccordionOpen] = useState(() => Boolean(initialLiveQuizCode));
  const [joinCode, setJoinCode] = useState(initialLiveQuizCode || '');
  const [joinName, setJoinName] = useState('');

  const savedEndedRoomRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialLiveQuizCode) {
      setJoinCode(initialLiveQuizCode);
      setJoinAccordionOpen(true);
      setInitialLiveQuizCode('');
    }
  }, [initialLiveQuizCode, setInitialLiveQuizCode]);

  // Auto-join when redirected from OverviewPage
  useEffect(() => {
    if (!pendingLiveQuizJoin) return;
    const { code, name } = pendingLiveQuizJoin;
    setJoinCode(code);
    setJoinName(name);
    setJoinAccordionOpen(true);
    setPendingLiveQuizJoin(null);
    const avatarColor = AVATAR_COLORS[name.length % AVATAR_COLORS.length];
    joinRoom(code, name, avatarColor);
  }, [pendingLiveQuizJoin, setPendingLiveQuizJoin, joinRoom]);

  useEffect(() => {
    if (errorMessage) {
      setJoinAccordionOpen(true);
    }
  }, [errorMessage]);

  // Persist completed session report when Host ends a LiveQuiz room
  useEffect(() => {
    if (
      roomState &&
      roomState.role === 'host' &&
      roomState.status === 'ended' &&
      savedEndedRoomRef.current !== roomState.code
    ) {
      savedEndedRoomRef.current = roomState.code;
      const totalAnswered = roomState.participants.reduce((acc, p) => acc + p.answeredCount, 0);
      const totalCorrect = roomState.participants.reduce((acc, p) => acc + p.correctCount, 0);
      const avgAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
      const sorted = [...roomState.participants].sort((a, b) => b.score - a.score);

      const report: LiveQuizSessionReport = {
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
      handleAddLiveQuizReport(report);
    }
  }, [roomState, handleAddLiveQuizReport]);

  const handleStartHost = (quiz: LiveQuiz, mode: LiveQuizMode) => {
    savedEndedRoomRef.current = null;
    previewSocket.leaveRoom();
    createRoom(quiz, mode, {
      shuffleQuestions: false,
      shuffleOptions: mode === 'classic',
      showExplanation: mode === 'classic',
      streakBonus: mode === 'classic',
    });
  };

  const stashQuizForHostTab = (quiz: LiveQuiz) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        `servolution_lq_pending_quiz_${quiz.id}`,
        JSON.stringify(quiz)
      );
    } catch {
      // ignore quota/private-mode storage failure
    }
  };

  const buildHostTabUrl = (quiz: LiveQuiz, mode: LiveQuizMode) =>
    `/?liveQuizHost=1&quizId=${encodeURIComponent(quiz.id)}&mode=${mode}`;

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.replace(/\D/g, '').slice(0, 6);
    if (cleanCode.length !== 6) {
      triggerToast('Kode Tidak Valid', 'Masukkan 6 digit kode ruangan LiveQuiz.', 'warning');
      return;
    }
    if (!joinName.trim()) {
      triggerToast('Nama Diperlukan', 'Masukkan nama panggilan Anda untuk bergabung.', 'warning');
      return;
    }
    const avatarColor = AVATAR_COLORS[joinName.trim().length % AVATAR_COLORS.length];
    joinRoom(cleanCode, joinName.trim(), avatarColor);
  };

  // 1. Active Host or Participant Room View
  if (roomState) {
    return (
      <div className="flex-1 overflow-y-auto p-5 sm:p-7">
        {roomState.role === 'host' ? (
          <LiveQuizHostView
            hostClientId={hostClientId}
            roomState={roomState}
            connectionStatus={connectionStatus}
            onUpdateSettings={(mode, settings) => updateRoomSettings(roomState.code, mode, settings)}
            onKickParticipant={(pid) => kickParticipant(roomState.code, pid)}
            onStartGame={() => startGame(roomState.code)}
            onEndGame={() => endGame(roomState.code)}
            onLeave={() => {
              previewSocket.leaveRoom();
              leaveRoom();
            }}
            previewRoomState={previewSocket.roomState}
            previewConnectionStatus={previewSocket.connectionStatus}
            previewLastAnswerResult={previewSocket.lastAnswerResult}
            onJoinPreview={(name = 'Kamu (Tester)') =>
              previewSocket.joinRoom(roomState.code, name, AVATAR_COLORS[0])
            }
            onLeavePreview={previewSocket.leaveRoom}
            onPreviewSubmitAnswer={(questionId, payload) =>
              previewSocket.submitAnswer(roomState.code, questionId, payload)
            }
            onPreviewReportTabSwitch={() => previewSocket.reportTabSwitch(roomState.code)}
            onPreviewClearAnswerResult={previewSocket.clearAnswerResult}
          />
        ) : (
          <LiveQuizParticipantView
            roomState={roomState}
            connectionStatus={connectionStatus}
            lastAnswerResult={lastAnswerResult}
            onSubmitAnswer={(questionId, payload) =>
              submitAnswer(roomState.code, questionId, payload)
            }
            onReportTabSwitch={() => reportTabSwitch(roomState.code)}
            onClearAnswerResult={clearAnswerResult}
            onLeave={leaveRoom}
          />
        )}
      </div>
    );
  }

  // 2. Quiz Editor View
  if (editingQuiz !== undefined) {
    return (
      <div className="flex-1 overflow-y-auto p-5 sm:p-7">
        <LiveQuizEditor
          initialQuiz={editingQuiz}
          onCancel={() => setEditingQuiz(undefined)}
          onSave={(savedQuiz, startHostAfter) => {
            handleSaveLiveQuiz(savedQuiz);
            setEditingQuiz(undefined);
            if (startHostAfter) {
              handleStartHost(savedQuiz, 'classic');
            }
          }}
        />
      </div>
    );
  }

  const filteredQuizzes = liveQuizzes.filter((q) => {
    const query = searchQuery.toLowerCase();
    return (
      q.title.toLowerCase().includes(query) ||
      q.subject.toLowerCase().includes(query) ||
      q.classCode.toLowerCase().includes(query)
    );
  });

  // 3. Main LiveQuiz Hub View
  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="hidden md:block">
          <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">LiveQuiz</h1>
        </div>

        <div className="flex items-center justify-end gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial min-w-0">
            <Search className="w-4 h-4 text-[#8A8D98] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kuis atau mapel..."
              className="w-full sm:w-auto h-9 pl-9 pr-4 rounded-full border border-black/[0.09] text-[13px] bg-white outline-none focus:border-[#ee2e65]"
            />
          </div>
          <button
            type="button"
            onClick={() => setEditingQuiz(null)}
            className={ACTION_BTN_PRIMARY}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Buat</span>
            <span className="hidden sm:inline">Buat Kuis Baru</span>
          </button>
        </div>
      </div>

      {/* Participant Join Accordion */}
      <LiveQuizJoinAccordion
        open={joinAccordionOpen}
        onToggle={() => setJoinAccordionOpen((prev) => !prev)}
        code={joinCode}
        name={joinName}
        onCodeChange={(val) => {
          clearError();
          setJoinCode(val);
        }}
        onNameChange={(val) => {
          clearError();
          setJoinName(val);
        }}
        onSubmit={handleJoinSubmit}
        errorMessage={errorMessage}
      />

      {/* Segmented Hub Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 bg-[#F4F5F8] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setHubTab('library')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              hubTab === 'library'
                ? 'bg-white text-[#1C1D21] shadow-xs'
                : 'text-[#6E717A] hover:text-[#1C1D21]'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Perpustakaan Kuis ({liveQuizzes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setHubTab('history')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              hubTab === 'history'
                ? 'bg-white text-[#1C1D21] shadow-xs'
                : 'text-[#6E717A] hover:text-[#1C1D21]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Sesi ({liveQuizReports.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: QUIZ LIBRARY */}
      {hubTab === 'library' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuizzes.map((quiz) => {
            const theme = PASTEL_THEMES[quiz.theme] || PASTEL_THEMES.periwinkle;
            const mcCount = quiz.questions.filter((q) => q.type === 'multiple_choice').length;
            const tfCount = quiz.questions.filter((q) => q.type === 'true_false').length;
            const saCount = quiz.questions.filter((q) => q.type === 'short_answer').length;
            const typeSummary = [
              mcCount ? `${mcCount} Pilihan Ganda` : '',
              tfCount ? `${tfCount} B/S` : '',
              saCount ? `${saCount} Isian` : '',
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl border border-black/[0.07] p-5 flex flex-col justify-between gap-4 hover:border-black/[0.15] transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[12px] text-[#6E717A] truncate">
                      <span className={`font-semibold ${theme.text}`}>{quiz.classCode}</span>
                      <span className="mx-1.5">·</span>
                      <span>{quiz.subject}</span>
                      <span className="mx-1.5">·</span>
                      <span className="tabular-nums">{quiz.questions.length} Soal</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingQuiz(quiz)}
                        title="Edit Kuis"
                        className="w-8 h-8 rounded-full hover:bg-[#F4F5F8] text-[#6E717A] hover:text-[#1C1D21] flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateLiveQuiz(quiz)}
                        title="Duplikasi Kuis"
                        className="w-8 h-8 rounded-full hover:bg-[#F4F5F8] text-[#6E717A] hover:text-[#1C1D21] flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteId === quiz.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteLiveQuiz(quiz.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#FFECEB] text-[#942922] text-[11px] font-semibold cursor-pointer"
                        >
                          Hapus?
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(quiz.id)}
                          title="Hapus Kuis"
                          className="w-8 h-8 rounded-full hover:bg-[#FFECEB] text-[#6E717A] hover:text-[#942922] flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[16px] font-semibold text-[#1C1D21]">{quiz.title}</h3>
                    <p className="text-[13px] text-[#6E717A] mt-1 line-clamp-2">
                      {quiz.description}
                    </p>
                  </div>

                  <div className="text-[11.5px] text-[#8A8D98] tabular-nums">
                    {typeSummary || 'Kuis Custom'} · Dibuat {quiz.createdAt}
                  </div>
                </div>

                {/* Host Actions (Open Full-Width Host Dashboard in New Browser Tab) */}
                <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center gap-2">
                  <a
                    href={buildHostTabUrl(quiz, 'classic')}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => stashQuizForHostTab(quiz)}
                    className={`flex-1 ${ACTION_BTN_PRIMARY}`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Host Classic</span>
                  </a>
                  <a
                    href={buildHostTabUrl(quiz, 'test')}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => stashQuizForHostTab(quiz)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 px-3.5 sm:px-4 rounded-full bg-[#F0EFFC] hover:bg-[#D6D4FF] text-[#3F3B99] text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Host Test Mode</span>
                  </a>
                </div>
              </div>
            );
          })}

          {filteredQuizzes.length === 0 && (
            <div className="md:col-span-2 py-12 text-center bg-white rounded-2xl border border-black/[0.07] space-y-3">
              <Play className="w-8 h-8 text-[#B4B6C1] mx-auto" />
              <div className="text-[15px] font-semibold text-[#1C1D21]">
                Tidak ada kuis yang cocok
              </div>
              <p className="text-[13px] text-[#6E717A]">
                Buat kuis custom baru atau ubah kata kunci pencarian Anda.
              </p>
              <button
                type="button"
                onClick={() => setEditingQuiz(null)}
                className={ACTION_BTN_PRIMARY}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Buat Kuis Baru</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SESSION HISTORY */}
      {hubTab === 'history' && (
        <div className="space-y-3">
          {liveQuizReports.map((rep) => {
            const isExpanded = expandedReportId === rep.id;
            return (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#6E717A] tabular-nums">
                      <span className="font-semibold text-[#9D113C]">
                        {rep.mode === 'classic' ? 'Classic Mode' : 'Test Mode'}
                      </span>
                      <span>·</span>
                      <span>Room {rep.code}</span>
                      <span>·</span>
                      <span>{rep.endedAt}</span>
                    </div>
                    <h3 className="text-[15.5px] font-semibold text-[#1C1D21] truncate">
                      {rep.quizTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#6E717A] tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {rep.participantCount} peserta
                      </span>
                      <span>·</span>
                      <span>Rata-rata Akurasi {rep.avgAccuracy}%</span>
                      {rep.topScorer && (
                        <>
                          <span>·</span>
                          <span>Skor Tertinggi: {rep.topScorer}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedReportId(isExpanded ? null : rep.id)}
                      className={ACTION_BTN_SECONDARY}
                    >
                      {isExpanded ? 'Tutup Detail' : 'Lihat Hasil'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportLiveQuizReportCsv(rep)}
                      className={ACTION_BTN_SECONDARY}
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-black/[0.06] bg-[#FAFBFD] p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A8D98]">
                        Peringkat Peserta
                      </div>
                      <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.05]">
                        {rep.participants.map((p, idx) => (
                          <div
                            key={p.id}
                            className="px-3.5 py-2.5 flex items-center justify-between text-[12.5px] tabular-nums"
                          >
                            <span className="font-medium text-[#1C1D21] truncate">
                              <span className="text-[#8A8D98] mr-2">#{idx + 1}</span>
                              {p.name}
                            </span>
                            <span className="font-semibold text-[#1C1D21]">
                              {p.score.toLocaleString('id-ID')} ({p.correctCount}/{rep.totalQuestions})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A8D98]">
                        Statistik Soal
                      </div>
                      <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.05]">
                        {rep.questionStats.map((qs, idx) => (
                          <div
                            key={qs.questionId}
                            className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-[12.5px]"
                          >
                            <span className="text-[#4B4E57] truncate">
                              #{idx + 1} {qs.prompt}
                            </span>
                            <span className="font-bold text-[#146C43] tabular-nums shrink-0">
                              {qs.accuracyPct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {liveQuizReports.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-black/[0.07] text-[13px] text-[#6E717A]">
              Belum ada riwayat sesi LiveQuiz yang selesai.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
