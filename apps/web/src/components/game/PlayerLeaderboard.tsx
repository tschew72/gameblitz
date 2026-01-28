'use client';

import { useGameStore } from '@/stores/gameStore';

export function PlayerLeaderboard() {
  const { leaderboard, myRank, nickname } = useGameStore();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="game-bg" />

      <div className="w-full max-w-md space-y-8 relative z-10 phase-enter">
        {/* Your rank */}
        <div className="text-center">
          <p className="text-white/40 text-sm uppercase tracking-wider mb-2">Your rank</p>
          <p className="text-7xl font-black text-brand-pink score-glow">#{myRank}</p>
          <p className="text-lg mt-2 text-white/70">{nickname}</p>
        </div>

        {/* Top 5 */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-4 text-center uppercase tracking-wider text-white/50">
            Leaderboard
          </h2>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((entry, index) => (
              <div
                key={entry.playerId}
                className={`lb-row flex items-center gap-4 p-3 rounded-lg ${
                  entry.rank === myRank ? 'bg-brand-pink/20 ring-1 ring-brand-pink/40' : 'bg-white/5'
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0
                      ? 'rank-badge-gold'
                      : index === 1
                        ? 'rank-badge-silver'
                        : index === 2
                          ? 'rank-badge-bronze'
                          : 'bg-white/20'
                  }`}
                >
                  {entry.rank}
                </span>
                <span className="flex-1 font-semibold truncate">{entry.nickname}</span>
                <span className="font-bold tabular-nums">{entry.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
