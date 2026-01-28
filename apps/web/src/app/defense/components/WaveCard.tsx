'use client';

import Link from 'next/link';
import { Wave } from '../data/content';

interface WaveCardProps {
  wave: Wave;
  isUnlocked: boolean;
  progress: { completed: number; total: number; percentage: number };
  score: number;
  index: number;
}

export function WaveCard({ wave, isUnlocked, progress, score, index }: WaveCardProps) {
  const isComplete = progress.percentage === 100;

  if (!isUnlocked) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-white/10 bg-white/5 p-6 opacity-60"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-white/60 text-sm">Complete Wave {wave.id - 1} to unlock</p>
          </div>
        </div>
        <div className="text-white/30">
          <p className="text-sm font-medium uppercase tracking-wider mb-1">Wave {wave.id}</p>
          <h3 className="text-xl font-bold mb-2">{wave.title}</h3>
          <p className="text-sm">{wave.description}</p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/defense/wave/${wave.id}`}
      className="group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl phase-enter"
      style={{
        borderColor: wave.color,
        backgroundColor: `${wave.color}15`,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at 50% 50%, ${wave.color}30, transparent 70%)` }}
      />

      {/* Complete badge */}
      {isComplete && (
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div className="relative p-6">
        <p className="text-sm font-medium uppercase tracking-wider mb-1 opacity-60">Wave {wave.id}</p>
        <h3 className="text-2xl font-bold mb-2">{wave.title}</h3>
        <p className="text-white/70 text-sm mb-4">{wave.description}</p>

        {/* Pillar icons */}
        <div className="flex gap-2 mb-4">
          {wave.pillars.map((pillar) => (
            <span key={pillar} className="text-2xl" title={pillar}>
              {pillar === 'military' && '🛡️'}
              {pillar === 'civil' && '🚒'}
              {pillar === 'economic' && '💰'}
              {pillar === 'social' && '🤝'}
              {pillar === 'digital' && '💻'}
              {pillar === 'psychological' && '🧠'}
            </span>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/60">{progress.completed}/{progress.total} activities</span>
            <span className="font-bold" style={{ color: wave.color }}>{score.toLocaleString()} pts</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress.percentage}%`,
                backgroundColor: wave.color,
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">
            {progress.completed === 0 ? 'Start Wave' : progress.percentage === 100 ? 'Replay' : 'Continue'}
          </span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
