'use client';

interface CountdownRingProps {
  timeRemaining: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
}

export function CountdownRing({
  timeRemaining,
  totalTime,
  size = 80,
  strokeWidth = 5,
}: CountdownRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalTime > 0 ? timeRemaining / totalTime : 0;
  const offset = circumference * (1 - progress);
  const isUrgent = timeRemaining <= 5;

  return (
    <div
      className={`countdown-ring ${isUrgent ? 'countdown-urgent' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="countdown-ring-svg"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isUrgent ? '#e21b3c' : '#ff3355'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="countdown-ring-progress"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className={`countdown-ring-text ${isUrgent ? 'countdown-text-urgent' : ''}`}>
        {timeRemaining}
      </span>
    </div>
  );
}
