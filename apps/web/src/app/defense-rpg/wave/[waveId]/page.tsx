'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getWave, PILLAR_INFO } from '../../data/content';
import { useRPGProgress } from '../../hooks/useRPGProgress';

const GAME_TYPE_INFO = {
  'hero-quest': { bg: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30' },
  'dungeon-crawl': { bg: 'from-emerald-500/20 to-cyan-500/20', border: 'border-emerald-500/30' },
  'pillar-warriors': { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
  'boss-raid': { bg: 'from-amber-500/20 to-red-500/20', border: 'border-amber-500/30' },
};

export default function WaveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const waveId = parseInt(params.waveId as string, 10);
  const wave = getWave(waveId);

  const { isLoaded, characterStats, isWaveUnlocked, isGameComplete, getGameScore, getWaveProgress } = useRPGProgress();

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!wave) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
        <h1 className="text-2xl font-bold mb-4">Chapter not found</h1>
        <Link href="/defense-rpg" className="text-purple-400 hover:underline">
          Back to Quest Hub
        </Link>
      </main>
    );
  }

  if (!isWaveUnlocked(waveId)) {
    router.push('/defense-rpg');
    return null;
  }

  if (!characterStats) {
    router.push('/defense-rpg');
    return null;
  }

  const pillarInfo = PILLAR_INFO[characterStats.class];
  const progress = getWaveProgress(waveId);
  const progressPercent = (progress.completed / progress.total) * 100;

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950" />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto p-4 pb-24">
        {/* Header */}
        <div className="py-6 phase-enter">
          <Link
            href="/defense-rpg"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-4"
          >
            ← Back to Quest Hub
          </Link>

          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black mx-auto mb-4"
            style={{ backgroundColor: wave.color + '40' }}
          >
            {waveId}
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-center" style={{ color: wave.color }}>
            Chapter {waveId}: {wave.title}
          </h1>
          <p className="text-white/50 text-center mt-2">{wave.description}</p>
        </div>

        {/* Story Intro */}
        <div
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 mb-6 phase-enter"
          style={{ animationDelay: '0.1s' }}
        >
          <p className="text-white/70 italic text-center">"{wave.storyIntro}"</p>
        </div>

        {/* Progress */}
        <div
          className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 mb-6 phase-enter"
          style={{ animationDelay: '0.15s' }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60 text-sm">Chapter Progress</span>
            <span className="font-bold" style={{ color: wave.color }}>
              {progress.completed}/{progress.total}
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%`, backgroundColor: wave.color }}
            />
          </div>
        </div>

        {/* Character mini-card */}
        <div
          className="flex items-center gap-3 bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/10 mb-6 phase-enter"
          style={{ animationDelay: '0.2s' }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: pillarInfo.color + '40' }}
          >
            {pillarInfo.icon}
          </div>
          <div className="flex-1">
            <span className="font-bold text-sm" style={{ color: pillarInfo.color }}>
              {pillarInfo.class}
            </span>
            <span className="text-white/40 text-sm ml-2">Lv.{characterStats.level}</span>
          </div>
          <div className="text-right">
            <span className="text-red-400 text-sm">❤️ {characterStats.maxHP}</span>
          </div>
        </div>

        {/* Quest List */}
        <h2 className="text-lg font-bold mb-4 text-white/80">Quests</h2>
        <div className="space-y-3">
          {wave.games.map((game, index) => {
            const completed = isGameComplete(waveId, game.id);
            const score = getGameScore(waveId, game.id);
            const typeInfo = GAME_TYPE_INFO[game.type];

            return (
              <Link
                key={game.id}
                href={`/defense-rpg/wave/${waveId}/game/${game.id}`}
                className={`block bg-gradient-to-r ${typeInfo.bg} backdrop-blur-xl rounded-xl p-4 border ${typeInfo.border} hover:scale-[1.02] transition-all phase-enter`}
                style={{ animationDelay: `${0.25 + index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                    {completed ? '✅' : game.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{game.title}</h3>
                    <p className="text-sm text-white/50">{game.description}</p>
                    {completed && (
                      <p className="text-xs text-amber-400 mt-1">Score: {score.toLocaleString()}</p>
                    )}
                  </div>
                  <span className="text-white/30 text-xl">→</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Completion Reward */}
        {progress.completed === progress.total && waveId < 4 && (
          <div
            className="mt-8 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-2xl p-6 border border-amber-500/30 text-center phase-enter"
            style={{ animationDelay: '0.5s' }}
          >
            <span className="text-4xl">🎉</span>
            <h3 className="text-xl font-bold text-amber-400 mt-2">Chapter Complete!</h3>
            <p className="text-white/60 text-sm mt-1">Chapter {waveId + 1} has been unlocked!</p>
            <Link
              href={`/defense-rpg/wave/${waveId + 1}`}
              className="inline-block mt-4 px-6 py-2 bg-amber-500 rounded-xl font-bold hover:bg-amber-400 transition-colors"
            >
              Continue to Chapter {waveId + 1}
            </Link>
          </div>
        )}

        {progress.completed === progress.total && waveId === 4 && (
          <div
            className="mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30 text-center phase-enter"
            style={{ animationDelay: '0.5s' }}
          >
            <span className="text-4xl">👑</span>
            <h3 className="text-xl font-bold text-purple-400 mt-2">Legendary Guardian!</h3>
            <p className="text-white/60 text-sm mt-1">You have completed all chapters and mastered Total Defence!</p>
          </div>
        )}
      </div>
    </main>
  );
}
