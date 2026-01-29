'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameConfig, PILLAR_COLORS, PillarType } from '../../data/content';
import { ExitGameModal } from '@/components/game/ExitGameModal';

interface DefenseDefenderProps {
  config: GameConfig;
  waveColor: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface Mole {
  id: number;
  position: number;
  isGood: boolean;
  icon: string;
  color: string;
  spawnTime: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  type: 'burst' | 'ring' | 'spark' | 'smoke';
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const GRID_SIZE = 9;
const MOLE_DURATION = 2000;

export function DefenseDefender({ config, waveColor, onComplete, onBack }: DefenseDefenderProps) {
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'playing' | 'finished'>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [moles, setMoles] = useState<Mole[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const moleIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const textIdRef = useRef(0);
  const molesRef = useRef<Mole[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    molesRef.current = moles;
  }, [moles]);

  const goodIcons = (config.config.goodIcons as string[]) || ['military', 'civil', 'economic'];
  const badIcons = (config.config.badIcons as string[]) || ['threat'];
  const spawnRate = (config.config.spawnRate as number) || 1200;

  const spawnParticles = (x: number, y: number, color: string, isGood: boolean) => {
    const newParticles: Particle[] = [];

    // Burst particles
    for (let i = 0; i < (isGood ? 12 : 6); i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        color: isGood ? color : '#ef4444',
        type: 'burst',
      });
    }

    // Ring effect for good hits
    if (isGood) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        color,
        type: 'ring',
      });
    }

    // Sparks
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        color: isGood ? '#ffd700' : '#ff6b6b',
        type: 'spark',
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 800);
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
    const newText: FloatingText = {
      id: textIdRef.current++,
      x,
      y,
      text,
      color,
    };

    setFloatingTexts((prev) => [...prev, newText]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== newText.id));
    }, 1000);
  };

  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 150);
  };

  const spawnMole = useCallback(() => {
    const isGood = Math.random() > 0.3;
    const iconList = isGood ? goodIcons : badIcons;
    const iconKey = iconList[Math.floor(Math.random() * iconList.length)];

    let icon = '❌';
    let color = '#ef4444';

    if (iconKey in PILLAR_COLORS) {
      const pillar = PILLAR_COLORS[iconKey as PillarType];
      icon = pillar.icon;
      color = pillar.bg;
    } else if (iconKey === 'threat') {
      icon = '💀';
      color = '#ef4444';
    } else if (iconKey === 'fake') {
      icon = '🚫';
      color = '#f97316';
    }

    const occupiedPositions = molesRef.current.map((m) => m.position);
    const availablePositions = Array.from({ length: GRID_SIZE }, (_, i) => i).filter(
      (p) => !occupiedPositions.includes(p)
    );

    if (availablePositions.length === 0) return;

    const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    const moleId = moleIdRef.current++;

    const newMole: Mole = {
      id: moleId,
      position,
      isGood,
      icon,
      color,
      spawnTime: Date.now(),
    };

    setMoles((prev) => [...prev, newMole]);

    setTimeout(() => {
      setMoles((prev) => prev.filter((m) => m.id !== moleId));
    }, MOLE_DURATION);
  }, [goodIcons, badIcons]);

  const handleMoleClick = (mole: Mole, event: React.MouseEvent | React.TouchEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    setMoles((prev) => {
      if (!prev.find((m) => m.id === mole.id)) return prev;
      return prev.filter((m) => m.id !== mole.id);
    });

    spawnParticles(x, y, mole.color, mole.isGood);

    if (mole.isGood) {
      const newCombo = combo + 1;
      const comboBonus = Math.min(newCombo * 15, 75);
      const points = 50 + comboBonus;

      setScore((prev) => prev + points);
      setHits((prev) => prev + 1);
      setCombo(newCombo);
      setMaxCombo((prev) => Math.max(prev, newCombo));

      spawnFloatingText(x, y, `+${points}`, mole.color);

      if (newCombo >= 3) {
        spawnFloatingText(x, y - 40, `${newCombo}x COMBO!`, '#ffd700');
      }
    } else {
      setScore((prev) => Math.max(0, prev - 30));
      setMisses((prev) => prev + 1);
      setCombo(0);
      triggerScreenShake();
      spawnFloatingText(x, y, '-30', '#ef4444');
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

  // Spawn moles
  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = setInterval(spawnMole, spawnRate);
    spawnMole();

    return () => clearInterval(interval);
  }, [phase, spawnMole, spawnRate]);

  const startGame = () => {
    setPhase('countdown');
    setCountdownNum(3);
    setScore(0);
    setTimeLeft(config.timeLimit);
    setMoles([]);
    setHits(0);
    setMisses(0);
    setCombo(0);
    setMaxCombo(0);
    setParticles([]);
    setFloatingTexts([]);
    moleIdRef.current = 0;
  };

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/50 to-slate-900" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-md">
          <div className="text-8xl mb-6 animate-bounce" style={{ animationDuration: '2s' }}>🎯</div>
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            {config.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{config.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl border border-green-500/30">
                🛡️
              </div>
              <span className="text-green-400 font-bold">TAP</span>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl border border-red-500/30">
                💀
              </div>
              <span className="text-red-400 font-bold">AVOID</span>
            </div>
            <p className="text-white/50 text-sm">Build combos for bonus points!</p>
          </div>

          <button
            onClick={startGame}
            className="group relative px-16 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <span className="relative z-10">START MISSION</span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/50 to-slate-900" />
        <div className="relative z-10 text-center">
          <div
            key={countdownNum}
            className="text-[100px] sm:text-[150px] md:text-[200px] font-black bg-gradient-to-b from-white to-purple-300 bg-clip-text text-transparent animate-countdown"
          >
            {countdownNum || 'GO!'}
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'finished') {
    const passed = score >= config.targetScore;
    const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/50 to-slate-900" />

        {passed && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-confetti-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#ffd700', '#ff6b6b', '#4ade80', '#60a5fa', '#f472b6'][i % 5],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 max-w-md phase-enter">
          <div className="text-8xl mb-4">{passed ? '🏆' : '💪'}</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            {passed ? 'MISSION COMPLETE!' : 'KEEP TRAINING!'}
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
              <p className="text-3xl font-bold text-green-400">{hits}</p>
              <p className="text-xs text-white/50">Hits</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-yellow-400">{maxCombo}x</p>
              <p className="text-xs text-white/50">Max Combo</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-blue-400">{accuracy}%</p>
              <p className="text-xs text-white/50">Accuracy</p>
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
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold transition-all hover:scale-105"
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
    <main
      className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-transform ${
        screenShake ? 'animate-shake' : ''
      }`}
    >
      {/* Dynamic background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900/30 to-slate-900" />
      <div className="absolute inset-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[150px] transition-all duration-500"
          style={{
            backgroundColor: combo >= 5 ? '#ffd70030' : combo >= 3 ? '#4ade8020' : '#8b5cf620',
          }}
        />
      </div>

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`fixed pointer-events-none z-50 ${
            particle.type === 'burst' ? 'animate-particle-burst' :
            particle.type === 'ring' ? 'animate-particle-ring' :
            particle.type === 'spark' ? 'animate-particle-spark' :
            'animate-particle-smoke'
          }`}
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.type !== 'ring' ? particle.color : 'transparent',
            borderColor: particle.color,
            '--particle-angle': `${Math.random() * 360}deg`,
            '--particle-distance': `${50 + Math.random() * 50}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Floating texts */}
      {floatingTexts.map((text) => (
        <div
          key={text.id}
          className="fixed pointer-events-none z-50 font-black text-2xl animate-float-up"
          style={{
            left: text.x,
            top: text.y,
            color: text.color,
            textShadow: `0 0 20px ${text.color}`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {text.text}
        </div>
      ))}

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
                backgroundColor: isUrgent ? '#ef4444' : waveColor,
                boxShadow: `0 0 20px ${isUrgent ? '#ef4444' : waveColor}`,
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

            <div className="text-right">
              <span className="text-green-400 font-bold">{hits}</span>
              <span className="text-white/30 mx-2">/</span>
              <span className="text-red-400 font-bold">{misses}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div
        ref={gridRef}
        className="relative z-10 grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-sm mt-16"
      >
        {Array.from({ length: GRID_SIZE }).map((_, index) => {
          const mole = moles.find((m) => m.position === index);

          return (
            <div
              key={index}
              className="aspect-square relative"
            >
              {/* Hole base with 3D effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/5 overflow-hidden">
                {/* Inner shadow */}
                <div className="absolute inset-2 rounded-xl bg-gradient-to-b from-slate-900 to-black/50" />

                {/* Hole opening */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/60 rounded-full blur-sm" />

                {/* Subtle glow when mole present */}
                {mole && (
                  <div
                    className="absolute inset-0 rounded-2xl animate-pulse"
                    style={{
                      boxShadow: `inset 0 0 30px ${mole.color}30`,
                    }}
                  />
                )}
              </div>

              {/* Mole */}
              {mole && (
                <button
                  type="button"
                  onClick={(e) => handleMoleClick(mole, e)}
                  className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer group"
                >
                  <div
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-4xl sm:text-5xl shadow-2xl transform transition-all duration-75 group-hover:scale-110 group-active:scale-90 animate-mole-popup"
                    style={{
                      backgroundColor: mole.color,
                      boxShadow: `0 0 40px ${mole.color}60, 0 10px 30px rgba(0,0,0,0.5)`,
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent" />

                    {/* Icon */}
                    <span className="relative z-10 drop-shadow-lg">{mole.icon}</span>

                    {/* Danger indicator for bad moles */}
                    {!mole.isGood && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs animate-pulse">
                        ⚠️
                      </div>
                    )}
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Combo display */}
      {combo >= 3 && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
        >
          <div className="text-6xl font-black text-yellow-400 animate-combo-flash" style={{ textShadow: '0 0 60px #ffd700' }}>
            {combo}x COMBO!
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="fixed bottom-4 left-0 right-0 text-center z-10">
        <div className="inline-flex items-center gap-4 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-white/60 text-sm">Pillars = Points</span>
          </span>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-white/60 text-sm">Threats = Danger</span>
          </span>
        </div>
      </div>
    </main>
  );
}
