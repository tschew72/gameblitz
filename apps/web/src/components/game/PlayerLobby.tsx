'use client';

import { useGameStore } from '@/stores/gameStore';
import { FloatingParticles } from './FloatingParticles';

export function PlayerLobby() {
  const { nickname, pin, playerCount } = useGameStore();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative">
      <div className="game-bg" />
      <FloatingParticles count={15} />

      <div className="space-y-8 relative z-10 phase-enter">
        <div>
          <p className="text-white/60 text-sm uppercase tracking-widest mb-2">You&apos;re in as</p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-shadow-lg">{nickname}</h1>
        </div>

        <div className="orbit-loader mx-auto">
          <div className="orbit-dot" />
          <div className="orbit-dot" />
          <div className="orbit-dot" />
          <div className="orbit-dot" />
        </div>

        <p className="text-xl text-white/50">Waiting for host to start...</p>

        <div className="text-white/30 space-y-1">
          <p className="text-lg font-medium">{playerCount} player{playerCount !== 1 ? 's' : ''} in lobby</p>
          <p className="text-sm tracking-wider">PIN: {pin}</p>
        </div>
      </div>
    </main>
  );
}
