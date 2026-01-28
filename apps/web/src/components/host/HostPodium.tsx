'use client';

import { useHostStore } from '@/stores/hostStore';
import { Confetti } from '../game/Confetti';
import { FloatingParticles } from '../game/FloatingParticles';

interface HostPodiumProps {
  onExit: () => void;
}

export function HostPodium({ onExit }: HostPodiumProps) {
  const { leaderboard } = useHostStore();

  const podium = leaderboard.slice(0, 3);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="game-bg" />
      <FloatingParticles count={25} colors={['#ffd700', '#ff3355', '#54a0ff', '#5f27cd']} />
      <Confetti active={true} count={120} />

      <div className="w-full max-w-2xl text-center relative z-10">
        <h1 className="text-5xl md:text-6xl font-black mb-10 podium-title">Final Results!</h1>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 md:gap-5 h-72 mb-10">
          {/* 2nd */}
          {podium[1] && (
            <div className="flex flex-col items-center w-28">
              <div className="podium-name podium-name-2nd text-center">
                <p className="font-bold truncate text-sm">{podium[1].nickname}</p>
                <p className="text-white/50 text-xs mb-2">{podium[1].score.toLocaleString()}</p>
              </div>
              <div className="w-full h-32 rounded-t-2xl flex items-end justify-center pb-4 podium-bar podium-bar-2nd rank-badge-silver">
                <span className="text-4xl font-black text-white/80">2</span>
              </div>
            </div>
          )}

          {/* 1st */}
          {podium[0] && (
            <div className="flex flex-col items-center w-32">
              <div className="podium-name podium-name-1st text-center">
                <span className="text-4xl block crown-bounce">👑</span>
                <p className="font-bold text-lg truncate">{podium[0].nickname}</p>
                <p className="text-white/50 text-sm mb-2">{podium[0].score.toLocaleString()}</p>
              </div>
              <div className="w-full h-48 rounded-t-2xl flex items-end justify-center pb-5 podium-bar podium-bar-1st rank-badge-gold">
                <span className="text-5xl font-black text-white/90">1</span>
              </div>
            </div>
          )}

          {/* 3rd */}
          {podium[2] && (
            <div className="flex flex-col items-center w-24">
              <div className="podium-name podium-name-3rd text-center">
                <p className="font-bold truncate text-sm">{podium[2].nickname}</p>
                <p className="text-white/50 text-xs mb-2">{podium[2].score.toLocaleString()}</p>
              </div>
              <div className="w-full h-24 rounded-t-2xl flex items-end justify-center pb-3 podium-bar podium-bar-3rd rank-badge-bronze">
                <span className="text-3xl font-black text-white/70">3</span>
              </div>
            </div>
          )}
        </div>

        {/* All results */}
        {leaderboard.length > 3 && (
          <div className="card max-h-52 overflow-y-auto mb-8 bg-white/5 phase-enter" style={{ animationDelay: '1.5s' }}>
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wider text-white/40">All Players</h2>
            <div className="space-y-2">
              {leaderboard.slice(3).map((entry) => (
                <div key={entry.playerId} className="flex items-center gap-3 text-sm py-1">
                  <span className="w-6 text-white/40 tabular-nums">#{entry.rank}</span>
                  <span className="flex-1 truncate">{entry.nickname}</span>
                  <span className="font-semibold tabular-nums">{entry.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onExit} className="btn-primary text-lg w-full animate-fadeIn" style={{ animationDelay: '1.8s' }}>
          Back to Dashboard
        </button>
      </div>
    </main>
  );
}
