'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameConfig, QuizQuestion, PILLAR_INFO } from '../../data/content';
import { ExitGameModal } from '@/components/game/ExitGameModal';

interface PillarMatchProps {
  game: GameConfig;
  waveColor: string;
  onComplete: (score: number, factsLearned: string[]) => void;
  onBack: () => void;
}

interface Card {
  id: number;
  type: 'question' | 'answer';
  content: string;
  question: QuizQuestion;
  isFlipped: boolean;
  isMatched: boolean;
}

export function PillarMatch({ game, waveColor, onComplete, onBack }: PillarMatchProps) {
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'playing' | 'finished'>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState((game.config.timeLimit as number) || 90);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [factsLearned, setFactsLearned] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [showFact, setShowFact] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const pairs = (game.config.pairs as number) || 6;

  const initializeCards = useCallback(() => {
    const questions = game.questions.slice(0, pairs);
    const newCards: Card[] = [];
    let cardId = 0;

    questions.forEach((q) => {
      // Question card
      newCards.push({
        id: cardId++,
        type: 'question',
        content: q.question,
        question: q,
        isFlipped: false,
        isMatched: false,
      });
      // Answer card (correct answer)
      newCards.push({
        id: cardId++,
        type: 'answer',
        content: q.options[q.correctIndex],
        question: q,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }

    setCards(newCards);
  }, [game.questions, pairs]);

  const handleCardClick = (cardId: number) => {
    if (phase !== 'playing') return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

    // Flip the card
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);

      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.id === firstId)!;
      const secondCard = cards.find((c) => c.id === secondId)!;

      // Check if they match (same question, different types)
      const isMatch =
        firstCard.question.id === secondCard.question.id &&
        firstCard.type !== secondCard.type;

      if (isMatch) {
        // Match found!
        const points = 100 + Math.floor(timeLeft / 2);
        setScore((prev) => prev + points);
        setMatchedPairs((prev) => prev + 1);
        setFactsLearned((prev) => [...new Set([...prev, firstCard.question.fact])]);
        setShowFact(firstCard.question.fact);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c
            )
          );
          setFlippedCards([]);
          setShowFact(null);
        }, 1500);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
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

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Check win
  useEffect(() => {
    if (phase === 'playing' && matchedPairs === pairs) {
      const bonus = timeLeft * 5;
      setScore((prev) => prev + bonus);
      setTimeout(() => setPhase('finished'), 500);
    }
  }, [phase, matchedPairs, pairs, timeLeft]);

  const startGame = () => {
    setPhase('countdown');
    setCountdownNum(3);
    setScore(0);
    setTimeLeft((game.config.timeLimit as number) || 90);
    setFlippedCards([]);
    setMatchedPairs(0);
    setFactsLearned([]);
    setMoves(0);
    initializeCards();
  };

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900" />

        <div className="relative z-10 max-w-md">
          <div className="text-8xl mb-6">{game.icon}</div>
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            {game.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{game.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-sm text-white/50 mb-4">How to play:</p>
            <div className="space-y-3 text-left">
              <p className="flex items-center gap-3">
                <span className="text-2xl">🎴</span>
                <span>Flip cards to reveal questions and answers</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">🔗</span>
                <span>Match each question with its correct answer</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <span>Learn facts when you make a match!</span>
              </p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="px-16 py-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-xl hover:scale-105 transition-transform"
          >
            START MATCHING
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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900" />
        <div
          key={countdownNum}
          className="relative z-10 text-[100px] sm:text-[150px] md:text-[200px] font-black bg-gradient-to-b from-purple-400 to-pink-400 bg-clip-text text-transparent animate-countdown"
        >
          {countdownNum || 'GO!'}
        </div>
      </main>
    );
  }

  if (phase === 'finished') {
    const passed = matchedPairs === pairs;
    const efficiency = moves > 0 ? Math.round((pairs / moves) * 100) : 0;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900" />

        <div className="relative z-10 max-w-md phase-enter">
          <div className="text-8xl mb-4">{passed ? '🏆' : '💪'}</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {passed ? 'All Matched!' : 'Good Try!'}
          </h1>

          <div className="text-7xl font-black my-8" style={{ color: waveColor, textShadow: `0 0 60px ${waveColor}40` }}>
            {score.toLocaleString()}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-green-400">{matchedPairs}/{pairs}</p>
              <p className="text-xs text-white/50">Matched</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-purple-400">{moves}</p>
              <p className="text-xs text-white/50">Moves</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-pink-400">{efficiency}%</p>
              <p className="text-xs text-white/50">Efficiency</p>
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
            <button onClick={() => { onComplete(score, factsLearned); onBack(); }} className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold transition-all hover:scale-105">
              Complete
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Playing phase
  return (
    <main className="min-h-screen relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900" />

      {/* Exit Modal */}
      <ExitGameModal
        isOpen={showExitModal}
        onConfirm={onBack}
        onCancel={() => setShowExitModal(false)}
        gameName={game.title}
      />

      {/* HUD */}
      <div className="relative z-20 max-w-lg mx-auto mb-4 pt-2">
        <div className="flex justify-between items-center mb-2">
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
          <span className={`text-xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}>{timeLeft}s</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(matchedPairs / pairs) * 100}%`,
              backgroundColor: waveColor,
            }}
          />
        </div>
      </div>

      {/* Fact popup */}
      {showFact && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-green-500/90 backdrop-blur-xl px-8 py-4 rounded-2xl animate-float-up">
            <p className="text-white font-bold text-lg">✓ {showFact}</p>
          </div>
        </div>
      )}

      {/* Card grid */}
      <div className="relative z-10 max-w-lg mx-auto grid grid-cols-3 gap-2 sm:gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isFlipped || card.isMatched || flippedCards.length >= 2}
            className={`aspect-[3/4] rounded-xl transition-all duration-300 ${
              card.isMatched ? 'opacity-30 scale-95' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0)',
            }}
          >
            {/* Card back */}
            <div
              className={`absolute inset-0 rounded-xl flex items-center justify-center text-4xl transition-all ${
                card.isFlipped || card.isMatched ? 'opacity-0' : 'opacity-100'
              }`}
              style={{
                backgroundColor: waveColor,
                backfaceVisibility: 'hidden',
              }}
            >
              ❓
            </div>

            {/* Card front */}
            <div
              className={`absolute inset-0 rounded-xl p-2 flex flex-col items-center justify-center transition-all ${
                card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'
              } ${card.isMatched ? 'bg-green-500/80' : 'bg-white/10'}`}
              style={{
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
              }}
            >
              {card.type === 'question' ? (
                <>
                  <span className="text-2xl mb-1">{PILLAR_INFO[card.question.pillar].icon}</span>
                  <p className="text-xs text-center leading-tight">{card.content}</p>
                </>
              ) : (
                <>
                  <span className="text-lg mb-1">✓</span>
                  <p className="text-xs text-center font-bold leading-tight">{card.content}</p>
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Hint */}
      <div className="relative z-10 text-center mt-4 text-white/40 text-sm">
        Match questions with correct answers
      </div>
    </main>
  );
}
