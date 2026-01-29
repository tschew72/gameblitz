'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameConfig } from '../../data/content';
import { ExitGameModal } from '@/components/game/ExitGameModal';

interface ResourceRushProps {
  config: GameConfig;
  waveColor: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface Resource {
  id: number;
  type: string;
  x: number;
  y: number;
  speed: number;
  points: number;
  icon: string;
  color: string;
  rotation: number;
  scale: number;
}

interface CollectEffect {
  id: number;
  x: number;
  y: number;
  points: number;
  color: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

const RESOURCE_DATA: Record<string, { icon: string; color: string; points: number; rarity: number }> = {
  shield: { icon: '🛡️', color: '#3b82f6', points: 30, rarity: 1 },
  heart: { icon: '❤️', color: '#ef4444', points: 25, rarity: 1 },
  star: { icon: '⭐', color: '#eab308', points: 50, rarity: 0.5 },
  coin: { icon: '🪙', color: '#f59e0b', points: 20, rarity: 1.5 },
  medkit: { icon: '🏥', color: '#22c55e', points: 35, rarity: 0.8 },
  ammo: { icon: '🎯', color: '#6366f1', points: 30, rarity: 1 },
  food: { icon: '🍎', color: '#ef4444', points: 25, rarity: 1 },
  water: { icon: '💧', color: '#06b6d4', points: 20, rarity: 1.2 },
  mask: { icon: '😷', color: '#8b5cf6', points: 30, rarity: 1 },
  sanitizer: { icon: '🧴', color: '#10b981', points: 25, rarity: 1 },
  voucher: { icon: '🎫', color: '#f97316', points: 35, rarity: 0.7 },
  password: { icon: '🔑', color: '#eab308', points: 50, rarity: 0.4 },
  firewall: { icon: '🔥', color: '#ef4444', points: 45, rarity: 0.5 },
  backup: { icon: '💾', color: '#3b82f6', points: 35, rarity: 0.8 },
  update: { icon: '🔄', color: '#22c55e', points: 30, rarity: 1 },
  diamond: { icon: '💎', color: '#06b6d4', points: 100, rarity: 0.2 },
};

export function ResourceRush({ config, waveColor, onComplete, onBack }: ResourceRushProps) {
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'playing' | 'finished'>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [resources, setResources] = useState<Resource[]>([]);
  const [collected, setCollected] = useState(0);
  const [missed, setMissed] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [collectEffects, setCollectEffects] = useState<CollectEffect[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lastCollectTime, setLastCollectTime] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const resourceIdRef = useRef(0);
  const effectIdRef = useRef(0);
  const particleIdRef = useRef(0);

  const resourceTypes = (config.config.resources as string[]) || ['shield', 'heart', 'star', 'coin'];
  const spawnRate = (config.config.spawnRate as number) || 800;

  const spawnResource = useCallback(() => {
    const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const data = RESOURCE_DATA[type] || RESOURCE_DATA.shield;

    // Occasionally spawn a diamond
    const spawnDiamond = Math.random() < 0.05;
    const finalType = spawnDiamond ? 'diamond' : type;
    const finalData = spawnDiamond ? RESOURCE_DATA.diamond : data;

    const newResource: Resource = {
      id: resourceIdRef.current++,
      type: finalType,
      x: 10 + Math.random() * 80,
      y: -10,
      speed: 0.8 + Math.random() * 1.5,
      points: finalData.points,
      icon: finalData.icon,
      color: finalData.color,
      rotation: Math.random() * 360,
      scale: 0.9 + Math.random() * 0.3,
    };

    setResources((prev) => [...prev, newResource]);
  }, [resourceTypes]);

  const spawnCollectParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 10; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        color,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 600);
  };

