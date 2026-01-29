'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameConfig, PILLAR_COLORS, PillarType } from '../../data/content';
import { ExitGameModal } from '@/components/game/ExitGameModal';

interface RapidResponseProps {
  config: GameConfig;
  waveColor: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface Target {
  id: number;
  pillar: PillarType;
  x: number;
  y: number;
  spawnTime: number;
  size: number;
}

interface HitEffect {
  id: number;
  x: number;
  y: number;
  color: string;
  points: number;
}

interface TrailPoint {
  id: number;
  x: number;
  y: number;
}

export function RapidResponse({ config, waveColor, onComplete, onBack }: RapidResponseProps) {
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'playing' | 'finished'>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [targets, setTargets] = useState<Target[]>([]);
  const [targetsHit, setTargetsHit] = useState(0);
  const [totalTargets, setTotalTargets] = useState(0);
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [trails, setTrails] = useState<TrailPoint[]>([]);
  const [lastHitTime, setLastHitTime] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const effectIdRef = useRef(0);
  const trailIdRef = useRef(0);
  const totalTargetsRef = useRef(0);

  const icons = (config.config.icons as string[]) || ['military', 'civil', 'economic'];
  const targetCount = (config.config.targetCount as number) || 15;

  const spawnTarget = useCallback(() => {
    if (totalTargetsRef.current >= targetCount) return;

    const pillar = icons[Math.floor(Math.random() * icons.length)] as PillarType;
    const newTarget: Target = {
      id: Date.now() + Math.random(),
      pillar,
      x: 15 + Math.random() * 70,
      y: 25 + Math.random() * 50,
      spawnTime: Date.now(),
      size: 0.8 + Math.random() * 0.4,
    };
    setTargets((prev) => [...prev, newTarget]);
    setTotalTargets((prev) => prev + 1);
    totalTargetsRef.current += 1;
  }, [icons, targetCount]);

  const handleTargetClick = (target: Target, event: React.MouseEvent | React.TouchEvent) => {
    const reactionTime = Date.now() - target.spawnTime;
    const timeBonus = Math.max(0, 150 - Math.floor(reactionTime / 8));
    const streakBonus = Math.min(streak * 10, 100);
    const points = 50 + timeBonus + streakBonus;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Create hit effect
    const newEffect: HitEffect = {
      id: effectIdRef.current++,
      x,
      y,
      color: PILLAR_COLORS[target.pillar].bg,
      points,
    };
    setHitEffects((prev) => [...prev, newEffect]);
    setTimeout(() => {
      setHitEffects((prev) => prev.filter((e) => e.id !== newEffect.id));
    }, 800);

    // Add trail
    const trail: TrailPoint = {
      id: trailIdRef.current++,
      x,
      y,
    };
    setTrails((prev) => [...prev, trail]);
    setTimeout(() => {
      setTrails((prev) => prev.filter((t) => t.id !== trail.id));
    }, 500);

    setScore((prev) => prev + points);
    setTargetsHit((prev) => prev + 1);
    setTargets((prev) => prev.filter((t) => t.id !== target.id));
    setLastHitTime(Date.now());

    // Update streak
    const timeSinceLastHit = Date.now() - lastHitTime;
    if (timeSinceLastHit < 1500) {
      setStreak((prev) => {
        const newStreak = prev + 1;
        setBestStreak((best) => Math.max(best, newStreak));
        return newStreak;
      });
    } else {
      setStreak(1);
    }
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

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return;

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTargets((prev) => prev.filter((t) => now - t.spawnTime < 2500));
    }, 100);

