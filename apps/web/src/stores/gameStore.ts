import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type {
  Player,
  GamePhase,
  LeaderboardEntry,
  QuestionEvent,
  QuestionResultsEvent,
  GameFinishedEvent,
} from '@gameblitz/types';

interface GameState {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;

  // Game state
  gamePhase: GamePhase | 'idle' | 'joining';
  pin: string | null;
  playerId: string | null;
  nickname: string | null;

  // Players
  players: Array<{ id: string; nickname: string; score: number }>;
  playerCount: number;

  // Question state
  currentQuestion: QuestionEvent['question'] | null;
  questionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  hasAnswered: boolean;
  selectedAnswer: number | null;
  answerCount: number;

  // Results
  questionResults: QuestionResultsEvent | null;
  leaderboard: LeaderboardEntry[];
  myRank: number | null;
  finalResults: GameFinishedEvent | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  joinGame: (pin: string, nickname: string) => Promise<boolean>;
  submitAnswer: (optionIndex: number) => void;
  leaveGame: () => void;
  reset: () => void;
  setTimeRemaining: (time: number) => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  isConnected: false,
  error: null,

  gamePhase: 'idle',
  pin: null,
  playerId: null,
  nickname: null,

  players: [],
  playerCount: 0,

  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  timeRemaining: 0,
  hasAnswered: false,
  selectedAnswer: null,
  answerCount: 0,

  questionResults: null,
  leaderboard: [],
  myRank: null,
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

    newSocket.on('game:started', (data) => {
      set({
        gamePhase: 'question',
        totalQuestions: data.totalQuestions,
      });
    });

    newSocket.on('game:question', (data: QuestionEvent) => {
      set({
        gamePhase: 'question',
        currentQuestion: data.question,
        questionIndex: data.questionIndex,
        totalQuestions: data.totalQuestions,
        timeRemaining: data.question.timeLimit,
        hasAnswered: false,
        selectedAnswer: null,
        questionResults: null,
        answerCount: 0,
      });
    });

    newSocket.on('game:answer-count', (data) => {
      set({ answerCount: data.count });
    });

    newSocket.on('game:question-results', (data: QuestionResultsEvent) => {
      set({
        gamePhase: 'results',
        questionResults: data,
      });
    });

    newSocket.on('game:leaderboard', (data) => {
      set({
        gamePhase: 'leaderboard',
        leaderboard: data.rankings,
        myRank: data.myRank || null,
      });
    });

    newSocket.on('game:finished', (data: GameFinishedEvent) => {
      set({
        gamePhase: 'finished',
        finalResults: data,
      });
    });

    newSocket.on('game:host-disconnected', () => {
      set({ error: 'Host disconnected' });
    });

    newSocket.on('game:ended', () => {
      get().reset();
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

  joinGame: async (pin: string, nickname: string): Promise<boolean> => {
    const { socket } = get();
    if (!socket) return false;

    set({ gamePhase: 'joining', error: null });

    return new Promise((resolve) => {
      socket.emit('player:join', { pin, nickname }, (response: any) => {
        if (response.error) {
          set({ error: response.error, gamePhase: 'idle' });
          resolve(false);
        } else {
          set({
            pin,
            playerId: response.playerId,
            nickname,
            gamePhase: 'lobby',
          });
          resolve(true);
        }
      });
    });
  },

  submitAnswer: (optionIndex: number) => {
    const { socket, pin, hasAnswered, isConnected } = get();

    if (!socket || !isConnected) {
      set({ error: 'Not connected to server' });
      return;
    }
    if (!pin) {
      set({ error: 'Not in a game' });
      return;
    }
    if (hasAnswered) return;

    set({ hasAnswered: true, selectedAnswer: optionIndex });

    socket.emit('player:answer', { pin, optionIndex }, (response: any) => {
      if (response.error) {
        // Reset answer state so they can try again
        set({ error: response.error, hasAnswered: false, selectedAnswer: null });
      }
    });
  },

  leaveGame: () => {
    const { socket, pin } = get();
    if (socket && pin) {
      socket.emit('player:leave', { pin }, () => {});
    }
    get().reset();
  },

  reset: () => {
    set({
      gamePhase: 'idle',
      pin: null,
      playerId: null,
      nickname: null,
      players: [],
      playerCount: 0,
      currentQuestion: null,
      questionIndex: 0,
      totalQuestions: 0,
      timeRemaining: 0,
      hasAnswered: false,
      selectedAnswer: null,
      answerCount: 0,
      questionResults: null,
      leaderboard: [],
      myRank: null,
      finalResults: null,
      error: null,
    });
  },

  setTimeRemaining: (time: number) => {
    set({ timeRemaining: time });
  },
}));