  const handleResourceClick = (resource: Resource, event: React.MouseEvent | React.TouchEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const timeSinceLast = Date.now() - lastCollectTime;
    const newCombo = timeSinceLast < 800 ? combo + 1 : 1;
    const comboMultiplier = 1 + Math.min(newCombo - 1, 5) * 0.2;
    const points = Math.round(resource.points * comboMultiplier);

    setScore((prev) => prev + points);
    setCollected((prev) => prev + 1);
    setResources((prev) => prev.filter((r) => r.id !== resource.id));
    setCombo(newCombo);
    setMaxCombo((prev) => Math.max(prev, newCombo));
    setLastCollectTime(Date.now());

    // Create collect effect
    const newEffect: CollectEffect = {
      id: effectIdRef.current++,
      x,
      y,
      points,
      color: resource.color,
    };
    setCollectEffects((prev) => [...prev, newEffect]);
    spawnCollectParticles(x, y, resource.color);

    setTimeout(() => {
      setCollectEffects((prev) => prev.filter((e) => e.id !== newEffect.id));
    }, 800);
  };

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdownNum <= 0) {
      setPhase('playing');
      return;
    }

    const timer = setTimeout(() => {
      setCountdownNum((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdownNum]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Spawn resources
  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = setInterval(spawnResource, spawnRate);
    return () => clearInterval(interval);
  }, [phase, spawnResource, spawnRate]);

  // Move resources
  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = setInterval(() => {
      setResources((prev) => {
        const updated = prev.map((r) => ({
          ...r,
          y: r.y + r.speed,
          rotation: r.rotation + r.speed * 2,
        }));
        const remaining = updated.filter((r) => r.y < 105);
        const missedCount = updated.length - remaining.length;
        if (missedCount > 0) {
          setMissed((m) => m + missedCount);
          setCombo(0);
        }
        return remaining;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [phase]);

  const startGame = () => {
    setPhase('countdown');
    setCountdownNum(3);
    setScore(0);
    setTimeLeft(config.timeLimit);
    setResources([]);
    setCollected(0);
    setMissed(0);
    setCombo(0);
    setMaxCombo(0);
    setCollectEffects([]);
    setParticles([]);
    setLastCollectTime(0);
    resourceIdRef.current = 0;
  };

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-slate-900 to-cyan-950" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Falling preview resources */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => {
            const type = resourceTypes[i % resourceTypes.length];
            const data = RESOURCE_DATA[type] || RESOURCE_DATA.shield;
            return (
              <div
                key={i}
                className="absolute text-4xl opacity-20 animate-fall-preview"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${4 + Math.random() * 3}s`,
                }}
              >
                {data.icon}
              </div>
            );
          })}
        </div>

        <div className="relative z-10 max-w-md">
          <div className="relative mb-8">
            <div className="text-8xl animate-float" style={{ animationDuration: '3s' }}>💎</div>
            <div className="absolute inset-0 text-8xl blur-xl opacity-50 animate-float" style={{ animationDuration: '3s' }}>💎</div>
          </div>

          <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-emerald-400 via-white to-cyan-400 bg-clip-text text-transparent">
            {config.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{config.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
            <div className="flex items-center justify-center gap-4 mb-4">
              {resourceTypes.slice(0, 4).map((type, i) => {
                const data = RESOURCE_DATA[type] || RESOURCE_DATA.shield;
                return (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl animate-bounce"
                    style={{
                      backgroundColor: `${data.color}30`,
                      border: `2px solid ${data.color}50`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  >
                    {data.icon}
                  </div>
                );
              })}
            </div>
            <p className="text-white/50 text-sm">Build combos for bonus points!</p>
          </div>

          <button
            onClick={startGame}
            className="group relative px-16 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl font-bold text-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/30"
          >
            <span className="relative z-10">START COLLECTING</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button onClick={onBack} className="block mx-auto mt-6 text-white/40 hover:text-white transition-colors">
            ← Back to wave
          </button>
        </div>
      </main>
    );
  }

  if (phase === 'countdown') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-slate-900 to-cyan-950" />
        <div className="relative z-10 text-center">
          <div
            key={countdownNum}
            className="text-[100px] sm:text-[150px] md:text-[200px] font-black bg-gradient-to-b from-emerald-400 to-cyan-400 bg-clip-text text-transparent animate-countdown"
          >
            {countdownNum || 'GO!'}
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'finished') {
    const passed = score >= config.targetScore;
    const efficiency = collected + missed > 0 ? Math.round((collected / (collected + missed)) * 100) : 0;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-slate-900 to-cyan-950" />

        {passed && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                {['💎', '⭐', '🪙', '❤️'][i % 4]}
              </div>
            ))}
          </div>
        )}

        <div className="relative z-10 max-w-md phase-enter">
          <div className="text-8xl mb-4">{passed ? '💎' : '💪'}</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {passed ? 'RESOURCES SECURED!' : 'KEEP COLLECTING!'}
          </h1>

          <div
            className="text-7xl font-black my-8 animate-score-reveal"
            style={{ color: waveColor, textShadow: `0 0 60px ${waveColor}40` }}
          >
            {score.toLocaleString()}
          </div>

          <p className="text-white/60 mb-6">Target: {config.targetScore.toLocaleString()} pts</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-emerald-400">{collected}</p>
              <p className="text-xs text-white/50">Collected</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-yellow-400">{maxCombo}x</p>
              <p className="text-xs text-white/50">Max Combo</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-cyan-400">{efficiency}%</p>
              <p className="text-xs text-white/50">Efficiency</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={startGame}
              className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all border border-white/10"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                onComplete(score);
                onBack();
              }}
              className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold transition-all hover:scale-105"
            >
              Complete
            </button>
          </div>
        </div>
      </main>
    );
  }

  const timerPercentage = (timeLeft / config.timeLimit) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Dynamic background */}
      <div className="fixed inset-0 bg-gradient-to-b from-emerald-950 via-slate-900 to-cyan-950" />
      <div className="fixed inset-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] transition-all duration-300"
          style={{
            backgroundColor: combo >= 5 ? '#fbbf2420' : combo >= 3 ? '#22c55e20' : '#06b6d415',
          }}
        />
      </div>

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="fixed w-3 h-3 rounded-full animate-particle-burst pointer-events-none z-50"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            '--particle-angle': `${Math.random() * 360}deg`,
            '--particle-distance': `${40 + Math.random() * 40}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Collect effects */}
      {collectEffects.map((effect) => (
        <div key={effect.id} className="fixed pointer-events-none z-50" style={{ left: effect.x, top: effect.y }}>
          <div
            className="absolute w-16 h-16 rounded-full border-4 animate-particle-ring"
            style={{ borderColor: effect.color, transform: 'translate(-50%, -50%)' }}
          />
          <div
            className="absolute font-black text-3xl animate-float-up whitespace-nowrap"
            style={{
              color: effect.color,
              textShadow: `0 0 20px ${effect.color}`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            +{effect.points}
          </div>
        </div>
      ))}

      {/* Falling resources */}
      {resources.map((resource) => {
        const isDiamond = resource.type === 'diamond';

        return (
          <button
            key={resource.id}
            onClick={(e) => handleResourceClick(resource, e)}
            className="fixed transform -translate-x-1/2 transition-transform active:scale-75 group"
            style={{
              left: `${resource.x}%`,
              top: `${resource.y}%`,
              transform: `translate(-50%, -50%) scale(${resource.scale}) rotate(${resource.rotation}deg)`,
            }}
          >
            {/* Glow effect */}
            <div
              className={`absolute inset-[-10px] rounded-full blur-lg ${isDiamond ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: `${resource.color}40` }}
            />

            {/* Resource circle */}
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-transform group-hover:scale-110"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${resource.color}, ${resource.color}90)`,
                boxShadow: `0 0 30px ${resource.color}50, inset 0 2px 10px rgba(255,255,255,0.3)`,
              }}
            >
              {/* Shine */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent" />

              {/* Icon */}
              <span className="relative z-10 drop-shadow-lg">{resource.icon}</span>

              {/* Value indicator */}
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-black/50 border border-white/20"
              >
                {resource.points}
              </div>
            </div>

            {/* Diamond special effect */}
            {isDiamond && (
              <div className="absolute inset-[-20px] rounded-full border-2 border-cyan-400/50 animate-ping" />
            )}
          </button>
        );
      })}

      {/* Exit Modal */}
      <ExitGameModal
        isOpen={showExitModal}
        onConfirm={onBack}
        onCancel={() => setShowExitModal(false)}
        gameName={config.title}
      />

      {/* HUD */}
      <div className="fixed top-0 left-0 right-0 p-4 z-20">
        <div className="max-w-lg mx-auto">
          {/* Timer bar */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'animate-pulse' : ''}`}
              style={{
                width: `${timerPercentage}%`,
                background: isUrgent
                  ? 'linear-gradient(90deg, #ef4444, #f97316)'
                  : 'linear-gradient(90deg, #10b981, #06b6d4)',
                boxShadow: `0 0 20px ${isUrgent ? '#ef4444' : '#10b981'}`,
              }}
            />
          </div>

          <div className="flex justify-between items-center px-2 py-2 bg-gradient-to-r from-white/5 to-transparent rounded-xl">
            <button
              onClick={() => setShowExitModal(true)}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
              aria-label="Exit game"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <span
                className="text-4xl font-black"
                style={{ color: waveColor, textShadow: `0 0 30px ${waveColor}60` }}
              >
                {score}
              </span>
              {combo > 1 && (
                <span className="ml-3 text-xl font-bold text-yellow-400 animate-pulse">
                  {combo}x
                </span>
              )}
            </div>

            <div
              className={`text-5xl font-black ${isUrgent ? 'text-red-500 animate-pulse' : 'text-white'}`}
              style={{ textShadow: isUrgent ? '0 0 30px #ef4444' : 'none' }}
            >
              {timeLeft}
            </div>

            <div className="text-right text-lg">
              <span className="text-emerald-400 font-bold">{collected}</span>
              <span className="text-white/30 mx-1">/</span>
              <span className="text-red-400">{missed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Combo display */}
      {combo >= 5 && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
          <div
            className="text-5xl font-black text-yellow-400 animate-combo-flash"
            style={{ textShadow: '0 0 60px #fbbf24' }}
          >
            {combo}x COMBO!
          </div>
        </div>
      )}

      {/* Danger zone at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-red-900/40 to-transparent pointer-events-none z-10" />
      <div className="fixed bottom-2 left-0 right-0 text-center text-red-400/60 text-xs font-bold tracking-wider z-10">
        ⚠️ DANGER ZONE ⚠️
      </div>
    </main>
  );
}