    return () => {
      clearInterval(timerInterval);
      clearInterval(cleanupInterval);
    };
  }, [phase]);

  // Spawn targets
  useEffect(() => {
    if (phase !== 'playing') return;

    const spawnInterval = setInterval(() => {
      spawnTarget();
    }, (config.timeLimit * 1000) / targetCount);

    spawnTarget();

    return () => clearInterval(spawnInterval);
  }, [phase, spawnTarget, targetCount, config.timeLimit]);

  const startGame = () => {
    setPhase('countdown');
    setCountdownNum(3);
    setScore(0);
    setTimeLeft(config.timeLimit);
    setTargets([]);
    setTargetsHit(0);
    setTotalTargets(0);
    totalTargetsRef.current = 0;
    setHitEffects([]);
    setStreak(0);
    setBestStreak(0);
    setTrails([]);
    setLastHitTime(0);
  };

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white/20 animate-float-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-md">
          <div className="relative mb-8">
            <div className="text-8xl animate-float" style={{ animationDuration: '3s' }}>⚡</div>
            <div className="absolute inset-0 text-8xl blur-xl opacity-50 animate-float" style={{ animationDuration: '3s' }}>⚡</div>
          </div>

          <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-cyan-400 via-white to-pink-400 bg-clip-text text-transparent">
            {config.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{config.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
            <div className="flex items-center justify-center gap-6 mb-4">
              {icons.slice(0, 3).map((icon, i) => {
                const pillar = PILLAR_COLORS[icon as PillarType];
                return (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl animate-bounce"
                    style={{
                      backgroundColor: pillar?.bg || '#666',
                      animationDelay: `${i * 0.2}s`,
                      boxShadow: `0 0 30px ${pillar?.bg || '#666'}50`,
                    }}
                  >
                    {pillar?.icon || '?'}
                  </div>
                );
              })}
            </div>
            <p className="text-white/50 text-sm">Faster hits = More points!</p>
          </div>

          <button
            onClick={startGame}
            className="group relative px-16 py-5 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl font-bold text-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30"
          >
            <span className="relative z-10">ENGAGE</span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />
        <div className="relative z-10 text-center">
          <div
            key={countdownNum}
            className="text-[100px] sm:text-[150px] md:text-[200px] font-black bg-gradient-to-b from-cyan-400 to-pink-400 bg-clip-text text-transparent animate-countdown"
          >
            {countdownNum || 'GO!'}
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'finished') {
    const accuracy = totalTargets > 0 ? Math.round((targetsHit / totalTargets) * 100) : 0;
    const passed = score >= config.targetScore;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />

        {passed && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#06b6d4', '#ec4899', '#ffd700', '#4ade80'][i % 4],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 max-w-md px-4 phase-enter">
          <div className="text-6xl sm:text-8xl mb-4">{passed ? '⚡' : '💪'}</div>
          <h1 className="text-2xl sm:text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
            {passed ? 'LIGHTNING FAST!' : 'KEEP TRAINING!'}
          </h1>

          <div
            className="text-4xl sm:text-7xl font-black my-6 sm:my-8 animate-score-reveal"
            style={{ color: waveColor, textShadow: `0 0 60px ${waveColor}40` }}
          >
            {score.toLocaleString()}
          </div>

          <p className="text-white/60 mb-4 sm:mb-6 text-sm sm:text-base">Target: {config.targetScore.toLocaleString()} pts</p>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-white/10">
              <p className="text-xl sm:text-3xl font-bold text-cyan-400">{targetsHit}</p>
              <p className="text-[10px] sm:text-xs text-white/50">Hits</p>
            </div>
            <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-white/10">
              <p className="text-xl sm:text-3xl font-bold text-pink-400">{bestStreak}x</p>
              <p className="text-[10px] sm:text-xs text-white/50">Streak</p>
            </div>
            <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-white/10">
              <p className="text-xl sm:text-3xl font-bold text-yellow-400">{accuracy}%</p>
              <p className="text-[10px] sm:text-xs text-white/50">Accuracy</p>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={startGame}
              className="flex-1 py-3 sm:py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all border border-white/10 text-sm sm:text-base"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                onComplete(score);
                onBack();
              }}
              className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-xl font-bold transition-all hover:scale-105 text-sm sm:text-base"
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
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />
      <div className="fixed inset-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px] transition-all duration-300"
          style={{
            backgroundColor: streak >= 5 ? '#ffd70015' : streak >= 3 ? '#4ade8010' : '#06b6d410',
          }}
        />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Hit trails */}
      {trails.map((trail) => (
        <div
          key={trail.id}
          className="fixed w-8 h-8 rounded-full bg-white/30 blur-md animate-ping"
          style={{ left: trail.x - 16, top: trail.y - 16 }}
        />
      ))}

      {/* Hit effects */}
      {hitEffects.map((effect) => (
        <div key={effect.id} className="fixed pointer-events-none z-50" style={{ left: effect.x, top: effect.y }}>
          {/* Ring burst */}
          <div
            className="absolute w-20 h-20 rounded-full border-4 animate-particle-ring"
            style={{ borderColor: effect.color, transform: 'translate(-50%, -50%)' }}
          />
          {/* Particles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-particle-burst"
              style={{
                backgroundColor: effect.color,
                '--particle-angle': `${i * 45}deg`,
                '--particle-distance': '60px',
                transform: 'translate(-50%, -50%)',
              } as React.CSSProperties}
            />
          ))}
          {/* Points */}
          <div
            className="absolute font-black text-2xl animate-float-up whitespace-nowrap"
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

      {/* Targets */}
      {targets.map((target) => {
        const pillarData = PILLAR_COLORS[target.pillar];
        const age = Date.now() - target.spawnTime;
        const lifeProgress = age / 2500;
        const scale = target.size * (1 - lifeProgress * 0.3);
        const opacity = 1 - lifeProgress * 0.5;

        return (
          <button
            key={target.id}
            onClick={(e) => handleTargetClick(target, e)}
            className="fixed transform -translate-x-1/2 -translate-y-1/2 transition-transform active:scale-75 group"
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              opacity,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
          >
            {/* Outer glow ring */}
            <div
              className="absolute inset-[-15px] rounded-full animate-ping"
              style={{
                backgroundColor: `${pillarData.bg}20`,
                animationDuration: '1s',
              }}
            />

            {/* Target circle */}
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-transform group-hover:scale-110"
              style={{
                backgroundColor: pillarData.bg,
                boxShadow: `0 0 40px ${pillarData.bg}60, 0 0 80px ${pillarData.bg}30, inset 0 2px 10px rgba(255,255,255,0.2)`,
              }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent" />

              {/* Icon */}
              <span className="relative z-10 drop-shadow-lg">{pillarData.icon}</span>

              {/* Timer ring */}
              <svg className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray={`${(1 - lifeProgress) * 300} 300`}
                  className="transition-all"
                />
              </svg>
            </div>
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
                  : 'linear-gradient(90deg, #06b6d4, #ec4899)',
                boxShadow: `0 0 20px ${isUrgent ? '#ef4444' : '#06b6d4'}`,
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
              {streak >= 3 && (
                <span className="ml-3 text-xl font-bold text-yellow-400 animate-pulse">
                  🔥 {streak}x
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
              <span className="text-cyan-400 font-bold">{targetsHit}</span>
              <span className="text-white/30 mx-1">/</span>
              <span className="text-white/60">{totalTargets}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Streak display */}
      {streak >= 5 && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
          <div
            className="text-5xl font-black text-yellow-400 animate-combo-flash"
            style={{ textShadow: '0 0 60px #ffd700' }}
          >
            🔥 {streak}x STREAK!
          </div>
        </div>
      )}

      {/* Bottom hint */}
      <div className="fixed bottom-4 left-0 right-0 text-center z-10">
        <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10">
          <span className="text-white/60 text-sm">Tap targets before they fade!</span>
        </div>
      </div>
    </main>
  );
}
