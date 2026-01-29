'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { WAVES, getWaveActivities } from '../../data/content';
import { useDefenseProgress } from '../../hooks/useDefenseProgress';
import { ActivityCard } from '../../components/ActivityCard';

export default function WaveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const waveId = parseInt(params.waveId as string, 10);
  const wave = WAVES.find((w) => w.id === waveId);

  const { isLoaded, isWaveUnlocked, isActivityComplete, getActivityScore, getWaveProgress, getWaveScore } = useDefenseProgress();

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!wave) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Wave not found</h1>
        <Link href="/defense" className="text-red-400 hover:underline">Back to waves</Link>
      </main>
    );
  }

  if (!isWaveUnlocked(waveId)) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <span className="text-6xl mb-4">🔒</span>
        <h1 className="text-2xl font-bold mb-2">Wave Locked</h1>
        <p className="text-white/60 mb-6">Complete Wave {waveId - 1} to unlock this wave</p>
        <Link href="/defense" className="btn-primary">Back to Waves</Link>
      </main>
    );
  }

  const activities = getWaveActivities(waveId);
  const progress = getWaveProgress(waveId);
  const waveScore = getWaveScore(waveId);
  const games = activities.filter((a) => a.activityType === 'game');
  const quizzes = activities.filter((a) => a.activityType === 'quiz');

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0" style={{ backgroundColor: `${wave.color}10` }} />
      <div
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, ${wave.color}, transparent 50%)`,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 phase-enter">
          <Link
            href="/defense"
            className="inline-flex items-center text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Waves
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">
              {wave.pillars.includes('military') && '🛡️'}
              {wave.pillars.includes('digital') && !wave.pillars.includes('military') && '💻'}
              {wave.pillars.includes('economic') && !wave.pillars.includes('military') && !wave.pillars.includes('digital') && '💰'}
            </span>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider opacity-60">Wave {wave.id}</p>
              <h1 className="text-3xl font-black">{wave.title}</h1>
            </div>
          </div>
          <p className="text-white/60">{wave.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 phase-enter" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">{progress.completed} of {progress.total} complete</span>
            <span className="font-bold" style={{ color: wave.color }}>{waveScore.toLocaleString()} pts</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
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

        {/* Games Section */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3 flex items-center gap-2">
            <span>🎮</span> Action Games
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {games.map((game, index) => (
              <ActivityCard
                key={game.id}
                waveId={waveId}
                activity={{ ...game, type: 'game' }}
                isComplete={isActivityComplete(waveId, game.id)}
                score={getActivityScore(waveId, game.id)}
                color={wave.color}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Quizzes Section */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3 flex items-center gap-2">
            <span>❓</span> Knowledge Quizzes
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quizzes.map((quiz, index) => (
              <ActivityCard
                key={quiz.id}
                waveId={waveId}
                activity={quiz}
                isComplete={isActivityComplete(waveId, quiz.id)}
                score={getActivityScore(waveId, quiz.id)}
                color={wave.color}
                index={index + 4}
              />
            ))}
          </div>
        </div>

        {/* Pillar Legend */}
        <div className="text-center text-white/40 text-xs phase-enter" style={{ animationDelay: '0.3s' }}>
          <p className="mb-2">This wave covers:</p>
          <div className="flex justify-center gap-4">
            {wave.pillars.map((pillar) => (
              <span key={pillar} className="flex items-center gap-1">
                {pillar === 'military' && '🛡️ Military'}
                {pillar === 'civil' && '🚒 Civil'}
                {pillar === 'economic' && '💰 Economic'}
                {pillar === 'social' && '🤝 Social'}
                {pillar === 'digital' && '💻 Digital'}
                {pillar === 'psychological' && '🧠 Psychological'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
