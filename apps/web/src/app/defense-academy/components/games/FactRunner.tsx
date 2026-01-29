'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameConfig, QuizQuestion, PILLAR_INFO } from '../../data/content';
import { ExitGameModal } from '@/components/game/ExitGameModal';

interface FactRunnerProps {
  game: GameConfig;
  waveColor: string;
  onComplete: (score: number, factsLearned: string[]) => void;
  onBack: () => void;
}

interface FactItem {
  id: number;
  statement: string;
  isTrue: boolean;
  question: QuizQuestion;
  x: number;
  y: number;
  lane: number;
}

export function FactRunner({ game, waveColor, onComplete, onBack }: FactRunnerProps) {
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'playing' | 'finished'>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState((game.config.lives as number) || 3);
  const [playerLane, setPlayerLane] = useState(1);
  const [facts, setFacts] = useState<FactItem[]>([]);
  const [factsLearned, setFactsLearned] = useState<string[]>([]);
  const [distance, setDistance] = useState(0);
  const [correctCollected, setCorrectCollected] = useState(0);
  const [wrongCollected, setWrongCollected] = useState(0);
  const [showFeedback, setShowFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const factIdRef = useRef(0);
  const questionsRef = useRef([...game.questions]);
  const speed = (game.config.speed as number) || 1;

  const generateFact = useCallback((): FactItem | null => {
    if (questionsRef.current.length === 0) {
      questionsRef.current = [...game.questions];
    }

    const qIndex = Math.floor(Math.random() * questionsRef.current.length);
    const question = questionsRef.current[qIndex];

    // Randomly decide if we show a true or false statement
    const isTrue = Math.random() > 0.4;

    let statement: string;
    if (isTrue) {
      // Show the correct answer as a true statement
      statement = `${question.question.replace('?', ':')} ${question.options[question.correctIndex]}`;
    } else {
      // Show a wrong answer as a false statement
      const wrongIndex = question.options.findIndex((_, i) => i !== question.correctIndex);
      const wrongAnswers = question.options.filter((_, i) => i !== question.correctIndex);
      const wrongAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
      statement = `${question.question.replace('?', ':')} ${wrongAnswer}`;
    }

    // Simplify statement if too long
    if (statement.length > 60) {
      statement = isTrue ? `✓ ${question.fact}` : `✗ NOT: ${question.fact}`;
    }

    const lane = Math.floor(Math.random() * 3);

    return {
      id: factIdRef.current++,
      statement,
      isTrue,
      question,
      x: 50,
      y: -15,
      lane,
    };
  }, [game.questions]);

  const handleLaneChange = (direction: 'left' | 'right') => {
    if (phase !== 'playing') return;

    setPlayerLane((prev) => {
      if (direction === 'left') return Math.max(0, prev - 1);
      if (direction === 'right') return Math.min(2, prev + 1);
      return prev;
    });
  };

  const handleCollision = useCallback(
    (fact: FactItem) => {
      if (fact.isTrue) {
        // Collected a true fact!
        const points = 100;
        setScore((prev) => prev + points);
        setCorrectCollected((prev) => prev + 1);
        setFactsLearned((prev) => [...new Set([...prev, fact.question.fact])]);
        setShowFeedback({ text: `✓ Correct! ${fact.question.fact}`, correct: true });
      } else {
        // Collected a false fact - lose a life
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setTimeout(() => setPhase('finished'), 500);
          }
          return newLives;
        });
        setWrongCollected((prev) => prev + 1);
        setShowFeedback({ text: `✗ That was false!`, correct: false });
      }

      setTimeout(() => setShowFeedback(null), 1500);
    },
    []
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') handleLaneChange('left');
      if (e.key === 'ArrowRight' || e.key === 'd') handleLaneChange('right');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  // Touch controls
  const handleTouch = (lane: number) => {
    if (phase !== 'playing') return;
    setPlayerLane(lane);
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

    // Spawn facts
    const spawnInterval = setInterval(() => {
      const fact = generateFact();
      if (fact) setFacts((prev) => [...prev, fact]);
    }, 2000 / speed);

    // Move facts
    const moveInterval = setInterval(() => {
      setDistance((prev) => prev + 1);

      setFacts((prev) => {
        const updated = prev.map((f) => ({
          ...f,
          y: f.y + 1.5 * speed,
        }));

        // Check collisions
        const collided: FactItem[] = [];
        const remaining = updated.filter((f) => {
          if (f.y >= 75 && f.y <= 90 && f.lane === playerLane) {
            collided.push(f);
            return false;
          }
          return f.y < 100;
        });

        collided.forEach(handleCollision);

        return remaining;
      });
    }, 50);

    // Win condition
    const winCheck = setInterval(() => {
      if (distance >= 500) {
        const bonus = lives * 50;
        setScore((prev) => prev + bonus);
        setPhase('finished');
      }
    }, 100);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(moveInterval);
      clearInterval(winCheck);
    };
  }, [phase, speed, playerLane, distance, generateFact, handleCollision, lives]);

  const startGame = () => {
    setPhase('countdown');
    setCountdownNum(3);
    setScore(0);
    setLives((game.config.lives as number) || 3);
    setPlayerLane(1);
    setFacts([]);
    setFactsLearned([]);
    setDistance(0);
    setCorrectCollected(0);
    setWrongCollected(0);
    questionsRef.current = [...game.questions];
    factIdRef.current = 0;
  };

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-950 to-slate-900" />

        <div className="relative z-10 max-w-md">
          <div className="text-8xl mb-6">{game.icon}</div>
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
            {game.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{game.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-sm text-white/50 mb-4">How to play:</p>
            <div className="space-y-3 text-left">
              <p className="flex items-center gap-3">
                <span className="text-2xl">🏃</span>
                <span>Swipe or tap to change lanes</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <span>Collect TRUE facts for points</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">❌</span>
                <span>Avoid FALSE facts or lose lives</span>
              </p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="px-16 py-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl font-bold text-xl hover:scale-105 transition-transform"
          >
            START RUNNING
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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-950 to-slate-900" />
        <div
          key={countdownNum}
          className="relative z-10 text-[100px] sm:text-[150px] md:text-[200px] font-black bg-gradient-to-b from-green-400 to-emerald-400 bg-clip-text text-transparent animate-countdown"
        >
          {countdownNum || 'RUN!'}
        </div>
      </main>
    );
  }

  if (phase === 'finished') {
    const passed = lives > 0 && distance >= 500;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-950 to-slate-900" />

        <div className="relative z-10 max-w-md phase-enter">
          <div className="text-8xl mb-4">{passed ? '🏆' : lives <= 0 ? '💔' : '💪'}</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            {lives <= 0 ? 'Out of Lives!' : passed ? 'Finish Line!' : 'Good Run!'}
          </h1>

          <div className="text-7xl font-black my-8" style={{ color: waveColor, textShadow: `0 0 60px ${waveColor}40` }}>
            {score.toLocaleString()}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-green-400">{correctCollected}</p>
              <p className="text-xs text-white/50">True Facts</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-red-400">{wrongCollected}</p>
              <p className="text-xs text-white/50">False Facts</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-cyan-400">{Math.floor(distance)}m</p>
              <p className="text-xs text-white/50">Distance</p>
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
            <button onClick={() => { onComplete(score, factsLearned); onBack(); }} className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-bold transition-all hover:scale-105">
              Complete
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Playing phase
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-green-950 to-slate-900" />

      {/* Road animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 60px)',
            animation: 'roadScroll 0.5s linear infinite',
          }}
        />
      </div>

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
          <span className="text-2xl font-black" style={{ color: waveColor }}>{score}</span>
          <span className="text-xl">{lives > 0 ? '❤️'.repeat(lives) : '💔'}</span>
        </div>
        {/* Progress bar */}
        <div className="max-w-lg mx-auto mt-2">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all bg-green-500"
              style={{ width: `${Math.min(100, (distance / 500) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Feedback popup */}
      {showFeedback && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div
            className={`px-6 py-3 rounded-xl font-bold text-lg ${
              showFeedback.correct ? 'bg-green-500' : 'bg-red-500'
            } animate-float-up`}
          >
            {showFeedback.text}
          </div>
        </div>
      )}

      {/* Game lanes */}
      <div className="fixed inset-x-0 top-20 bottom-0 flex z-10">
        {[0, 1, 2].map((lane) => (
          <button
            key={lane}
            onClick={() => handleTouch(lane)}
            className="flex-1 relative border-x border-white/5"
          >
            {/* Lane facts */}
            {facts
              .filter((f) => f.lane === lane)
              .map((fact) => (
                <div
                  key={fact.id}
                  className="absolute left-1/2 -translate-x-1/2 w-[90%] transition-all"
                  style={{ top: `${fact.y}%` }}
                >
                  <div
                    className={`p-3 rounded-xl text-center text-sm font-bold ${
                      fact.isTrue
                        ? 'bg-green-500/80 border-2 border-green-400'
                        : 'bg-red-500/80 border-2 border-red-400'
                    }`}
                  >
                    <p className="line-clamp-2">{fact.isTrue ? '✓ TRUE' : '✗ FALSE'}</p>
                  </div>
                </div>
              ))}

            {/* Player */}
            {lane === playerLane && (
              <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2">
                <div className="text-5xl animate-bounce" style={{ animationDuration: '0.5s' }}>
                  🏃
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Control hints */}
      <div className="fixed bottom-4 left-0 right-0 text-center z-20 text-white/40 text-sm">
        Tap lanes or use ← → keys
      </div>

      <style jsx>{`
        @keyframes roadScroll {
          from { transform: translateY(0); }
          to { transform: translateY(60px); }
        }
      `}</style>
    </main>
  );
}
