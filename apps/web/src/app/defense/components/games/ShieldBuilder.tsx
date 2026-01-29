'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameConfig } from '../../data/content';
import { ExitGameModal } from '@/components/game/ExitGameModal';

interface ShieldBuilderProps {
  config: GameConfig;
  waveColor: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface Tower {
  id: number;
  lane: number;
  type: string;
  icon: string;
  color: string;
  damage: number;
  lastAttack: number;
}

interface Enemy {
  id: number;
  lane: number;
  position: number;
  health: number;
  maxHealth: number;
  speed: number;
  icon: string;
  hitFlash: boolean;
}

interface Projectile {
  id: number;
  lane: number;
  y: number;
  color: string;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  color: string;
}

const TOWER_DATA: Record<string, { icon: string; color: string; damage: number; attackSpeed: number }> = {
  military: { icon: '🛡️', color: '#1E3A5F', damage: 30, attackSpeed: 500 },
  civil: { icon: '🚒', color: '#C41E3A', damage: 25, attackSpeed: 400 },
  economic: { icon: '💰', color: '#2E7D32', damage: 20, attackSpeed: 350 },
  soldier: { icon: '🎖️', color: '#4a5568', damage: 35, attackSpeed: 450 },
  tank: { icon: '🚀', color: '#2d3748', damage: 50, attackSpeed: 700 },
  medic: { icon: '🏥', color: '#38a169', damage: 20, attackSpeed: 300 },
  bank: { icon: '🏦', color: '#d69e2e', damage: 25, attackSpeed: 400 },
  factory: { icon: '🏭', color: '#718096', damage: 30, attackSpeed: 500 },
  port: { icon: '⚓', color: '#3182ce', damage: 35, attackSpeed: 550 },
  factcheck: { icon: '✅', color: '#48bb78', damage: 30, attackSpeed: 450 },
  critical: { icon: '🧠', color: '#9f7aea', damage: 25, attackSpeed: 400 },
  verify: { icon: '🔍', color: '#4299e1', damage: 28, attackSpeed: 420 },
};

const ENEMY_TYPES = [
  { icon: '👾', health: 60, speed: 0.4, name: 'Invader' },
  { icon: '💀', health: 100, speed: 0.25, name: 'Skull' },
  { icon: '🦠', health: 40, speed: 0.6, name: 'Virus' },
  { icon: '📛', health: 120, speed: 0.2, name: 'Boss' },
  { icon: '🔥', health: 50, speed: 0.5, name: 'Fire' },
];

export function ShieldBuilder({ config, waveColor, onComplete, onBack }: ShieldBuilderProps) {
  const [phase, setPhase] = useState<'ready' | 'placing' | 'countdown' | 'playing' | 'finished'>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [lives, setLives] = useState(3);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [currentWave, setCurrentWave] = useState(0);
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const enemyIdRef = useRef(0);
  const towerIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const explosionIdRef = useRef(0);

  const lanes = (config.config.lanes as number) || 3;
  const totalWaves = (config.config.waves as number) || 5;
  const towerTypes = (config.config.towerTypes as string[]) || ['military', 'civil', 'economic'];

  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
  };

  const createExplosion = (x: number, y: number, color: string) => {
    const explosion: Explosion = {
      id: explosionIdRef.current++,
      x,
      y,
      color,
    };
    setExplosions((prev) => [...prev, explosion]);
    setTimeout(() => {
      setExplosions((prev) => prev.filter((e) => e.id !== explosion.id));
    }, 500);
  };

  const spawnEnemy = useCallback(() => {
    const enemyType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const lane = Math.floor(Math.random() * lanes);
    const waveMultiplier = 1 + currentWave * 0.15;

    const newEnemy: Enemy = {
      id: enemyIdRef.current++,
      lane,
      position: 0,
      health: Math.round(enemyType.health * waveMultiplier),
      maxHealth: Math.round(enemyType.health * waveMultiplier),
      speed: enemyType.speed,
      icon: enemyType.icon,
      hitFlash: false,
    };

    setEnemies((prev) => [...prev, newEnemy]);
  }, [lanes, currentWave]);

