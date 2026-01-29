'use client';

import Link from 'next/link';
import { WAVES, PILLAR_INFO } from './data/content';
import { useAcademyProgress } from './hooks/useAcademyProgress';

export default function DefenceAcademyPage() {
  const { isLoaded, isWaveUnlocked, getWaveProgress, getWaveScore, getTotalScore, getFactsLearned } = useAcademyProgress();

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const totalScore = getTotalScore();
  const factsLearned = getFactsLearned();

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900" />
      <div className="fixed inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10 phase-enter">
          <Link href="/" className="inline-block text-white/40 hover:text-white text-sm mb-4 transition-colors">
            ← Back to GameBlitz
          </Link>

          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
            <span className="text-3xl sm:text-5xl">🎓</span>
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent">
                Defence Academy
              </h1>
              <p className="text-white/60 text-sm sm:text-lg">Learn & Play - Knowledge is Power</p>
            </div>
            <span className="text-3xl sm:text-5xl">🇸🇬</span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-10 phase-enter" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/10 text-center">
            <p className="text-lg sm:text-3xl font-black text-cyan-400">{totalScore.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-white/50">Total Score</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/10 text-center">
            <p className="text-lg sm:text-3xl font-black text-purple-400">{factsLearned.length}</p>
            <p className="text-[10px] sm:text-xs text-white/50">Facts Learned</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/10 text-center">
            <p className="text-lg sm:text-3xl font-black text-green-400">
              {WAVES.filter((w) => getWaveProgress(w.id).percentage === 100).length}/4
            </p>
            <p className="text-[10px] sm:text-xs text-white/50">Complete</p>
          </div>
        </div>

        {/* Wave Cards */}
        <div className="grid gap-4">
          {WAVES.map((wave, index) => {
            const unlocked = isWaveUnlocked(wave.id);
            const progress = getWaveProgress(wave.id);
            const waveScore = getWaveScore(wave.id);

            return (
              <div
                key={wave.id}
                className="phase-enter"
                style={{ animationDelay: `${0.15 + index * 0.1}s` }}
              >
                {unlocked ? (
                  <Link href={`/defense-academy/wave/${wave.id}`}>
                    <div
                      className="relative bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] overflow-hidden group"
                    >
                      {/* Background glow */}
                      <div
                        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                        style={{ background: `radial-gradient(circle at 0% 50%, ${wave.color}, transparent 50%)` }}
                      />

                      <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                        {/* Wave number */}
                        <div
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shrink-0"
                          style={{ backgroundColor: wave.color }}
                        >
                          {wave.id}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium uppercase tracking-wider opacity-60" style={{ color: wave.color }}>
                            {wave.subtitle}
                          </p>
                          <h2 className="text-lg sm:text-2xl font-bold truncate">{wave.title}</h2>
                          <p className="text-white/50 text-xs sm:text-sm line-clamp-1">{wave.description}</p>

                          {/* Pillars */}
                          <div className="flex gap-1 sm:gap-2 mt-1 sm:mt-2">
                            {wave.pillars.map((pillar) => (
                              <span
                                key={pillar}
                                className="text-sm sm:text-lg"
                                title={PILLAR_INFO[pillar].name}
                              >
                                {PILLAR_INFO[pillar].icon}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="text-right shrink-0">
                          <p className="text-lg sm:text-2xl font-black" style={{ color: wave.color }}>
                            {waveScore.toLocaleString()}
                          </p>
                          <p className="text-[10px] sm:text-xs text-white/50">pts</p>
                          <div className="mt-1 sm:mt-2 w-16 sm:w-24 h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${progress.percentage}%`,
                                backgroundColor: progress.percentage === 100 ? '#22c55e' : wave.color,
                              }}
                            />
                          </div>
                          <p className="text-[10px] sm:text-xs text-white/40 mt-1">{progress.completed}/4</p>
                        </div>

                        {/* Arrow - hide on mobile */}
                        <div className="hidden sm:block text-white/30 group-hover:text-white/60 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Complete badge */}
                      {progress.percentage === 100 && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          ✓ COMPLETE
                        </div>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="relative bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/5 opacity-50">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl bg-white/10 shrink-0">
                        🔒
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-white/40">
                          Locked
                        </p>
                        <h2 className="text-lg sm:text-2xl font-bold text-white/50 truncate">{wave.title}</h2>
                        <p className="text-white/30 text-xs sm:text-sm">Complete Wave {wave.id - 1} to unlock</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div className="mt-10 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 phase-enter" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-lg font-bold mb-4 text-center">How Defence Academy Works</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-3xl block mb-2">🎮</span>
              <p className="text-sm text-white/60">Play games with integrated quizzes</p>
            </div>
            <div>
              <span className="text-3xl block mb-2">📚</span>
              <p className="text-sm text-white/60">Learn facts while you play</p>
            </div>
            <div>
              <span className="text-3xl block mb-2">🏆</span>
              <p className="text-sm text-white/60">Earn points for correct answers</p>
            </div>
            <div>
              <span className="text-3xl block mb-2">🔓</span>
              <p className="text-sm text-white/60">Unlock new waves as you progress</p>
            </div>
          </div>
        </div>

        {/* Link to action games */}
        <div className="mt-6 text-center">
          <Link
            href="/defense"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors"
          >
            <span>🎯</span>
            <span>Looking for action games? Try Defence Challenge</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
