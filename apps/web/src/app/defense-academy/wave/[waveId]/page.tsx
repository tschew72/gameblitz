'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getWave, PILLAR_INFO } from '../../data/content';
import { useAcademyProgress } from '../../hooks/useAcademyProgress';

export default function WaveDetailPage() {
  const params = useParams();
  const waveId = parseInt(params.waveId as string, 10);
  const wave = getWave(waveId);

  const { isLoaded, isWaveUnlocked, isGameComplete, getGameScore, getWaveProgress, getWaveScore } = useAcademyProgress();

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!wave) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 p-4">
        <h1 className="text-2xl font-bold mb-4">Wave not found</h1>
        <Link href="/defense-academy" className="text-cyan-400 hover:underline">
          Back to Academy
        </Link>
      </main>
    );
  }

  if (!isWaveUnlocked(waveId)) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 p-4 text-center">
        <span className="text-8xl mb-6">🔒</span>
        <h1 className="text-3xl font-bold mb-2">Wave Locked</h1>
        <p className="text-white/60 mb-8">Complete Wave {waveId - 1} to unlock this wave</p>
        <Link
          href="/defense-academy"
          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold hover:scale-105 transition-transform"
        >
          Back to Academy
        </Link>
      </main>
    );
  }

  const progress = getWaveProgress(waveId);
  const waveScore = getWaveScore(waveId);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900" />
      <div
        className="fixed inset-0 opacity-10"
        style={{ background: `radial-gradient(circle at 50% 0%, ${wave.color}, transparent 50%)` }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 phase-enter">
          <Link
            href="/defense-academy"
            className="inline-flex items-center text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Academy
          </Link>

          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black"
              style={{ backgroundColor: wave.color, boxShadow: `0 0 40px ${wave.color}50` }}
            >
              {wave.id}
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider opacity-60" style={{ color: wave.color }}>
                Wave {wave.id} · {wave.subtitle}
              </p>
              <h1 className="text-4xl font-black">{wave.title}</h1>
              <p className="text-white/60">{wave.description}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 mb-8 border border-white/10 phase-enter" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60">{progress.completed} of {progress.total} games complete</span>
            <span className="font-bold text-xl" style={{ color: wave.color }}>
              {waveScore.toLocaleString()} pts
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress.percentage}%`,
                backgroundColor: progress.percentage === 100 ? '#22c55e' : wave.color,
              }}
            />
          </div>
          {progress.percentage === 100 && (
            <p className="text-green-400 text-sm mt-2 text-center">Wave Complete! Next wave unlocked.</p>
          )}
        </div>

        {/* Pillars */}
        <div className="flex justify-center gap-4 mb-8 phase-enter" style={{ animationDelay: '0.15s' }}>
          {wave.pillars.map((pillar) => (
            <div
              key={pillar}
              className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10"
            >
              <span className="text-2xl">{PILLAR_INFO[pillar].icon}</span>
              <span className="text-sm text-white/70">{PILLAR_INFO[pillar].name}</span>
            </div>
          ))}
        </div>

        {/* Games Grid */}
        <div className="grid gap-4">
          {wave.games.map((game, index) => {
            const complete = isGameComplete(waveId, game.id);
            const score = getGameScore(waveId, game.id);

            return (
              <Link
                key={game.id}
                href={`/defense-academy/wave/${waveId}/game/${game.id}`}
                className="phase-enter"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div
                  className={`relative bg-white/5 backdrop-blur-xl rounded-2xl p-5 border transition-all hover:scale-[1.02] overflow-hidden group ${
                    complete ? 'border-green-500/30' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {/* Background effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                    style={{ background: `linear-gradient(90deg, ${wave.color}, transparent)` }}
                  />

                  <div className="relative z-10 flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                      style={{
                        backgroundColor: complete ? '#22c55e20' : `${wave.color}20`,
                        border: `2px solid ${complete ? '#22c55e50' : wave.color}50`,
                      }}
                    >
                      {complete ? '✓' : game.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{game.title}</h3>
                      <p className="text-white/50 text-sm">{game.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                          {game.questions.length} questions
                        </span>
                        <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                          {game.type.replace('-', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      {complete ? (
                        <>
                          <p className="text-2xl font-bold text-green-400">{score.toLocaleString()}</p>
                          <p className="text-xs text-white/50">Best Score</p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-white/30">—</p>
                          <p className="text-xs text-white/50">Not played</p>
                        </>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="text-white/30 group-hover:text-white/60 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Hint */}
        <div className="mt-8 text-center text-white/40 text-sm">
          <p>Complete all 4 games to unlock the next wave!</p>
        </div>
      </div>
    </main>
  );
}
