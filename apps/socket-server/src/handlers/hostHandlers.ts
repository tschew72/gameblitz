import { Server, Socket } from 'socket.io';
import { GameManager } from '../services/GameManager';
import type {
  HostCreateGamePayload,
  HostStartGamePayload,
  HostNextQuestionPayload,
  HostRevealAnswerPayload,
  HostShowLeaderboardPayload,
  HostEndGamePayload,
} from '@gameblitz/types';

export function registerHostHandlers(io: Server, socket: Socket, gameManager: GameManager) {
  // Host creates a game session
  socket.on('host:create-game', async (payload: HostCreateGamePayload, callback) => {
    const { quizId, hostId } = payload;

    try {
      // Fetch game from database by quizId and hostId
      const { prisma } = await import('@gameblitz/database');
      const game = await prisma.game.findFirst({
        where: {
          quizId,
          hostId,
          status: 'LOBBY',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!game) {
        callback({ error: 'Game not found' });
        return;
      }

      const gameState = await gameManager.createGame(game.id, game.pin, socket.id);
      if (!gameState) {
        callback({ error: 'Failed to create game session' });
        return;
      }

      socket.join(game.pin);
      callback({
        success: true,
        pin: game.pin,
        totalQuestions: gameState.questions.length,
      });
    } catch (error) {
      console.error('Error creating game:', error);
      callback({ error: 'Internal server error' });
    }
  });

  // Host starts the game
  socket.on('host:start-game', (payload: HostStartGamePayload, callback) => {
    const { pin } = payload;
    const game = gameManager.getGame(pin);

    if (!game) {
      callback({ error: 'Game not found' });
      return;
    }

    if (game.hostSocketId !== socket.id) {
      callback({ error: 'Not authorized' });
      return;
    }

    if (!gameManager.startGame(pin)) {
      callback({ error: 'Cannot start game' });
      return;
    }

    // Notify all players
    io.to(pin).emit('game:started', {
      totalQuestions: game.questions.length,
    });

    // Send first question
    const questionData = gameManager.getCurrentQuestion(pin);
    if (questionData) {
      io.to(pin).emit('game:question', {
        questionIndex: questionData.index,
        question: {
          text: questionData.question.text,
          type: questionData.question.type,
          options: questionData.question.options.map((o) => o.text),
          timeLimit: questionData.question.timeLimit,
          points: questionData.question.points,
        },
        totalQuestions: questionData.total,
      });
    }

    callback({ success: true });
  });

  // Host reveals answer
  socket.on('host:reveal-answer', (payload: HostRevealAnswerPayload, callback) => {
    const { pin } = payload;
    const game = gameManager.getGame(pin);

    if (!game || game.hostSocketId !== socket.id) {
      callback({ error: 'Not authorized' });
      return;
    }

    const results = gameManager.revealAnswer(pin);
    if (!results) {
      callback({ error: 'Cannot reveal answer' });
      return;
    }

    // Send results to host
    io.to(game.hostSocketId).emit('game:question-results', {
      correctIndex: results.correctIndex,
      answerCounts: results.answerCounts,
    });

    // Send individual results to each player
    for (const [socketId, playerResult] of results.playerResults.entries()) {
      io.to(socketId).emit('game:question-results', {
        correctIndex: results.correctIndex,
        answerCounts: results.answerCounts,
        playerResult,
      });
    }

    // Send to players who didn't answer
    for (const [socketId] of game.players.entries()) {
      if (!results.playerResults.has(socketId)) {
        io.to(socketId).emit('game:question-results', {
          correctIndex: results.correctIndex,
          answerCounts: results.answerCounts,
          playerResult: {
            isCorrect: false,
            pointsEarned: 0,
            totalScore:
              Array.from(game.players.values()).find((p) => p.socketId === socketId)?.score || 0,
            responseTime: 0,
          },
        });
      }
    }

    callback({ success: true });
  });

  // Host shows leaderboard
  socket.on('host:show-leaderboard', (payload: HostShowLeaderboardPayload, callback) => {
    const { pin } = payload;
    const game = gameManager.getGame(pin);

    if (!game || game.hostSocketId !== socket.id) {
      callback({ error: 'Not authorized' });
      return;
    }

    const leaderboard = gameManager.getLeaderboard(pin);

    // Send leaderboard to host
    io.to(game.hostSocketId).emit('game:leaderboard', {
      rankings: leaderboard,
    });

    // Send to each player with their rank
    for (const [socketId, player] of game.players.entries()) {
      const myRank = leaderboard.find((e) => e.playerId === player.id)?.rank;
      io.to(socketId).emit('game:leaderboard', {
        rankings: leaderboard.slice(0, 5),
        myRank,
      });
    }

    callback({ success: true });
  });

  // Host moves to next question
  socket.on('host:next-question', (payload: HostNextQuestionPayload, callback) => {
    const { pin } = payload;
    const game = gameManager.getGame(pin);

    if (!game || game.hostSocketId !== socket.id) {
      callback({ error: 'Not authorized' });
      return;
    }

    if (!gameManager.nextQuestion(pin)) {
      callback({ error: 'No more questions', isLastQuestion: true });
      return;
    }

    const questionData = gameManager.getCurrentQuestion(pin);
    if (questionData) {
      io.to(pin).emit('game:question', {
        questionIndex: questionData.index,
        question: {
          text: questionData.question.text,
          type: questionData.question.type,
          options: questionData.question.options.map((o) => o.text),
          timeLimit: questionData.question.timeLimit,
          points: questionData.question.points,
        },
        totalQuestions: questionData.total,
      });
    }

    callback({ success: true });
  });

  // Host ends the game
  socket.on('host:end-game', async (payload: HostEndGamePayload, callback) => {
    const { pin } = payload;
    const game = gameManager.getGame(pin);

    if (!game || game.hostSocketId !== socket.id) {
      callback({ error: 'Not authorized' });
      return;
    }

    const finalResults = await gameManager.finishGame(pin);

    // Send final results to everyone
    io.to(pin).emit('game:finished', {
      podium: finalResults.slice(0, 3),
      allResults: finalResults,
    });

    callback({ success: true });
  });
}
