'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameConfig, QuizQuestion, PILLAR_INFO } from '../../data/content';
import { ExitGameModal } from '@/components/game/ExitGameModal';

interface KnowledgeBlasterProps {
  game: GameConfig;
  waveColor: string;
  onComplete: (score: number, factsLearned: string[]) => void;
  onBack: () => void;
}

interface Enemy {
  id: number;
  question: QuizQuestion;
  x: number;
  y: number;
  targetY: number;
  health: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  correct: boolean;
}

export function KnowledgeBlaster({ game, waveColor, onComplete, onBack }: KnowledgeBlasterProps) {
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'playing' | 'answering' | 'feedback' | 'finished'>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [factsLearned, setFactsLearned] = useState<string[]>([]);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showFact, setShowFact] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const enemyIdRef = useRef(0);
  const explosionIdRef = useRef(0);
  const questionsRef = useRef([...game.questions]);
  const config = game.config as { enemySpeed: number; spawnRate: number };

  const spawnEnemy = useCallback(() => {
    if (questionsRef.current.length === 0) {
      questionsRef.current = [...game.questions];
    }

    const questionIndex = Math.floor(Math.random() * questionsRef.current.length);
    const question = questionsRef.current.splice(questionIndex, 1)[0];

    const enemy: Enemy = {
      id: enemyIdRef.current++,
      question,
      x: 20 + Math.random() * 60,
      y: -10,
      targetY: 75,
      health: 100,
    };

    setEnemies((prev) => [...prev, enemy]);
  }, [game.questions]);

  const handleEnemyClick = (enemy: Enemy) => {
    if (phase !== 'playing') return;
    setCurrentEnemy(enemy);
    setPhase('answering');
    setSelectedAnswer(null);
  };

  const handleAnswer = (answerIndex: number) => {
    if (!currentEnemy || selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    setQuestionsAsked((prev) => prev + 1);

    const isCorrect = answerIndex === currentEnemy.question.correctIndex;

    if (isCorrect) {
      // Correct answer
      const points = 100 + Math.floor((1 - currentEnemy.y / 100) * 50);
      setScore((prev) => prev + points);
      setCorrectAnswers((prev) => prev + 1);
      setFactsLearned((prev) => [...new Set([...prev, currentEnemy.question.fact])]);
      setShowFact(currentEnemy.question.fact);

      // Remove enemy with explosion
      const explosion: Explosion = {
        id: explosionIdRef.current++,
        x: currentEnemy.x,
        y: currentEnemy.y,
        correct: true,
      };
      setExplosions((prev) => [...prev, explosion]);
      setTimeout(() => {
        setExplosions((prev) => prev.filter((e) => e.id !== explosion.id));
      }, 800);

      setEnemies((prev) => prev.filter((e) => e.id !== currentEnemy.id));
    } else {
      // Wrong answer - enemy continues
      const explosion: Explosion = {
        id: explosionIdRef.current++,
        x: currentEnemy.x,
        y: currentEnemy.y,
        correct: false,
      };
      setExplosions((prev) => [...prev, explosion]);
      setTimeout(() => {
        setExplosions((prev) => prev.filter((e) => e.id !== explosion.id));
      }, 500);
    }

    setPhase('feedback');

    // Show feedback then continue
    setTimeout(() => {
      setCurrentEnemy(null);
      setSelectedAnswer(null);
      setShowFact(null);
      if (lives > 0 && questionsAsked < game.questions.length * 2) {
        setPhase('playing');
      }
    }, isCorrect ? 2000 : 1500);
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

  // Enemy movement
  useEffect(() => {
    if (phase !== 'playing') return;

    const moveInterval = setInterval(() => {
      setEnemies((prev) => {
        const updated = prev.map((enemy) => ({
          ...enemy,
          y: enemy.y + config.enemySpeed,
        }));

        // Check for enemies reaching bottom
        const reached = updated.filter((e) => e.y >= 85);
        if (reached.length > 0) {
          setLives((l) => {
            const newLives = l - reached.length;
            if (newLives <= 0) {
              setTimeout(() => setPhase('finished'), 100);
            }
            return Math.max(0, newLives);
          });
        }

        return updated.filter((e) => e.y < 85);
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [phase, config.enemySpeed]);

  // Spawn enemies
  useEffect(() => {
    if (phase !== 'playing') return;

    const spawnInterval = setInterval(spawnEnemy, config.spawnRate);
    if (enemies.length === 0) spawnEnemy();

    return () => clearInterval(spawnInterval);
  }, [phase, spawnEnemy, config.spawnRate, enemies.length]);

  // Check win condition
  useEffect(() => {
    if (phase === 'playing' && questionsAsked >= game.questions.length && enemies.length === 0) {
      const bonus = lives * 50;
      setScore((prev) => prev + bonus);
      setTimeout(() => setPhase('finished'), 500);
    }
  }, [phase, questionsAsked, enemies.length, game.questions.length, lives]);

  const startGame = () => {
    setPhase('countdown');
    setCountdownNum(3);
    setScore(0);
    setLives(3);
    setEnemies([]);
    setCurrentEnemy(null);
    setSelectedAnswer(null);
    setExplosions([]);
    setFactsLearned([]);
    setQuestionsAsked(0);
    setCorrectAnswers(0);
    questionsRef.current = [...game.questions];
    enemyIdRef.current = 0;
  };

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900" />
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[150px] animate-pulse" style={{ backgroundColor: `${waveColor}20` }} />
        </div>

        <div className="relative z-10 max-w-md">
          <div className="text-8xl mb-6 animate-bounce" style={{ animationDuration: '2s' }}>{game.icon}</div>
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            {game.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{game.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-sm text-white/50 mb-4">How to play:</p>
            <div className="space-y-3 text-left">
              <p className="flex items-center gap-3">
                <span className="text-2xl">👾</span>
                <span>Tap enemies before they reach the base</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">❓</span>
                <span>Answer the question to destroy them</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <span>Learn facts with every correct answer!</span>
              </p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="px-16 py-5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl font-bold text-xl hover:scale-105 transition-transform hover:shadow-2xl hover:shadow-cyan-500/30"
          >
            START MISSION
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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900" />
        <div
          key={countdownNum}
          className="relative z-10 text-[200px] font-black bg-gradient-to-b from-cyan-400 to-purple-400 bg-clip-text text-transparent animate-countdown"
        >
          {countdownNum || 'GO!'}
        </div>
      </main>
    );
  }

  if (phase === 'finished') {
    const accuracy = questionsAsked > 0 ? Math.round((correctAnswers / questionsAsked) * 100) : 0;
    const passed = score >= 300 && lives > 0;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900" />

        {passed && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-confetti-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#06b6d4', '#a855f7', '#22c55e', '#fbbf24'][i % 4],
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 max-w-md phase-enter">
          <div className="text-8xl mb-4">{passed ? '🏆' : lives <= 0 ? '💔' : '💪'}</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {lives <= 0 ? 'Base Destroyed!' : passed ? 'Mission Complete!' : 'Keep Learning!'}
          </h1>

          <div className="text-7xl font-black my-8" style={{ color: waveColor, textShadow: `0 0 60px ${waveColor}40` }}>
            {score.toLocaleString()}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-green-400">{correctAnswers}</p>
              <p className="text-xs text-white/50">Correct</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-cyan-400">{accuracy}%</p>
              <p className="text-xs text-white/50">Accuracy</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-purple-400">{factsLearned.length}</p>
              <p className="text-xs text-white/50">Facts Learned</p>
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
                {factsLearned.length > 4 && (
                  <li className="text-sm text-white/40">+{factsLearned.length - 4} more...</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={startGame}
              className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all border border-white/10"
            >
              Try Again
            </button>
            <button
              onClick={() => { onComplete(score, factsLearned); onBack(); }}
              className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold transition-all hover:scale-105"
            >
              Complete
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Playing/Answering phase
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900" />

      {/* Exit Modal */}
      <ExitGameModal
        isOpen={showExitModal}
        onConfirm={onBack}
        onCancel={() => setShowExitModal(false)}
        gameName={game.title}
      />

      {/* HUD */}
      <div className="fixed top-0 left-0 right-0 p-3 z-30 bg-gradient-to-b from-black/50 to-transparent">
        <div className="max-w-lg mx-auto flex justify-between items-center">
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
            <span className="text-2xl font-black" style={{ color: waveColor }}>{score}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl">{lives > 0 ? '❤️'.repeat(lives) : '💔'}</span>
          </div>
        </div>
      </div>

      {/* Explosions */}
      {explosions.map((exp) => (
        <div
          key={exp.id}
          className="fixed pointer-events-none z-40"
          style={{ left: `${exp.x}%`, top: `${exp.y}%` }}
        >
          <div
            className="w-20 h-20 rounded-full border-4 animate-particle-ring"
            style={{ borderColor: exp.correct ? '#22c55e' : '#ef4444', transform: 'translate(-50%, -50%)' }}
          />
        </div>
      ))}

      {/* Game field */}
      <div className="fixed inset-0 pt-20 pb-4 z-10">
        {/* Enemies */}
        {enemies.map((enemy) => (
          <button
            key={enemy.id}
            onClick={() => handleEnemyClick(enemy)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform ${
              phase === 'playing' ? 'hover:scale-110 cursor-pointer' : 'opacity-50'
            }`}
            style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }}
            disabled={phase !== 'playing'}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-2xl animate-pulse"
              style={{
                backgroundColor: PILLAR_INFO[enemy.question.pillar].color,
                boxShadow: `0 0 30px ${PILLAR_INFO[enemy.question.pillar].color}60`,
              }}
            >
              {PILLAR_INFO[enemy.question.pillar].icon}
            </div>
          </button>
        ))}

        {/* Base */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
          <div className="text-5xl mb-2">🏛️</div>
          <p className="text-white/40 text-sm">Protect the Base!</p>
        </div>

        {/* Danger zone */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-red-600/20 to-transparent pointer-events-none" />
      </div>

      {/* Question overlay */}
      {(phase === 'answering' || phase === 'feedback') && currentEnemy && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-800/90 rounded-3xl p-6 border border-white/10">
            {/* Question */}
            <div className="text-center mb-6">
              <span className="text-4xl mb-4 block">{PILLAR_INFO[currentEnemy.question.pillar].icon}</span>
              <h2 className="text-2xl font-bold">{currentEnemy.question.question}</h2>
            </div>

            {/* Answers */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {currentEnemy.question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentEnemy.question.correctIndex;
                const showResult = phase === 'feedback';

                let bgColor = 'bg-white/10 hover:bg-white/20';
                if (showResult) {
                  if (isCorrect) {
                    bgColor = 'bg-green-500';
                  } else if (isSelected && !isCorrect) {
                    bgColor = 'bg-red-500';
                  }
                } else if (isSelected) {
                  bgColor = 'bg-cyan-500';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={phase === 'feedback'}
                    className={`p-4 rounded-xl font-bold text-lg transition-all ${bgColor} ${
                      phase === 'feedback' ? '' : 'active:scale-95'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {phase === 'feedback' && (
              <div className="text-center">
                {selectedAnswer === currentEnemy.question.correctIndex ? (
                  <div className="space-y-2">
                    <p className="text-green-400 font-bold text-xl">Correct! 🎉</p>
                    {showFact && (
                      <div className="bg-green-500/20 rounded-xl p-3 border border-green-500/30">
                        <p className="text-sm text-white/70">Fact learned:</p>
                        <p className="font-bold text-green-400">{showFact}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-400 font-bold text-xl">Not quite! 💪</p>
                    <p className="text-white/60 text-sm">{currentEnemy.question.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
