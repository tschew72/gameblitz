'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  type: 'rect' | 'circle' | 'triangle';
}

const CONFETTI_COLORS = [
  '#e21b3c', '#1368ce', '#d89e00', '#26890c',
  '#ff3355', '#ff6b6b', '#48dbfb', '#feca57',
  '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4',
];

export function Confetti({ active, count = 80 }: { active: boolean; count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2.5 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 720 - 360,
      type: (['rect', 'circle', 'triangle'] as const)[Math.floor(Math.random() * 3)],
    }));

    setParticles(newParticles);
  }, [active, count]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            '--x': `${p.x}vw`,
            '--delay': `${p.delay}s`,
            '--duration': `${p.duration}s`,
            '--color': p.color,
            '--size': `${p.size}px`,
            '--rotation': `${p.rotation}deg`,
          } as React.CSSProperties}
        >
          {p.type === 'circle' ? (
            <div className="confetti-circle" />
          ) : p.type === 'triangle' ? (
            <div className="confetti-triangle" />
          ) : (
            <div className="confetti-rect" />
          )}
        </div>
      ))}
    </div>
  );
}
