'use client';

import { useHostStore } from '@/stores/hostStore';
import { FloatingParticles } from '../game/FloatingParticles';
import toast from 'react-hot-toast';

interface HostLobbyProps {
  pin: string;
  quizTitle: string;
  isPublic: boolean;
  onExit: () => void;
}

export function HostLobby({ pin, quizTitle, isPublic, onExit }: HostLobbyProps) {
  const { players, playerCount, startGame, totalQuestions } = useHostStore();

  async function handleStart() {
    if (playerCount === 0) {
      toast.error('Wait for players to join');
      return;
    }
    const success = await startGame();
    if (!success) {
      toast.error('Failed to start game');
    }
  }

  return (
    <main className="min-h-screen flex flex-col p-4 relative">
      <div className="game-bg" />
      <FloatingParticles count={12} />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onExit} className="text-white/40 hover:text-white transition-colors text-sm">
            &larr; Exit
          </button>
          <span className="text-white/40 text-sm">{totalQuestions} questions</span>
        </div>

        {/* Title */}
        <div className="text-center mb-6 phase-enter">
          <h1 className="text-2xl font-bold mb-1">{quizTitle}</h1>
          <p className="text-white/40 text-sm">
            {isPublic
              ? 'Players can find this game on the browse page'
              : 'Share the PIN to let players join'}
          </p>
          {isPublic && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Publicly listed
            </span>
          )}
        </div>

        {/* PIN display */}
        <div className="card text-center mb-8 py-8 bg-white/5 border-white/10">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Game PIN</p>
          <div className="flex justify-center gap-2">
            {pin.split('').map((digit, i) => (
              <span
                key={i}
                className="pin-digit text-5xl md:text-7xl font-black"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {digit}
              </span>
            ))}
          </div>
        </div>

        {/* Players */}
        <div className="flex-1 mb-6">
          <h2 className="text-sm font-semibold mb-4 text-white/50 uppercase tracking-wider">
            Players ({playerCount})
          </h2>

          {playerCount === 0 ? (
            <div className="text-center py-12">
              <div className="orbit-loader mx-auto mb-4">
                <div className="orbit-dot" />
                <div className="orbit-dot" />
                <div className="orbit-dot" />
                <div className="orbit-dot" />
              </div>
              <p className="text-white/40">Waiting for players to join...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {players.map((player, i) => (
                <div
                  key={player.id}
                  className="player-card-enter bg-white/5 border border-white/10 rounded-xl p-3 text-center"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-brand-pink/40 to-purple-600/40 flex items-center justify-center ring-1 ring-white/10">
                    <span className="text-sm font-bold">{player.nickname[0].toUpperCase()}</span>
                  </div>
                  <p className="font-medium truncate text-xs">{player.nickname}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={playerCount === 0}
          className="btn-primary text-xl py-4"
        >
          {playerCount === 0 ? 'Waiting for players...' : `Start Game (${playerCount} players)`}
        </button>
      </div>
    </main>
  );
}
