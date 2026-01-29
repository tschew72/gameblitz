'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameConfig, QuizQuestion, PILLAR_INFO } from '../../data/content';

interface QuizTowerProps {
  game: GameConfig;
  waveColor: string;
  onComplete: (score: number, factsLearned: string[]) => void;
  onBack: () => void;
}

interface Tower {
  id: number;
  lane: number;
  level: number;
  x: number;
}

interface Enemy {
  id: number;
  lane: number;
  x: number;
  health: number;
  maxHealth: number;
  speed: number;
  points: number;
}

interface Projectile {
  id: number;
  towerId: number;
  lane: number;
  x: number;
  targetId: number;
}

export function QuizTower({ game, waveColor, onComplete, onBack }: QuizTowerProps) {
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'playing' | 'quiz' | 'finished'>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [selectedLane, setSelectedLane] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [factsLearned, setFactsLearned] = useState<string[]>([]);
  const [waveNum, setWaveNum] = useState(1);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [showFeedback, setShowFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [towerCredits, setTowerCredits] = useState(1);

  const enemyIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const towerIdRef = useRef(0);
  const questionsRef = useRef([...game.questions]);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const maxWaves = 5;
  const baseEnemiesPerWave = 5;

  const getRandomQuestion = useCallback((): QuizQuestion => {
    if (questionsRef.current.length === 0) {
      questionsRef.current = [...game.questions];
    }
    const index = Math.floor(Math.random() * questionsRef.current.length);
    const question = questionsRef.current[index];
    questionsRef.current.splice(index, 1);
    return question;
  }, [game.questions]);

  const spawnEnemy = useCallback(() => {
    const lane = Math.floor(Math.random() * 3);
    const enemy: Enemy = {
      id: enemyIdRef.current++,
      lane,
      x: 100,
      health: 1 + Math.floor(waveNum / 2),
      maxHealth: 1 + Math.floor(waveNum / 2),
      speed: 0.3 + waveNum * 0.05,
      points: 50 * waveNum,
    };
    setEnemies((prev) => [...prev, enemy]);
  }, [waveNum]);

  const handleLaneClick = (lane: number) => {
    if (phase !== 'playing') return;
    if (towerCredits <= 0) return;

    // Check if tower already exists in lane
    const existingTower = towers.find((t) => t.lane === lane);
    if (existingTower) {
      // Upgrade tower
      if (existingTower.level < 3) {
        setSelectedLane(lane);
        setCurrentQuestion(getRandomQuestion());
        setPhase('quiz');
      }
    } else {
      // Place new tower
      setSelectedLane(lane);
      setCurrentQuestion(getRandomQuestion());
      setPhase('quiz');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (!currentQuestion || selectedLane === null) return;

    const isCorrect = optionIndex === currentQuestion.correctIndex;

    if (isCorrect) {
      setScore((prev) => prev + 100);
      setFactsLearned((prev) => [...new Set([...prev, currentQuestion.fact])]);
      setShowFeedback({ text: `✓ ${currentQuestion.fact}`, correct: true });
      setTowerCredits((prev) => prev - 1);

      // Place or upgrade tower
      const existingTower = towers.find((t) => t.lane === selectedLane);
      if (existingTower) {
        setTowers((prev) =>
          prev.map((t) =>
            t.lane === selectedLane ? { ...t, level: t.level + 1 } : t
          )
        );
      } else {
        setTowers((prev) => [
          ...prev,
          {
            id: towerIdRef.current++,
            lane: selectedLane,
            level: 1,
            x: 15,
          },
        ]);
      }
    } else {
      setShowFeedback({ text: `✗ Wrong! The answer was: ${currentQuestion.options[currentQuestion.correctIndex]}`, correct: false });
    }

    setTimeout(() => {
      setShowFeedback(null);
      setCurrentQuestion(null);
      setSelectedLane(null);
      setPhase('playing');
    }, 1500);
  };

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownNum <= 0) {
      setPhase('playing');
      return;
    }
    const timer = setTimeout(() => setCountdownNum((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdownNum]);

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return;

    // Spawn enemies
    const enemiesThisWave = baseEnemiesPerWave + waveNum * 2;
    let spawnedThisWave = 0;

    const spawnInterval = setInterval(() => {
      if (spawnedThisWave < enemiesThisWave) {
        spawnEnemy();
        spawnedThisWave++;
      }
    }, 2000 - waveNum * 100);

    // Game tick
    gameLoopRef.current = setInterval(() => {
      // Move enemies
      setEnemies((prev) => {
        const updated = prev.map((e) => ({
          ...e,
          x: e.x - e.speed,
        }));

        // Check for enemies reaching base
        const reached = updated.filter((e) => e.x <= 0);
        if (reached.length > 0) {
          setLives((l) => {
            const newLives = l - reached.length;
            if (newLives <= 0) {
              setTimeout(() => setPhase('finished'), 100);
            }
            return Math.max(0, newLives);
          });
        }

        return updated.filter((e) => e.x > 0);
      });

      // Tower shooting
      setTowers((currentTowers) => {
        currentTowers.forEach((tower) => {
          setEnemies((currentEnemies) => {
            const target = currentEnemies.find((e) => e.lane === tower.lane && e.x < 85 && e.x > tower.x);
            if (target) {
              // Create projectile
              setProjectiles((prev) => [
                ...prev,
                {
                  id: projectileIdRef.current++,
                  towerId: tower.id,
                  lane: tower.lane,
                  x: tower.x + 5,
                  targetId: target.id,
                },
              ]);
            }
            return currentEnemies;
          });
        });
        return currentTowers;
      });

      // Move projectiles and check hits
      setProjectiles((prev) => {
        const updated = prev.map((p) => ({
          ...p,
          x: p.x + 3,
        }));

        updated.forEach((proj) => {
          setEnemies((currentEnemies) => {
            const hitEnemy = currentEnemies.find(
              (e) => e.id === proj.targetId && Math.abs(e.x - proj.x) < 5
            );
            if (hitEnemy) {
              const tower = towers.find((t) => t.id === proj.towerId);
              const damage = tower ? tower.level : 1;
              hitEnemy.health -= damage;

              if (hitEnemy.health <= 0) {
                setScore((s) => s + hitEnemy.points);
                setEnemiesDefeated((d) => d + 1);
                return currentEnemies.filter((e) => e.id !== hitEnemy.id);
              }
            }
            return currentEnemies;
          });
        });

        return updated.filter((p) => p.x < 100);
      });
    }, 50);

    // Wave progression
    const waveCheck = setInterval(() => {
      setEnemies((currentEnemies) => {
        if (currentEnemies.length === 0 && spawnedThisWave >= enemiesThisWave) {
          if (waveNum >= maxWaves) {
            setTimeout(() => setPhase('finished'), 500);
          } else {
            setWaveNum((w) => w + 1);
            setTowerCredits((c) => c + 2);
            spawnedThisWave = 0;
          }
        }
        return currentEnemies;
      });
    }, 500);

    return () => {
      clearInterval(spawnInterval);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      clearInterval(waveCheck);
    };
  }, [phase, waveNum, spawnEnemy, towers]);

  const startGame = () => {
    setPhase('countdown');
    setCountdownNum(3);
    setScore(0);
    setLives(5);
    setTowers([]);
    setEnemies([]);
    setProjectiles([]);
    setFactsLearned([]);
    setWaveNum(1);
    setEnemiesDefeated(0);
    setTowerCredits(1);
    questionsRef.current = [...game.questions];
    enemyIdRef.current = 0;
    projectileIdRef.current = 0;
    towerIdRef.current = 0;
  };

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-amber-950 to-slate-900" />

        <div className="relative z-10 max-w-md">
          <div className="text-8xl mb-6">{game.icon}</div>
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
            {game.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{game.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-sm text-white/50 mb-4">How to play:</p>
            <div className="space-y-3 text-left">
              <p className="flex items-center gap-3">
                <span className="text-2xl">🏰</span>
                <span>Tap lanes to place defense towers</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">❓</span>
                <span>Answer questions correctly to build/upgrade</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">👾</span>
                <span>Stop enemies from reaching your base!</span>
              </p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="px-16 py-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl font-bold text-xl hover:scale-105 transition-transform"
          >
            DEFEND NOW
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
      <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-amber-950 to-slate-900" />
        <div
          key={countdownNum}
          className="relative z-10 text-[200px] font-black bg-gradient-to-b from-amber-400 to-orange-400 bg-clip-text text-transparent animate-countdown"
        >
          {countdownNum || 'DEFEND!'}
        </div>
      </main>
    );
  }

  if (phase === 'finished') {
    const passed = lives > 0 && waveNum >= maxWaves;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-amber-950 to-slate-900" />

        <div className="relative z-10 max-w-md phase-enter">
          <div className="text-8xl mb-4">{passed ? '🏆' : lives <= 0 ? '💔' : '💪'}</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            {lives <= 0 ? 'Base Destroyed!' : passed ? 'Victory!' : 'Good Defense!'}
          </h1>

          <div className="text-7xl font-black my-8" style={{ color: waveColor, textShadow: `0 0 60px ${waveColor}40` }}>
            {score.toLocaleString()}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-amber-400">{waveNum}/{maxWaves}</p>
              <p className="text-xs text-white/50">Waves</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-green-400">{enemiesDefeated}</p>
              <p className="text-xs text-white/50">Enemies</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-cyan-400">{towers.length}</p>
              <p className="text-xs text-white/50">Towers</p>
            </div>
          </div>

          {factsLearned.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6 text-left">
              <p className="text-sm text-white/50 mb-2">Facts you learned:</p>
              <ul className="space-y-1">
                {factsLearned.slice(0, 4).map((fact, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-white/80">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={startGame} className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all border border-white/10">
              Try Again
            </button>
            <button onClick={() => onComplete(score, factsLearned)} className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold transition-all hover:scale-105">
              Complete
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'quiz' && currentQuestion) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-amber-950 to-slate-900" />

        {/* Feedback overlay */}
        {showFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
              className={`px-8 py-6 rounded-2xl font-bold text-xl ${
                showFeedback.correct ? 'bg-green-500' : 'bg-red-500'
              } animate-float-up max-w-md text-center`}
            >
              {showFeedback.text}
            </div>
          </div>
        )}

        <div className="relative z-10 max-w-lg w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{PILLAR_INFO[currentQuestion.pillar].icon}</span>
              <span className="text-sm text-white/50">{PILLAR_INFO[currentQuestion.pillar].name}</span>
            </div>
            <h2 className="text-xl font-bold mb-2">{currentQuestion.question}</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showFeedback !== null}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-left transition-all border border-white/10 hover:border-white/30 disabled:opacity-50"
              >
                <span className="mr-3 inline-block w-8 h-8 rounded-full bg-white/10 text-center leading-8">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Playing phase
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-amber-950 to-slate-900" />

      {/* HUD */}
      <div className="fixed top-0 left-0 right-0 p-4 z-30">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <span className="text-2xl font-black" style={{ color: waveColor }}>{score}</span>
          <span className="text-lg font-bold">Wave {waveNum}/{maxWaves}</span>
          <span className="text-xl">{lives > 0 ? '❤️'.repeat(lives) : '💔'}</span>
        </div>
        <div className="max-w-lg mx-auto mt-2 flex justify-between items-center text-sm">
          <span className="text-white/60">Enemies: {enemies.length}</span>
          <span className="text-amber-400 font-bold">🏰 Credits: {towerCredits}</span>
        </div>
      </div>

      {/* Game field */}
      <div className="fixed inset-x-0 top-24 bottom-20 z-10">
        {[0, 1, 2].map((lane) => {
          const tower = towers.find((t) => t.lane === lane);
          return (
            <button
              key={lane}
              onClick={() => handleLaneClick(lane)}
              className="relative w-full h-1/3 border-b border-white/10"
            >
              {/* Lane background */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-900/30 to-transparent" />

              {/* Base */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-3xl">
                🏰
              </div>

              {/* Tower */}
              {tower && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-all"
                  style={{ left: `${tower.x}%` }}
                >
                  <div className="relative">
                    <span className="text-3xl">
                      {tower.level === 1 ? '🗼' : tower.level === 2 ? '🏯' : '🏛️'}
                    </span>
                    <span className="absolute -top-2 -right-2 text-xs bg-amber-500 px-1 rounded">
                      Lv{tower.level}
                    </span>
                  </div>
                </div>
              )}

              {/* Enemies */}
              {enemies
                .filter((e) => e.lane === lane)
                .map((enemy) => (
                  <div
                    key={enemy.id}
                    className="absolute top-1/2 -translate-y-1/2 transition-all"
                    style={{ left: `${enemy.x}%` }}
                  >
                    <div className="relative">
                      <span className="text-2xl">👾</span>
                      {/* Health bar */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-red-900 rounded">
                        <div
                          className="h-full bg-red-500 rounded transition-all"
                          style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

              {/* Projectiles */}
              {projectiles
                .filter((p) => p.lane === lane)
                .map((proj) => (
                  <div
                    key={proj.id}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                    style={{ left: `${proj.x}%`, boxShadow: '0 0 10px #fbbf24' }}
                  />
                ))}

              {/* Place tower hint */}
              {!tower && towerCredits > 0 && (
                <div className="absolute left-[15%] top-1/2 -translate-y-1/2 opacity-30 text-2xl animate-pulse">
                  ➕
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="fixed bottom-4 left-0 right-0 text-center z-20 text-white/40 text-sm">
        Tap a lane to place/upgrade towers • Answer correctly to build
      </div>
    </main>
  );
}
