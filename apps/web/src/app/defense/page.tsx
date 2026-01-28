'use client';

import Link from 'next/link';
import { WAVES } from './data/content';
import { useDefenseProgress } from './hooks/useDefenseProgress';
import { WaveCard } from './components/WaveCard';

export default function DefenseHubPage() {
  const { isLoaded, isWaveUnlocked, getWaveProgress, getWaveScore, getTotalScore, resetProgress } = useDefenseProgress();

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </div>
      </main>
    );
  }

  const totalScore = getTotalScore();
  const totalActivities = WAVES.reduce((sum, w) => sum + w.games.length + w.quizzes.length, 0);
  const completedActivities = WAVES.reduce((sum, w) => sum + getWaveProgress(w.id).completed, 0);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#1a0a0a] via-[#2d1010] to-[#1a0a0a]" />
      <div className="fixed inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L5 30l25 25 25-25L30 5z' fill='none' stroke='%23EF3340' stroke-width='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 phase-enter">
          <Link href="/" className="inline-block mb-4 text-white/60 hover:text-white text-sm">
            &larr; Back to GameBlitz
          </Link>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl">🇸🇬</span>
            <h1 className="text-4xl md:text-5xl font-black">
              <span className="text-[#EF3340]">Total</span> Defence
            </h1>
            <span className="text-4xl">🛡️</span>
          </div>
          <p className="text-white/60 max-w-md mx-auto">
            Defend Singapore through 4 challenging waves of action games and quizzes
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-center gap-6 mb-8 phase-enter" style={{ animationDelay: '0.1s' }}>
          <div className="text-center">
            <p className="text-3xl font-black text-[#FFD700]">{totalScore.toLocaleString()}</p>
            <p className="text-xs text-white/50 uppercase tracking-wider">Total Score</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <p className="text-3xl font-black">{completedActivities}<span className="text-white/40">/{totalActivities}</span></p>
            <p className="text-xs text-white/50 uppercase tracking-wider">Activities</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <p className="text-3xl font-black text-[#EF3340]">{WAVES.filter((w) => isWaveUnlocked(w.id)).length}</p>
            <p className="text-xs text-white/50 uppercase tracking-wider">Waves Unlocked</p>
          </div>
        </div>

        {/* Wave Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {WAVES.map((wave, index) => (
            <WaveCard
              key={wave.id}
              wave={wave}
              isUnlocked={isWaveUnlocked(wave.id)}
              progress={getWaveProgress(wave.id)}
              score={getWaveScore(wave.id)}
              index={index}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center phase-enter" style={{ animationDelay: '0.5s' }}>
          <p className="text-white/40 text-sm mb-4">
            Complete all 8 activities in a wave to unlock the next one
          </p>
          <button
            onClick={() => {
              if (confirm('Reset all progress? This cannot be undone.')) {
                resetProgress();
              }
            }}
            className="text-white/30 hover:text-red-400 text-xs transition-colors"
          >
            Reset Progress
          </button>
        </div>

        {/* Achievement Banner - Show when all complete */}
        {completedActivities === totalActivities && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black rounded-xl p-4 shadow-2xl phase-enter">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              <div>
                <h3 className="font-bold">Total Defence Champion!</h3>
                <p className="text-sm opacity-80">You completed all waves. Singapore is proud!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