  const placeTower = (lane: number) => {
    if (!selectedTower || towers.some((t) => t.lane === lane)) return;

    const data = TOWER_DATA[selectedTower] || TOWER_DATA.military;
    const newTower: Tower = {
      id: towerIdRef.current++,
      lane,
      type: selectedTower,
      icon: data.icon,
      color: data.color,
      damage: data.damage,
      lastAttack: 0,
    };

    setTowers((prev) => [...prev, newTower]);
    setSelectedTower(null);

    if (towers.length + 1 >= lanes) {
      setTimeout(() => setPhase('countdown'), 500);
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

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [phase]);

  // Tower attacks
  useEffect(() => {
    if (phase !== 'playing') return;

    const attackInterval = setInterval(() => {
      const now = Date.now();

      setTowers((prevTowers) =>
        prevTowers.map((tower) => {
          const towerData = TOWER_DATA[tower.type] || TOWER_DATA.military;
          if (now - tower.lastAttack < towerData.attackSpeed) return tower;

          const enemiesInLane = enemies.filter((e) => e.lane === tower.lane && e.position > 20 && e.position < 75);
          if (enemiesInLane.length === 0) return tower;

          // Create projectile
          const projectile: Projectile = {
            id: projectileIdRef.current++,
            lane: tower.lane,
            y: 75,
            color: tower.color,
          };
          setProjectiles((prev) => [...prev, projectile]);

          // Remove projectile after animation
          setTimeout(() => {
            setProjectiles((prev) => prev.filter((p) => p.id !== projectile.id));
          }, 300);

          return { ...tower, lastAttack: now };
        })
      );
    }, 100);

    return () => clearInterval(attackInterval);
  }, [phase, enemies]);

  // Move enemies and check collisions
  useEffect(() => {
    if (phase !== 'playing') return;

    const gameLoop = setInterval(() => {
      setEnemies((prevEnemies) => {
        return prevEnemies
          .map((enemy) => {
            const tower = towers.find((t) => t.lane === enemy.lane);

            // Check if in attack range
            if (tower && enemy.position >= 60 && enemy.position <= 75) {
              const towerData = TOWER_DATA[tower.type] || TOWER_DATA.military;
              const newHealth = enemy.health - towerData.damage * 0.15;

              if (newHealth <= 0) {
                const points = enemy.maxHealth * 2;
                setScore((prev) => prev + points);
                setEnemiesDefeated((prev) => prev + 1);
                createExplosion(50, enemy.position, '#22c55e');
                return null;
              }

              return {
                ...enemy,
                health: newHealth,
                position: enemy.position + enemy.speed,
                hitFlash: true,
              };
            }

            // Check if reached end
            if (enemy.position >= 95) {
              setLives((prev) => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                  setTimeout(() => setPhase('finished'), 100);
                }
                return newLives;
              });
              triggerShake();
              createExplosion(50, 95, '#ef4444');
              return null;
            }

            return { ...enemy, position: enemy.position + enemy.speed, hitFlash: false };
          })
          .filter((e): e is Enemy => e !== null);
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [phase, towers]);

  // Spawn waves
  useEffect(() => {
    if (phase !== 'playing') return;

    const waveInterval = setInterval(() => {
      setCurrentWave((prev) => {
        const newWave = prev + 1;
        if (newWave > totalWaves) {
          clearInterval(waveInterval);
          return prev;
        }
        for (let i = 0; i < newWave + 2; i++) {
          setTimeout(() => spawnEnemy(), i * 400);
        }
        return newWave;
      });
    }, 7000);

    spawnEnemy();
    setTimeout(spawnEnemy, 500);

    return () => clearInterval(waveInterval);
  }, [phase, spawnEnemy, totalWaves]);

  // Win condition
  useEffect(() => {
    if (phase === 'playing' && currentWave >= totalWaves && enemies.length === 0 && lives > 0) {
      const bonusScore = lives * 150 + timeLeft * 15;
      setScore((prev) => prev + bonusScore);
      setPhase('finished');
    }
  }, [phase, currentWave, totalWaves, enemies.length, lives, timeLeft]);

  const startGame = () => {
    setPhase('placing');
    setCountdownNum(3);
    setScore(0);
    setTimeLeft(config.timeLimit);
    setTowers([]);
    setEnemies([]);
    setProjectiles([]);
    setExplosions([]);
    setLives(3);
    setEnemiesDefeated(0);
    setCurrentWave(0);
    setSelectedTower(null);
    enemyIdRef.current = 0;
    towerIdRef.current = 0;
  };

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-950/30 to-slate-900" />
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[150px] animate-pulse" />
        </div>

        <div className="relative z-10 max-w-md">
          <div className="relative mb-8">
            <div className="text-8xl animate-float" style={{ animationDuration: '3s' }}>🏰</div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-4xl">🇸🇬</div>
          </div>

          <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-red-400 via-white to-red-400 bg-clip-text text-transparent">
            {config.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{config.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
            <div className="flex items-center justify-center gap-4 mb-4">
              {towerTypes.slice(0, 3).map((type, i) => {
                const data = TOWER_DATA[type] || TOWER_DATA.military;
                return (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: data.color,
                      boxShadow: `0 0 20px ${data.color}50`,
                    }}
                  >
                    {data.icon}
                  </div>
                );
              })}
            </div>
            <p className="text-white/50 text-sm">Place towers to defend Singapore!</p>
          </div>

          <button
            onClick={startGame}
            className="group relative px-16 py-5 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl font-bold text-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30"
          >
            <span className="relative z-10">DEFEND SINGAPORE</span>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-950/30 to-slate-900" />
        <div className="relative z-10 text-center">
          <div
            key={countdownNum}
            className="text-[200px] font-black bg-gradient-to-b from-red-400 to-orange-400 bg-clip-text text-transparent animate-countdown"
          >
            {countdownNum || 'DEFEND!'}
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'finished') {
    const passed = score >= config.targetScore && lives > 0;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-950/30 to-slate-900" />

        {passed && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-confetti-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#ef4444', '#f97316', '#fbbf24', '#22c55e'][i % 4],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 max-w-md phase-enter">
          <div className="text-8xl mb-4">{passed ? '🏆' : lives <= 0 ? '💔' : '💪'}</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            {lives <= 0 ? 'SINGAPORE BREACHED!' : passed ? 'SINGAPORE DEFENDED!' : 'KEEP DEFENDING!'}
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
              <p className="text-3xl font-bold text-green-400">{enemiesDefeated}</p>
              <p className="text-xs text-white/50">Defeated</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-red-400">
                {lives > 0 ? '❤️'.repeat(lives) : '💔'}
              </p>
              <p className="text-xs text-white/50">Lives</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-orange-400">{currentWave}/{totalWaves}</p>
              <p className="text-xs text-white/50">Waves</p>
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
              className="flex-1 py-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl font-bold transition-all hover:scale-105"
            >
              Complete
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'placing') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-950/20 to-slate-900" />

        <div className="relative z-10 text-center">
          <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
            Deploy Your Defences
          </h2>
          <p className="text-white/60 mb-8">Select a tower, then tap a lane to place it</p>

          {/* Tower Selection */}
          <div className="flex gap-4 mb-10 justify-center">
            {towerTypes.map((type) => {
              const data = TOWER_DATA[type] || TOWER_DATA.military;
              const isSelected = selectedTower === type;
              const isPlaced = towers.some((t) => t.type === type);

              return (
                <button
                  key={type}
                  onClick={() => !isPlaced && setSelectedTower(type)}
                  disabled={isPlaced}
                  className={`relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-3xl transition-all ${
                    isSelected ? 'ring-4 ring-white scale-110' : ''
                  } ${isPlaced ? 'opacity-30 grayscale' : 'hover:scale-105'}`}
                  style={{
                    backgroundColor: data.color,
                    boxShadow: isSelected ? `0 0 40px ${data.color}` : `0 0 20px ${data.color}50`,
                  }}
                >
                  <span className="drop-shadow-lg">{data.icon}</span>
                  <span className="text-xs font-bold mt-1 opacity-70">DMG {data.damage}</span>
                  {isPlaced && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Lanes */}
          <div className="flex gap-4 justify-center">
            {Array.from({ length: lanes }).map((_, lane) => {
              const tower = towers.find((t) => t.lane === lane);

              return (
                <button
                  key={lane}
                  onClick={() => placeTower(lane)}
                  disabled={!!tower || !selectedTower}
                  className={`relative w-24 h-40 rounded-2xl border-2 flex flex-col items-center justify-center transition-all overflow-hidden ${
                    tower
                      ? 'border-green-500/50'
                      : selectedTower
                      ? 'border-white/50 hover:border-white hover:bg-white/10'
                      : 'border-white/20'
                  }`}
                  style={{
                    background: tower
                      ? `linear-gradient(to bottom, ${tower.color}30, ${tower.color}10)`
                      : 'rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Lane number */}
                  <span className="absolute top-2 text-xs text-white/40">Lane {lane + 1}</span>

                  {tower ? (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                      style={{ backgroundColor: tower.color, boxShadow: `0 0 20px ${tower.color}50` }}
                    >
                      {tower.icon}
                    </div>
                  ) : (
                    <span className="text-white/20 text-5xl">+</span>
                  )}

                  {/* Singapore flag at bottom */}
                  <span className="absolute bottom-2 text-xl">🇸🇬</span>
                </button>
              );
            })}
          </div>

          <p className="text-white/40 text-sm mt-8">
            {towers.length}/{lanes} towers placed
            {towers.length === lanes && ' — Starting battle...'}
          </p>
        </div>
      </main>
    );
  }

  // Playing phase
  const timerPercentage = (timeLeft / config.timeLimit) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <main
      className={`min-h-screen flex flex-col p-4 relative overflow-hidden transition-transform ${
        screenShake ? 'animate-shake' : ''
      }`}
    >
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-red-950/50" />

      {/* Explosions */}
      {explosions.map((exp) => (
        <div
          key={exp.id}
          className="fixed pointer-events-none z-50"
          style={{ left: `${exp.x}%`, top: `${exp.y}%` }}
        >
          <div
            className="w-20 h-20 rounded-full animate-particle-ring"
            style={{ borderColor: exp.color, borderWidth: 4, transform: 'translate(-50%, -50%)' }}
          />
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-particle-burst"
              style={{
                backgroundColor: exp.color,
                '--particle-angle': `${i * 45}deg`,
                '--particle-distance': '50px',
                transform: 'translate(-50%, -50%)',
              } as React.CSSProperties}
            />
          ))}
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
      <div className="relative z-20 mb-4">
        {/* Timer bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'animate-pulse' : ''}`}
            style={{
              width: `${timerPercentage}%`,
              background: isUrgent
                ? 'linear-gradient(90deg, #ef4444, #f97316)'
                : 'linear-gradient(90deg, #22c55e, #10b981)',
              boxShadow: `0 0 15px ${isUrgent ? '#ef4444' : '#22c55e'}`,
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
              className="text-3xl font-black"
              style={{ color: waveColor, textShadow: `0 0 20px ${waveColor}60` }}
            >
              {score}
            </span>
          </div>
          <div className="text-xl font-bold bg-white/10 px-4 py-1 rounded-full">
            Wave {currentWave}/{totalWaves}
          </div>
          <div className="text-2xl">
            {lives > 0 ? '❤️'.repeat(lives) : '💔'}
          </div>
        </div>
      </div>

      {/* Game Field */}
      <div className="flex-1 flex gap-2 relative z-10">
        {Array.from({ length: lanes }).map((_, lane) => {
          const tower = towers.find((t) => t.lane === lane);
          const laneEnemies = enemies.filter((e) => e.lane === lane);
          const laneProjectiles = projectiles.filter((p) => p.lane === lane);

          return (
            <div
              key={lane}
              className="flex-1 relative rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0.05), rgba(239,68,68,0.1))',
              }}
            >
              {/* Lane grid lines */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 h-px bg-white/30"
                    style={{ top: `${i * 10}%` }}
                  />
                ))}
              </div>

              {/* Tower */}
              {tower && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 z-20"
                  style={{ top: '70%' }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-transform"
                    style={{
                      backgroundColor: tower.color,
                      boxShadow: `0 0 30px ${tower.color}60, 0 5px 20px rgba(0,0,0,0.5)`,
                    }}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                    <span className="relative z-10 drop-shadow-lg">{tower.icon}</span>
                  </div>
                  {/* Attack range indicator */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-16 h-32 -top-24 opacity-20 rounded-full"
                    style={{ backgroundColor: tower.color }}
                  />
                </div>
              )}

              {/* Projectiles */}
              {laneProjectiles.map((proj) => (
                <div
                  key={proj.id}
                  className="absolute left-1/2 -translate-x-1/2 w-3 h-8 rounded-full animate-projectile"
                  style={{
                    top: `${proj.y}%`,
                    backgroundColor: proj.color,
                    boxShadow: `0 0 15px ${proj.color}`,
                  }}
                />
              ))}

              {/* Enemies */}
              {laneEnemies.map((enemy) => (
                <div
                  key={enemy.id}
                  className="absolute left-1/2 -translate-x-1/2 transition-all z-10"
                  style={{ top: `${enemy.position}%` }}
                >
                  <div className={`relative ${enemy.hitFlash ? 'animate-enemy-hit' : ''}`}>
                    {/* Enemy glow */}
                    <div className="absolute inset-[-8px] rounded-full bg-red-500/30 blur-md" />

                    {/* Enemy body */}
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center text-2xl shadow-lg border-2 border-red-400/50">
                      <span className="drop-shadow-lg">{enemy.icon}</span>
                    </div>

                    {/* Health bar */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-2 bg-gray-800 rounded-full overflow-hidden border border-white/20">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                          backgroundColor:
                            enemy.health / enemy.maxHealth > 0.5
                              ? '#22c55e'
                              : enemy.health / enemy.maxHealth > 0.25
                              ? '#eab308'
                              : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Singapore at bottom */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-3xl drop-shadow-lg">
                🇸🇬
              </div>

              {/* Danger zone */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-red-600/30 to-transparent" />
            </div>
          );
        })}
      </div>

      {/* Timer */}
      <div className="relative z-10 text-center mt-4">
        <span
          className={`text-xl font-bold ${isUrgent ? 'text-red-500 animate-pulse' : 'text-white/60'}`}
        >
          {timeLeft}s remaining
        </span>
      </div>
    </main>
  );
}
