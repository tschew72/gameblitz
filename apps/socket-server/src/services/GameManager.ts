import { Server } from 'socket.io';
import { prisma } from '@gameblitz/database';
import { calculateScore, createLeaderboard, calculateAnswerStats } from '@gameblitz/game-logic';
import type {
  GamePhase,
  Player,
  Answer,
  LeaderboardEntry,
  QuestionOption,
} from '@gameblitz/types';

interface GameState {
  id: string;
  pin: string;
  quizId: string;
  hostSocketId: string;
  phase: GamePhase;
  currentQuestionIndex: number;
  questionStartTime: number;
  players: Map<string, Player>;
  answers: Map<string, Answer>;
  questions: Array<{
    id: string;
    text: string;
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
    timeLimit: number;
    points: number;
    options: QuestionOption[];
  }>;
}

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private socketToGame: Map<string, string> = new Map();
  private socketToPlayer: Map<string, string> = new Map();

  async createGame(
    gameId: string,
    pin: string,
    hostSocketId: string
  ): Promise<GameState | null> {
    // Check if game already exists in memory (host reconnecting)
    const existingGame = this.games.get(pin);
    if (existingGame && existingGame.id === gameId) {
      // Update the host socket ID for reconnection
      const oldSocketId = existingGame.hostSocketId;
      existingGame.hostSocketId = hostSocketId;
      this.socketToGame.delete(oldSocketId);
      this.socketToGame.set(hostSocketId, pin);
      return existingGame;
    }

    // Fetch game and quiz data from database
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!game) return null;

    const gameState: GameState = {
      id: gameId,
      pin,
      quizId: game.quizId,
      hostSocketId,
      phase: 'lobby',
      currentQuestionIndex: -1,
      questionStartTime: 0,
      players: new Map(),
      answers: new Map(),
      questions: game.quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        timeLimit: q.timeLimit,
        points: q.points,
        options: q.options as QuestionOption[],
      })),
    };

    this.games.set(pin, gameState);
    this.socketToGame.set(hostSocketId, pin);

    return gameState;
  }

  getGame(pin: string): GameState | undefined {
    return this.games.get(pin);
  }

  getGameBySocketId(socketId: string): GameState | undefined {
    const pin = this.socketToGame.get(socketId);
    return pin ? this.games.get(pin) : undefined;
  }

  addPlayer(pin: string, socketId: string, nickname: string): Player | null {
    const game = this.games.get(pin);
    if (!game || game.phase !== 'lobby') return null;

    // Check for duplicate nickname
    for (const player of game.players.values()) {
      if (player.nickname.toLowerCase() === nickname.toLowerCase()) {
        return null;
      }
    }

    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const player: Player = {
      id: playerId,
      socketId,
      nickname,
      score: 0,
      currentStreak: 0,
      joinedAt: Date.now(),
    };

    game.players.set(socketId, player);
    this.socketToGame.set(socketId, pin);
    this.socketToPlayer.set(socketId, playerId);

    return player;
  }

  removePlayer(socketId: string): { pin: string; playerId: string } | null {
    const pin = this.socketToGame.get(socketId);
    if (!pin) return null;

    const game = this.games.get(pin);
    if (!game) return null;

    const player = game.players.get(socketId);
    if (!player) return null;

    game.players.delete(socketId);
    this.socketToGame.delete(socketId);
    this.socketToPlayer.delete(socketId);

    return { pin, playerId: player.id };
  }

  startGame(pin: string): boolean {
    const game = this.games.get(pin);
    if (!game || game.phase !== 'lobby' || game.players.size === 0) {
      return false;
    }

    game.phase = 'question';
    game.currentQuestionIndex = 0;
    return true;
  }

  getCurrentQuestion(pin: string): {
    question: GameState['questions'][0];
    index: number;
    total: number;
  } | null {
    const game = this.games.get(pin);
    if (!game || game.currentQuestionIndex < 0) return null;

    const question = game.questions[game.currentQuestionIndex];
    if (!question) return null;

    game.questionStartTime = Date.now();
    game.answers.clear();

    return {
      question,
      index: game.currentQuestionIndex,
      total: game.questions.length,
    };
  }

  submitAnswer(pin: string, socketId: string, optionIndex: number): Answer | null {
    const game = this.games.get(pin);
    if (!game || game.phase !== 'question') return null;

    const player = game.players.get(socketId);
    if (!player) return null;

    // Already answered
    if (game.answers.has(socketId)) return null;

    const responseTime = Date.now() - game.questionStartTime;
    const answer: Answer = {
      playerId: player.id,
      optionIndex,
      timestamp: Date.now(),
      responseTime,
    };

    game.answers.set(socketId, answer);

    // Calculate score
    const question = game.questions[game.currentQuestionIndex];
    const correctIndex = question.options.findIndex((o) => o.isCorrect);
    const isCorrect = optionIndex === correctIndex;
    const pointsEarned = calculateScore(
      isCorrect,
      responseTime,
      question.timeLimit * 1000,
      question.points
    );

    player.score += pointsEarned;
    player.currentStreak = isCorrect ? player.currentStreak + 1 : 0;

    return answer;
  }

  getAnswerCount(pin: string): { count: number; total: number } {
    const game = this.games.get(pin);
    if (!game) return { count: 0, total: 0 };

    return {
      count: game.answers.size,
      total: game.players.size,
    };
  }

  revealAnswer(pin: string): {
    correctIndex: number;
    answerCounts: number[];
    playerResults: Map<
      string,
      { isCorrect: boolean; pointsEarned: number; totalScore: number; responseTime: number }
    >;
  } | null {
    const game = this.games.get(pin);
    if (!game) return null;

    const question = game.questions[game.currentQuestionIndex];
    const correctIndex = question.options.findIndex((o) => o.isCorrect);

    const stats = calculateAnswerStats(
      Array.from(game.answers.values()),
      question.options.length,
      correctIndex
    );

    const playerResults = new Map<
      string,
      { isCorrect: boolean; pointsEarned: number; totalScore: number; responseTime: number }
    >();

    for (const [socketId, answer] of game.answers.entries()) {
      const player = game.players.get(socketId);
      if (!player) continue;

      const isCorrect = answer.optionIndex === correctIndex;
      const pointsEarned = calculateScore(
        isCorrect,
        answer.responseTime,
        question.timeLimit * 1000,
        question.points
      );

      playerResults.set(socketId, {
        isCorrect,
        pointsEarned,
        totalScore: player.score,
        responseTime: answer.responseTime,
      });
    }

    game.phase = 'results';

    return {
      correctIndex,
      answerCounts: stats.answerCounts,
      playerResults,
    };
  }

  getLeaderboard(pin: string): LeaderboardEntry[] {
    const game = this.games.get(pin);
    if (!game) return [];

    game.phase = 'leaderboard';
    const players = Array.from(game.players.values());
    return createLeaderboard(players);
  }

  nextQuestion(pin: string): boolean {
    const game = this.games.get(pin);
    if (!game) return false;

    game.currentQuestionIndex++;
    if (game.currentQuestionIndex >= game.questions.length) {
      return false;
    }

    game.phase = 'question';
    return true;
  }

  async finishGame(pin: string): Promise<LeaderboardEntry[]> {
    const game = this.games.get(pin);
    if (!game) return [];

    game.phase = 'finished';
    const players = Array.from(game.players.values());
    const leaderboard = createLeaderboard(players);

    // Save results to database
    try {
      await prisma.game.update({
        where: { id: game.id },
        data: {
          status: 'FINISHED',
          endedAt: new Date(),
          results: leaderboard,
        },
      });
    } catch (error) {
      console.error('Failed to save game results:', error);
    }

    return leaderboard;
  }

  handleDisconnect(socketId: string, io: Server) {
    // Check if it's a host
    const game = this.getGameBySocketId(socketId);
    if (game && game.hostSocketId === socketId) {
      // Host disconnected - notify all players
      io.to(game.pin).emit('game:host-disconnected');
      // Clean up game after a delay (could implement reconnection logic)
      setTimeout(() => {
        if (this.games.get(game.pin)?.hostSocketId === socketId) {
          this.cleanupGame(game.pin, io);
        }
      }, 30000);
      return;
    }

    // Check if it's a player
    const result = this.removePlayer(socketId);
    if (result) {
      io.to(result.pin).emit('game:player-left', {
        playerId: result.playerId,
        playerCount: this.games.get(result.pin)?.players.size || 0,
      });
    }
  }

  cleanupGame(pin: string, io: Server) {
    const game = this.games.get(pin);
    if (!game) return;

    // Remove all socket mappings
    this.socketToGame.delete(game.hostSocketId);
    for (const socketId of game.players.keys()) {
      this.socketToGame.delete(socketId);
      this.socketToPlayer.delete(socketId);
    }

    // Notify remaining players
    io.to(pin).emit('game:ended');

    // Remove game
    this.games.delete(pin);
  }

  getPlayerRank(pin: string, socketId: string): number | null {
    const game = this.games.get(pin);
    if (!game) return null;

    const player = game.players.get(socketId);
    if (!player) return null;

    const leaderboard = createLeaderboard(Array.from(game.players.values()));
    const entry = leaderboard.find((e) => e.playerId === player.id);
    return entry?.rank || null;
  }
}
