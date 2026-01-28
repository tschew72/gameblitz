'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { ANSWER_COLORS } from '@gameblitz/types';
import { CountdownRing } from './CountdownRing';

const SHAPE_ICONS = {
  triangle: (
    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L2 22h20L12 2z" />
    </svg>
  ),
  diamond: (
    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L2 12l10 10 10-10L12 2z" />
    </svg>
  ),
  circle: (
    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  square: (
    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
};

export function PlayerQuestion() {
  const {
    currentQuestion,
    questionIndex,
    totalQuestions,
    timeRemaining,
    hasAnswered,
    selectedAnswer,
    submitAnswer,
    setTimeRemaining,
  } = useGameStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [totalTime, setTotalTime] = useState(20);

  useEffect(() => {
    if (!currentQuestion) return;

    setTotalTime(currentQuestion.timeLimit);
    setTimeRemaining(currentQuestion.timeLimit);

    timerRef.current = setInterval(() => {
      setTimeRemaining(Math.max(0, useGameStore.getState().timeRemaining - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion, setTimeRemaining]);

  if (!currentQuestion) return null;

  if (hasAnswered) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative">
        <div className="game-bg" />
        <div className="phase-enter space-y-6 relative z-10">
          <div
            className="w-28 h-28 mx-auto rounded-2xl flex items-center justify-center answered-pulse"
            style={{ backgroundColor: ANSWER_COLORS[selectedAnswer ?? 0].bg }}
          >
            {SHAPE_ICONS[ANSWER_COLORS[selectedAnswer ?? 0].icon as keyof typeof SHAPE_ICONS]}
          </div>
          <h1 className="text-2xl font-bold">Answer locked in!</h1>
          <div className="orbit-loader mx-auto">
            <div className="orbit-dot" />
            <div className="orbit-dot" />
            <div className="orbit-dot" />
            <div className="orbit-dot" />
          </div>
          <p className="text-white/50">Waiting for other players...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col p-4 relative">
      <div className="game-bg" />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/50 text-sm font-medium tracking-wider uppercase">
            Q{questionIndex + 1} / {totalQuestions}
          </span>
          <CountdownRing timeRemaining={timeRemaining} totalTime={totalTime} size={56} strokeWidth={4} />
        </div>

        {/* Question */}
        <div className="card mb-6 question-enter">
          <p className="text-lg md:text-xl font-semibold text-center leading-relaxed">
            {currentQuestion.text}
          </p>
        </div>

        {/* Answer buttons */}
        <div className="grid grid-cols-1 gap-3 flex-1">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => submitAnswer(index)}
              disabled={timeRemaining === 0}
              className="answer-btn btn-answer flex items-center gap-4 rounded-xl"
              style={{
                backgroundColor: ANSWER_COLORS[index].bg,
                animationDelay: `${index * 0.08}s`,
              }}
            >
              <span className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
                {SHAPE_ICONS[ANSWER_COLORS[index].icon as keyof typeof SHAPE_ICONS]}
              </span>
              <span className="flex-1 text-left text-lg">{option}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
