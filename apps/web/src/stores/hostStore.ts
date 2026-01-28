import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { GamePhase, LeaderboardEntry, QuestionResultsEvent } from '@gameblitz/types';

interface Question {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: string[];
  timeLimit: number;
  points: number;
}

interface HostState {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;

  // Game state
  gamePhase: GamePhase | 'idle';
  pin: string | null;
  gameId: string | null;

  // Players
  players: Array<{ id: string; nickname: string; score: number }>;
  playerCount: number;

  // Question state
  questions: Question[];
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  answerCount: number;

  // Results
  questionResults: { correctIndex: number; answerCounts: number[] } | null;
  leaderboard: LeaderboardEntry[];
  finalResults: LeaderboardEntry[] | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  createGame: (quizId: string, hostId: string) => Promise<boolean>;
  startGame: () => Promise<boolean>;
  revealAnswer: () => Promise<boolean>;
  showLeaderboard: () => Promise<boolean>;
  nextQuestion: () => Promise<{ success: boolean; isLast: boolean }>;
  endGame: () => Promise<boolean>;
  setTimeRemaining: (time: number) => void;
  reset: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const useHostStore = create<HostState>((set, get) => ({
  socket: null,
  isConnected: false,
  error: null,

  gamePhase: 'idle',
  pin: null,
  gameId: null,

  players: [],
  playerCount: 0,

  questions: [],
  currentQuestionIndex: -1,
  totalQuestions: 0,
  timeRemaining: 0,
  answerCount: 0,

  questionResults: null,
  leaderboard: [],
  finalResults: null,

  connect: () => {
    const { socket } = get();
    // Return if we already have a socket (connected or connecting)
    if (socket) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      set({ isConnected: true, error: null });
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });
    });

    newSocket.on('connect_error', (err) => {
      set({ error: `Connection failed: ${err.message}` });
    });

    // Game events
    newSocket.on('game:player-joined', (data) => {
      set((state) => ({
        players: [...state.players.filter((p) => p.id !== data.player.id), data.player],
        playerCount: data.playerCount,
      }));
    });

    newSocket.on('game:player-left', (data) => {
      set((state) => ({
        players: state.players.filter((p) => p.id !== data.playerId),
        playerCount: data.playerCount,
      }));
    });

    newSocket.on('game:answer-count', (data) => {
      set({ answerCount: data.count });
    });

    newSocket.on('game:question-results', (data) => {
      set({
        questionResults: {
          correctIndex: data.correctIndex,
          answerCounts: data.answerCounts,
        },
      });
    });

    newSocket.on('game:leaderboard', (data) => {
      set({ leaderboard: data.rankings });
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  createGame: async (quizId: string, hostId: string): Promise<boolean> => {
    const { socket } = get();
    if (!socket) return false;

    return new Promise((resolve) => {
      socket.emit('host:create-game', { quizId, hostId }, (response: any) => {
        if (response.error) {
          set({ error: response.error });
          resolve(false);
        } else {
          set({
            pin: response.pin,
            totalQuestions: response.totalQuestions,
            gamePhase: 'lobby',
          });
          resolve(true);
        }
      });
    });
  },

  startGame: async (): Promise<boolean> => {
    const { socket, pin } = get();
    if (!socket || !pin) return false;

    return new Promise((resolve) => {
      socket.emit('host:start-game', { pin }, (response: any) => {
        if (response.error) {
          set({ error: response.error });
          resolve(false);
        } else {
          set({ gamePhase: 'question', currentQuestionIndex: 0, answerCount: 0 });
          resolve(true);
        }
      });
    });
  },

  revealAnswer: async (): Promise<boolean> => {
    const { socket, pin } = get();
    if (!socket || !pin) return false;

    return new Promise((resolve) => {
      socket.emit('host:reveal-answer', { pin }, (response: any) => {
        if (response.error) {
          set({ error: response.error });
          resolve(false);
        } else {
          set({ gamePhase: 'results' });
          resolve(true);
        }
      });
    });
  },

  showLeaderboard: async (): Promise<boolean> => {
    const { socket, pin } = get();
    if (!socket || !pin) return false;

    return new Promise((resolve) => {
      socket.emit('host:show-leaderboard', { pin }, (response: any) => {
        if (response.error) {
          set({ error: response.error });
          resolve(false);
        } else {
          set({ gamePhase: 'leaderboard' });
          resolve(true);
        }
      });
    });
  },

  nextQuestion: async (): Promise<{ success: boolean; isLast: boolean }> => {
    const { socket, pin } = get();
    if (!socket || !pin) return { success: false, isLast: false };

    return new Promise((resolve) => {
      socket.emit('host:next-question', { pin }, (response: any) => {
        if (response.error) {
          if (response.isLastQuestion) {
            resolve({ success: true, isLast: true });
          } else {
            set({ error: response.error });
            resolve({ success: false, isLast: false });
          }
        } else {
          set((state) => ({
            gamePhase: 'question',
            currentQuestionIndex: state.currentQuestionIndex + 1,
            questionResults: null,
            answerCount: 0,
          }));
          resolve({ success: true, isLast: false });
        }
      });
    });
  },

  endGame: async (): Promise<boolean> => {
    const { socket, pin } = get();
    if (!socket || !pin) return false;

    return new Promise((resolve) => {
      socket.emit('host:end-game', { pin }, (response: any) => {
        if (response.error) {
          set({ error: response.error });
          resolve(false);
        } else {
          set({ gamePhase: 'finished' });
          resolve(true);
        }
      });
    });
  },

  setTimeRemaining: (time: number) => {
    set({ timeRemaining: time });
  },

  reset: () => {
    set({
      gamePhase: 'idle',
      pin: null,
      gameId: null,
      players: [],
      playerCount: 0,
      questions: [],
      currentQuestionIndex: -1,
      totalQuestions: 0,
      timeRemaining: 0,
      answerCount: 0,
      questionResults: null,
      leaderboard: [],
      finalResults: null,
      error: null,
    });
  },
}));
