'use client';

import { useEffect, useRef, useState } from 'react';
import { useHostStore } from '@/stores/hostStore';
import { ANSWER_COLORS } from '@gameblitz/types';
import { CountdownRing } from '../game/CountdownRing';

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  timeLimit: number;
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
}

interface HostQuestionProps {
  question: Question | null;
  questions: Question[];
}

const SHAPE_ICONS_SMALL = [
  <svg key="t" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z" /></svg>,
  <svg key="d" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2z" /></svg>,
  <svg key="c" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>,
  <svg key="s" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>,
];

export function HostQuestion({ question, questions }: HostQuestionProps) {
  const {
    currentQuestionIndex,
    totalQuestions,
    playerCount,
    answerCount,
    revealAnswer,
    timeRemaining,
    setTimeRemaining,
  } = useHostStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [autoReveal, setAutoReveal] = useState(false);
  const [totalTime, setTotalTime] = useState(20);

  useEffect(() => {
    if (!question) return;
    setTotalTime(question.timeLimit);
    setTimeRemaining(question.timeLimit);
    setAutoReveal(false);

    timerRef.current = setInterval(() => {
      const current = useHostStore.getState().timeRemaining;
      if (current <= 1) {
        setTimeRemaining(0);
        setAutoReveal(true);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setTimeRemaining(current - 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question, setTimeRemaining]);

  useEffect(() => {
    if (autoReveal) revealAnswer();
  }, [autoReveal, revealAnswer]);

  if (!question) return null;

  const progress = playerCount > 0 ? (answerCount / playerCount) * 100 : 0;

  async function handleReveal() {
    if (timerRef.current) clearInterval(timerRef.current);
    await revealAnswer();
  }

  return (
    <main className="min-h-screen flex flex-col p-6 relative">
      <div className="game-bg" />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-white/40 text-sm font-medium uppercase tracking-wider">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <CountdownRing timeRemaining={timeRemaining} totalTime={totalTime} size={72} strokeWidth={5} />
        </div>

        {/* Question card */}
        <div className="card text-center mb-8 py-10 question-enter bg-white/5">
          <p className="text-2xl md:text-4xl font-bold leading-snug">{question.text}</p>
          <p className="text-white/40 mt-3 text-sm">{question.points} points</p>
        </div>

        {/* Answer grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {question.options.map((option, index) => (
            <div
              key={index}
              className="answer-btn h-28 md:h-36 rounded-xl flex items-center gap-4 px-6"
              style={{
                backgroundColor: ANSWER_COLORS[index].bg,
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <span className="w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
                {SHAPE_ICONS_SMALL[index]}
              </span>
              <span className="text-lg md:text-xl font-semibold">{option.text}</span>
            </div>
          ))}
        </div>

        {/* Answer progress */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm text-white/50">
            <span>{answerCount} of {playerCount} answered</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-pink rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Reveal button */}
        <button onClick={handleReveal} className="btn-primary text-lg py-4">
          {answerCount === playerCount ? 'Show Results' : 'End Question & Reveal'}
        </button>
      </div>
    </main>
  );
}
