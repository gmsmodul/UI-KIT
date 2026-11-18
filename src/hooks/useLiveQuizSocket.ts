import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  LiveQuiz,
  LiveQuizAnswerResult,
  LiveQuizMode,
  LiveQuizRoomState,
  LiveQuizSettings,
} from '../types';

export type WsConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

function getOrCreateSessionId(key: string): string {
  if (typeof window === 'undefined') return `${key}-${Date.now()}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const created = `${key}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  window.sessionStorage.setItem(key, created);
  return created;
}

export function useLiveQuizSocket(storageSuffix = '') {
  const [connectionStatus, setConnectionStatus] = useState<WsConnectionStatus>('connecting');
  const [roomState, setRoomState] = useState<LiveQuizRoomState | null>(null);
  const [lastAnswerResult, setLastAnswerResult] = useState<LiveQuizAnswerResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const activeSessionRef = useRef<
    | { role: 'host'; code: string; hostClientId: string }
    | { role: 'participant'; code: string; participantId: string; name: string; avatarColor: string }
    | null
  >(null);
  const pendingMessagesRef = useRef<Array<{ type: string; payload: Record<string, unknown> }>>([]);
  const mountedRef = useRef(true);

  const hostClientIdRef = useRef<string>(getOrCreateSessionId(`servolution_lq_host${storageSuffix}`));
  const participantIdRef = useRef<string>(getOrCreateSessionId(`servolution_lq_user${storageSuffix}`));

  const sendRaw = useCallback((type: string, payload: Record<string, unknown>) => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    } else {
      pendingMessagesRef.current.push({ type, payload });
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    setConnectionStatus((prev) => (prev === 'disconnected' ? 'reconnecting' : 'connecting'));
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      if (!mountedRef.current) return;
      setConnectionStatus('connected');
      setErrorMessage(null);

      // Re-sync room session if reconnecting
      const session = activeSessionRef.current;
      if (session) {
        if (session.role === 'host') {
          socket.send(
            JSON.stringify({
              type: 'host:reconnect',
              payload: { code: session.code, hostClientId: session.hostClientId },
            })
          );
        } else {
          socket.send(
            JSON.stringify({
              type: 'participant:join',
              payload: {
                code: session.code,
                participantId: session.participantId,
                name: session.name,
                avatarColor: session.avatarColor,
              },
            })
          );
        }
      }

      // Flush buffered commands
      while (pendingMessagesRef.current.length > 0) {
        const queued = pendingMessagesRef.current.shift();
        if (queued) {
          socket.send(JSON.stringify(queued));
        }
      }
    };

    socket.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'room:state') {
          const nextState = msg.payload as LiveQuizRoomState;
          setRoomState(nextState);
          setErrorMessage(null);
          if (nextState.role === 'host') {
            activeSessionRef.current = {
              role: 'host',
              code: nextState.code,
              hostClientId: hostClientIdRef.current,
            };
          }
        } else if (msg.type === 'answer:result') {
          setLastAnswerResult(msg.payload as LiveQuizAnswerResult);
        } else if (msg.type === 'room:error') {
          setErrorMessage(String(msg.payload?.message || 'Terjadi kesalahan pada ruangan LiveQuiz.'));
        } else if (msg.type === 'room:kicked') {
          activeSessionRef.current = null;
          setRoomState(null);
          setLastAnswerResult(null);
          setErrorMessage(String(msg.payload?.message || 'Anda dikeluarkan dari ruangan oleh Host.'));
        }
      } catch {
        // ignore malformed frames
      }
    };

    socket.onclose = () => {
      if (!mountedRef.current) return;
      wsRef.current = null;
      setConnectionStatus('reconnecting');
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(() => {
        if (mountedRef.current) connect();
      }, 1500);
    };

    socket.onerror = () => {
      // handled in onclose
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const createRoom = useCallback(
    (quiz: LiveQuiz, mode: LiveQuizMode, settings: LiveQuizSettings) => {
      setErrorMessage(null);
      setLastAnswerResult(null);
      activeSessionRef.current = null;
      sendRaw('host:create', {
        quiz,
        mode,
        settings,
        hostClientId: hostClientIdRef.current,
      });
    },
    [sendRaw]
  );

  const reconnectHost = useCallback(
    (code: string, hostKey?: string) => {
      const cleanCode = code.trim();
      if (!cleanCode) return;
      if (hostKey && hostKey.trim()) {
        hostClientIdRef.current = hostKey.trim();
      }
      setErrorMessage(null);
      setLastAnswerResult(null);
      activeSessionRef.current = {
        role: 'host',
        code: cleanCode,
        hostClientId: hostClientIdRef.current,
      };
      sendRaw('host:reconnect', {
        code: cleanCode,
        hostClientId: hostClientIdRef.current,
      });
    },
    [sendRaw]
  );

  const updateRoomSettings = useCallback(
    (code: string, mode: LiveQuizMode, settings: LiveQuizSettings) => {
      sendRaw('host:update_settings', {
        code,
        hostClientId: hostClientIdRef.current,
        mode,
        settings,
      });
    },
    [sendRaw]
  );

  const kickParticipant = useCallback(
    (code: string, participantId: string) => {
      sendRaw('host:kick', {
        code,
        hostClientId: hostClientIdRef.current,
        participantId,
      });
    },
    [sendRaw]
  );

  const startGame = useCallback(
    (code: string) => {
      sendRaw('host:start', {
        code,
        hostClientId: hostClientIdRef.current,
      });
    },
    [sendRaw]
  );

  const endGame = useCallback(
    (code: string) => {
      sendRaw('host:end', {
        code,
        hostClientId: hostClientIdRef.current,
      });
    },
    [sendRaw]
  );

  const joinRoom = useCallback(
    (code: string, name: string, avatarColor: string) => {
      setErrorMessage(null);
      setLastAnswerResult(null);
      const cleanCode = code.trim();
      const cleanName = name.trim();
      activeSessionRef.current = {
        role: 'participant',
        code: cleanCode,
        participantId: participantIdRef.current,
        name: cleanName,
        avatarColor,
      };
      sendRaw('participant:join', {
        code: cleanCode,
        name: cleanName,
        participantId: participantIdRef.current,
        avatarColor,
      });
    },
    [sendRaw]
  );

  const submitAnswer = useCallback(
    (
      code: string,
      questionId: string,
      payload: { selectedOptionIndex?: number; textAnswer?: string; timeTakenMs: number }
    ) => {
      sendRaw('participant:answer', {
        code,
        participantId: participantIdRef.current,
        questionId,
        selectedOptionIndex: payload.selectedOptionIndex,
        textAnswer: payload.textAnswer,
        timeTakenMs: payload.timeTakenMs,
      });
    },
    [sendRaw]
  );

  const reportTabSwitch = useCallback(
    (code: string) => {
      sendRaw('participant:tab_switch', {
        code,
        participantId: participantIdRef.current,
      });
    },
    [sendRaw]
  );

  const leaveRoom = useCallback(() => {
    sendRaw('room:leave', {});
    activeSessionRef.current = null;
    setRoomState(null);
    setLastAnswerResult(null);
    setErrorMessage(null);
  }, [sendRaw]);

  const clearAnswerResult = useCallback(() => {
    setLastAnswerResult(null);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    connectionStatus,
    roomState,
    lastAnswerResult,
    errorMessage,
    hostClientId: hostClientIdRef.current,
    createRoom,
    reconnectHost,
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
  };
}
