'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { Confetti } from './Confetti';

export function PlayerPodium() {
  const router = useRouter();
  const { finalResults, nickname, leaveGame } = useGameStore();

  if (!finalResults) return null;

  const myResult = finalResults.allResults.find((r) => r.nickname === nickname);
  const podium = finalResults.podium;
  const isTop3 = myResult && myResult.rank <= 3;

  function handlePlayAgain() {
    leaveGame();
    router.push('/play');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="game-bg" />
      <Confetti active={!!isTop3} count={100} />

      <div className="w-full max-w-lg space-y-8 text-center relative z-10">
        <h1 className="text-5xl font-black podium-title">Game Over!</h1>

        {/* Your result */}
        {myResult && (
          <div className="card bg-brand-pink/10 ring-1 ring-brand-pink/30 phase-enter">
            <p className="text-white/50 text-sm uppercase tracking-wider mb-1">You finished</p>
            <p className="text-6xl font-black text-brand-pink score-glow">#{myResult.rank}</p>
            <p className="text-lg mt-2 font-semibold">{myResult.score.toLocaleString()} points</p>
          </div>
        )}

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 h-56 pt-4">
          {/* 2nd */}
          {podium[1] && (
            <div className="flex flex-col items-center w-24">
              <div className="podium-name podium-name-2nd">
                <p className="font-bold truncate text-sm mb-1">{podium[1].nickname}</p>
                <p className="text-white/50 text-xs mb-2">{podium[1].score.toLocaleString()}</p>
              </div>
              <div className="w-full h-28 rounded-t-xl flex items-end justify-center pb-3 podium-bar podium-bar-2nd rank-badge-silver">
                <span className="text-3xl font-black text-white/80">2</span>
              </div>
            </div>
          )}

          {/* 1st */}
          {podium[0] && (
            <div className="flex flex-col items-center w-28">
              <div className="podium-name podium-name-1st">
                <span className="text-3xl block crown-bounce">👑</span>
                <p className="font-bold truncate text-sm mb-1">{podium[0].nickname}</p>
                <p className="text-white/50 text-xs mb-2">{podium[0].score.toLocaleString()}</p>
              </div>
              <div className="w-full h-40 rounded-t-xl flex items-end justify-center pb-3 podium-bar podium-bar-1st rank-badge-gold">
                <span className="text-4xl font-black text-white/90">1</span>
              </div>
            </div>
          )}

          {/* 3rd */}
          {podium[2] && (
            <div className="flex flex-col items-center w-20">
              <div className="podium-name podium-name-3rd">
                <p className="font-bold truncate text-sm mb-1">{podium[2].nickname}</p>
                <p className="text-white/50 text-xs mb-2">{podium[2].score.toLocaleString()}</p>
              </div>
              <div className="w-full h-20 rounded-t-xl flex items-end justify-center pb-3 podium-bar podium-bar-3rd rank-badge-bronze">
                <span className="text-2xl font-black text-white/70">3</span>
              </div>
            </div>
          )}
        </div>

        <button onClick={handlePlayAgain} className="btn-primary text-lg w-full animate-fadeIn" style={{ animationDelay: '1.6s' }}>
          Play Again
        </button>
      </div>
    </main>
  );
}
