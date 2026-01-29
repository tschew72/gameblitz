'use client';

interface GameHeaderProps {
  score: number;
  scoreColor?: string;
  onPause: () => void;
  children?: React.ReactNode;
}

export function GameHeader({ score, scoreColor = '#fff', onPause, children }: GameHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 p-3 z-30 bg-gradient-to-b from-black/50 to-transparent">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Pause/Exit button */}
        <button
          onClick={onPause}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10 hover:border-white/30"
          aria-label="Pause game"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </button>

        {/* Score */}
        <div
          className="text-2xl font-black tabular-nums"
          style={{ color: scoreColor, textShadow: `0 0 20px ${scoreColor}40` }}
        >
          {score.toLocaleString()}
        </div>

        {/* Additional content (lives, time, etc.) */}
        <div className="flex items-center gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}
