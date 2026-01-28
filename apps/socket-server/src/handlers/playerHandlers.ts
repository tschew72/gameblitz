import { Server, Socket } from 'socket.io';
import { GameManager } from '../services/GameManager';
import { isValidNickname } from '@gameblitz/game-logic';
import type { PlayerJoinPayload, PlayerAnswerPayload, PlayerLeavePayload } from '@gameblitz/types';

export function registerPlayerHandlers(io: Server, socket: Socket, gameManager: GameManager) {
  // Player joins game
  socket.on('player:join', (payload: PlayerJoinPayload, callback) => {
    const { pin, nickname } = payload;

    // Validate nickname
    if (!isValidNickname(nickname)) {
      callback({ error: 'Invalid nickname (1-20 characters)' });
      return;
    }

    const game = gameManager.getGame(pin);
    if (!game) {
      callback({ error: 'Game not found' });
      return;
    }

    if (game.phase !== 'lobby') {
      callback({ error: 'Game already started' });
      return;
    }

    const player = gameManager.addPlayer(pin, socket.id, nickname.trim());
    if (!player) {
      callback({ error: 'Nickname already taken' });
      return;
    }

    socket.join(pin);

    // Notify host and other players
    io.to(pin).emit('game:player-joined', {
      player: {
        id: player.id,
        nickname: player.nickname,
        score: 0,
      },
      playerCount: game.players.size,
    });

    callback({
      success: true,
      playerId: player.id,
    });
  });

  // Player submits answer
  socket.on('player:answer', (payload: PlayerAnswerPayload, callback) => {
    const { pin, optionIndex } = payload;

    const game = gameManager.getGame(pin);
    if (!game) {
      callback({ error: 'Game not found' });
      return;
    }

    const answer = gameManager.submitAnswer(pin, socket.id, optionIndex);
    if (!answer) {
      callback({ error: 'Cannot submit answer' });
      return;
    }

    // Update answer count for host
    const counts = gameManager.getAnswerCount(pin);
    io.to(game.hostSocketId).emit('game:answer-count', counts);

    callback({ success: true });
  });

  // Player leaves game
  socket.on('player:leave', (payload: PlayerLeavePayload, callback) => {
    const { pin } = payload;

    const result = gameManager.removePlayer(socket.id);
    if (result) {
      socket.leave(pin);
      io.to(pin).emit('game:player-left', {
        playerId: result.playerId,
        playerCount: gameManager.getGame(pin)?.players.size || 0,
      });
    }

    callback({ success: true });
  });
}
