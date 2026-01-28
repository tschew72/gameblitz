// Question Types
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  timeLimit: number;
  points: number;
  options: QuestionOption[];
  order: number;
  imageUrl?: string;
}

// Quiz Types
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  userId: string;
  questions: Question[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Game Types
export type GameStatus = 'LOBBY' | 'ACTIVE' | 'FINISHED';
export type GamePhase = 'lobby' | 'question' | 'results' | 'leaderboard' | 'finished';

export interface Player {
  id: string;
  socketId: string;
  nickname: string;
  avatar?: string;
  score: number;
  currentStreak: number;
  joinedAt: number;
}

export interface Answer {
  playerId: string;
  optionIndex: number;
  timestamp: number;
  responseTime: number;
}

export interface GameState {
  pin: string;
  quizId: string;
  hostSocketId: string;
  phase: GamePhase;
  currentQuestionIndex: number;
  questionStartTime: number;
  players: Player[];
  answers: Answer[];
  totalQuestions: number;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
  pointsThisRound?: number;
}

export interface QuestionResult {
  correctIndex: number;
  answerCounts: number[];
  totalAnswers: number;
}

// Socket Events - Host
export interface HostCreateGamePayload {
  quizId: string;
  hostId: string;
}

export interface HostStartGamePayload {
  pin: string;
}

export interface HostNextQuestionPayload {
  pin: string;
}

export interface HostRevealAnswerPayload {
  pin: string;
}

export interface HostShowLeaderboardPayload {
  pin: string;
}

export interface HostEndGamePayload {
  pin: string;
}

// Socket Events - Player
export interface PlayerJoinPayload {
  pin: string;
  nickname: string;
}

export interface PlayerAnswerPayload {
  pin: string;
  optionIndex: number;
}

export interface PlayerLeavePayload {
  pin: string;
}

// Socket Events - Broadcast
export interface GameCreatedEvent {
  pin: string;
  quizTitle: string;
}

export interface PlayerJoinedEvent {
  player: Player;
  playerCount: number;
}

export interface PlayerLeftEvent {
  playerId: string;
  playerCount: number;
}

export interface GameStartedEvent {
  totalQuestions: number;
}

export interface QuestionEvent {
  questionIndex: number;
  question: {
    text: string;
    type: QuestionType;
    options: string[];
    timeLimit: number;
    points: number;
    imageUrl?: string;
  };
  totalQuestions: number;
}

export interface AnswerCountEvent {
  count: number;
  total: number;
}

export interface QuestionResultsEvent {
  correctIndex: number;
  answerCounts: number[];
  playerResult?: {
    isCorrect: boolean;
    pointsEarned: number;
    totalScore: number;
    responseTime: number;
  };
}

export interface LeaderboardEvent {
  rankings: LeaderboardEntry[];
  myRank?: number;
}

export interface GameFinishedEvent {
  podium: LeaderboardEntry[];
  allResults: LeaderboardEntry[];
}

// API Types
export interface CreateQuizInput {
  title: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateQuizInput {
  title?: string;
  description?: string;
  isPublic?: boolean;
}

export interface CreateQuestionInput {
  text: string;
  type: QuestionType;
  timeLimit?: number;
  points?: number;
  options: QuestionOption[];
  imageUrl?: string;
}

export interface UpdateQuestionInput {
  text?: string;
  type?: QuestionType;
  timeLimit?: number;
  points?: number;
  options?: QuestionOption[];
  imageUrl?: string;
}

export interface ReorderQuestionsInput {
  questionIds: string[];
}

// Constants
export const ANSWER_COLORS = [
  { bg: '#e21b3c', icon: 'triangle', name: 'red' },
  { bg: '#1368ce', icon: 'diamond', name: 'blue' },
  { bg: '#d89e00', icon: 'circle', name: 'yellow' },
  { bg: '#26890c', icon: 'square', name: 'green' },
] as const;

export const DEFAULT_TIME_LIMIT = 20;
export const MIN_TIME_LIMIT = 10;
export const MAX_TIME_LIMIT = 60;

export const DEFAULT_POINTS = 1000;
export const MIN_POINTS = 500;
export const MAX_POINTS = 2000;
