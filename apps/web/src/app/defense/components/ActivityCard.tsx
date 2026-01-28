'use client';

import Link from 'next/link';

interface ActivityCardProps {
  waveId: number;
  activity: {
    id: string;
    type: 'game' | 'quiz';
    title: string;
    description: string;
  };
  isComplete: boolean;
  score: number;
  color: string;
  index: number;
}

const gameIcons: Record<string, string> = {
  'game-1': '⚡',
  'game-2': '🎯',
  'game-3': '💎',
  'game-4': '🏰',
};

export function ActivityCard({ waveId, activity, isComplete, score, color, index }: ActivityCardProps) {
  const isGame = activity.type === 'game';
  const icon = isGame ? gameIcons[activity.id] || '🎮' : '❓';

  return (
    <Link
      href={`/defense/wave/${waveId}/activity/${activity.id}`}
      className="group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.03] hover:shadow-lg phase-enter"
      style={{
        borderColor: isComplete ? '#22c55e' : `${color}50`,
        backgroundColor: isComplete ? 'rgba(34, 197, 94, 0.1)' : `${color}10`,
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {/* Complete checkmark */}
      {isComplete && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: isGame ? `${color}30` : 'rgba(168, 85, 247, 0.3)',
                color: isGame ? color : '#a855f7',
              }}
            >
              {isGame ? 'Game' : 'Quiz'}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-sm mb-1 group-hover:text-white transition-colors">{activity.title}</h3>
        <p className="text-white/50 text-xs line-clamp-2">{activity.description}</p>

        {score > 0 && (
          <div className="mt-2 text-xs font-bold" style={{ color }}>
            {score.toLocaleString()} pts
          </div>
        )}
      </div>

      {/* Hover arrow */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
