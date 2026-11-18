import React, { useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLiveQuizSocket } from '../../hooks/useLiveQuizSocket';
import { LiveQuizHostView } from './LiveQuizHostView';
import { INITIAL_LIVE_QUIZZES } from '../../data/liveQuizSeed';
import type { LiveQuiz, LiveQuizMode, LiveQuizSessionReport } from '../../types';

const AVATAR_COLORS = [
  'bg-[#D6D4FF] text-[#3F3B99]',
  'bg-[#C4F0DC] text-[#146C43]',
  'bg-[#FDE6C4] text-[#8C5811]',
  'bg-[#FAD2CF] text-[#942922]',
];

function resolveQuizById(quizId: string, liveQuizzes: LiveQuiz[]): LiveQuiz | undefined {
  if (typeof window !== 'undefined' && quizId) {
    try {
      const stashed = window.localStorage.getItem(`servolution_lq_pending_quiz_${quizId}`);
      if (stashed) {
        const parsed = JSON.parse(stashed) as LiveQuiz;
        if (parsed && parsed.id === quizId && Array.isArray(parsed.questions)) {
          return parsed;
        }
      }
      const savedList = window.localStorage.getItem('servolution_live_quizzes');
      if (savedList) {
        const parsedList = JSON.parse(savedList) as LiveQuiz[];
        const foundLocal = parsedList.find((q) => q.id === quizId);
        if (foundLocal) return foundLocal;
      }
    } catch {
      // ignore localStorage parse failure
    }
  }
  return (
    liveQuizzes.find((q) => q.id === quizId) ||
    INITIAL_LIVE_QUIZZES.find((q) => q.id === quizId)
  );
}

export const LiveQuizHostTabPage: React.FC = () => {
  const { liveQuizzes, handleAddLiveQuizReport } = useApp();

  const {
    connectionStatus,
    roomState,
    errorMessage,
    hostClientId,
    createRoom,
    reconnectHost,
    updateRoomSettings,
    kickParticipant,
    startGame,
    endGame,
    leaveRoom,
  } = useLiveQuizSocket();

  const previewSocket = useLiveQuizSocket('_preview');
  const initializedRef = useRef(false);
  const savedEndedRoomRef = useRef<string | null>(null);

  const launchParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { code: '', hostKey: '', quizId: '', mode: 'classic' as LiveQuizMode };
    }
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode') === 'test' ? 'test' : 'classic';
    return {
      code: (params.get('code') || '').replace(/\D/g, '').slice(0, 6),
      hostKey: params.get('hostKey') || '',
      quizId: params.get('quizId') || '',
      mode: modeParam as LiveQuizMode,
    };
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;

    if (launchParams.code) {
      initializedRef.current = true;
      reconnectHost(launchParams.code, launchParams.hostKey || undefined);
      return;
    }

    if (launchParams.quizId) {
      const targetQuiz = resolveQuizById(launchParams.quizId, liveQuizzes);
      if (targetQuiz) {
        initializedRef.current = true;
        createRoom(targetQuiz, launchParams.mode, {
          shuffleQuestions: false,
          shuffleOptions: launchParams.mode === 'classic',
          showExplanation: launchParams.mode === 'classic',
          streakBonus: launchParams.mode === 'classic',
        });
      }
    }
  }, [launchParams, liveQuizzes, createRoom, reconnectHost]);

  // Keep URL synced to active room code + hostKey so refreshing the new tab restores the session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (roomState && roomState.role === 'host' && roomState.code) {
      const nextUrl = `/?liveQuizHost=1&code=${encodeURIComponent(roomState.code)}&hostKey=${encodeURIComponent(hostClientId)}`;
      if (window.location.search !== nextUrl.slice(1)) {
        window.history.replaceState(null, '', nextUrl);
      }
    }
  }, [roomState, hostClientId]);

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

  const handleExitToHub = () => {
    previewSocket.leaveRoom();
    leaveRoom();
    if (typeof window !== 'undefined') {
      window.location.href = '/?page=livequiz';
    }
  };

  if (roomState && roomState.role === 'host') {
    return (
      <LiveQuizHostView
        fullWidth
        hostClientId={hostClientId}
        roomState={roomState}
        connectionStatus={connectionStatus}
        onUpdateSettings={(mode, settings) => updateRoomSettings(roomState.code, mode, settings)}
        onKickParticipant={(pid) => kickParticipant(roomState.code, pid)}
        onStartGame={() => startGame(roomState.code)}
        onEndGame={() => endGame(roomState.code)}
        onLeave={handleExitToHub}
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
    );
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_#4A1C59_0%,_#2A0E35_55%,_#1A0722_100%)] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl bg-[#16061E]/85 border border-white/15 p-7 text-center space-y-4 shadow-2xl">
        {errorMessage ? (
          <>
            <AlertTriangle className="w-10 h-10 text-[#F59E0B] mx-auto" />
            <h1 className="text-[18px] font-bold text-white">Sesi Host Tidak Tersedia</h1>
            <p className="text-[13px] text-white/75 leading-relaxed">{errorMessage}</p>
            <a
              href="/?page=livequiz"
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full bg-white text-[#1C1D21] text-[13px] font-semibold hover:bg-white/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Kembali ke LiveQuiz Hub</span>
            </a>
          </>
        ) : (
          <>
            <Loader2 className="w-9 h-9 text-[#C084FC] animate-spin mx-auto" />
            <h1 className="text-[17px] font-bold text-white">Menyiapkan Dashboard Host LiveQuiz...</h1>
            <p className="text-[13px] text-white/70">
              Menghubungkan ke server ruangan real-time dalam tampilan layar penuh.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
