'use client';

import { useGameStore } from '@/stores/gameStore';
import { ANSWER_COLORS } from '@gameblitz/types';
import { Confetti } from './Confetti';

export function PlayerResults() {
  const { questionResults, selectedAnswer } = useGameStore();

  if (!questionResults) return null;

  const isCorrect = questionResults.playerResult?.isCorrect ?? false;
  const pointsEarned = questionResults.playerResult?.pointsEarned ?? 0;
  const totalScore = questionResults.playerResult?.totalScore ?? 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative">
      <div className="game-bg" />
      <Confetti active={isCorrect} count={60} />

      <div className="space-y-8 w-full max-w-md relative z-10 phase-enter">
        {/* Result icon */}
        <div
          className={`result-icon w-36 h-36 mx-auto rounded-full flex items-center justify-center ${
            isCorrect ? 'bg-green-500 result-correct' : 'bg-red-500/90 result-incorrect'
          }`}
        >
          {isCorrect ? (
            <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* Text */}
        <div>
          <h1 className="text-4xl font-extrabold mb-3">
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </h1>
          {isCorrect && (
            <p className="text-3xl font-bold text-brand-pink points-reveal">
              +{pointsEarned.toLocaleString()}
            </p>
          )}
        </div>

        {/* Correct answer shown on miss */}
        {!isCorrect && (
          <div className="card animate-fadeIn">
            <p className="text-white/50 text-sm uppercase tracking-wider mb-3">Correct answer</p>
            <div
              className="py-3 px-5 rounded-lg font-semibold text-lg"
              style={{ backgroundColor: ANSWER_COLORS[questionResults.correctIndex].bg }}
            >
              Option {questionResults.correctIndex + 1}
            </div>
          </div>
        )}

        {/* Score */}
        <div className="pt-2">
          <p className="text-white/40 text-sm uppercase tracking-wider">Total score</p>
          <p className="text-4xl font-extrabold score-glow">{totalScore.toLocaleString()}</p>
        </div>
      </div>
    </main>
  );
}
