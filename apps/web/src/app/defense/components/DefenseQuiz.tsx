'use client';

import { useState } from 'react';
import { QuizQuestion, PILLAR_COLORS } from '../data/content';

interface DefenseQuizProps {
  waveId: number;
  quiz: QuizQuestion;
  waveColor: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

const ANSWER_COLORS = [
  { bg: '#EF3340', name: 'red' },
  { bg: '#1E3A5F', name: 'blue' },
  { bg: '#2E7D32', name: 'green' },
  { bg: '#F57C00', name: 'orange' },
];

export function DefenseQuiz({ waveId, quiz, waveColor, onComplete, onBack }: DefenseQuizProps) {
  const [phase, setPhase] = useState<'question' | 'result'>('question');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(index);
    const isCorrect = index === quiz.correctIndex;
    const points = isCorrect ? 100 : 0;
    setScore(points);

    setTimeout(() => {
      setPhase('result');
    }, 1500);
  };

  const pillarData = PILLAR_COLORS[quiz.pillar];

  if (phase === 'result') {
    const isCorrect = selectedAnswer === quiz.correctIndex;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md phase-enter">
          <span className="text-6xl mb-4 block">{isCorrect ? '🎉' : '📚'}</span>
          <h1 className="text-3xl font-black mb-2">{isCorrect ? 'Correct!' : 'Not Quite!'}</h1>

          <div className="text-5xl font-black my-4" style={{ color: isCorrect ? '#22c55e' : waveColor }}>
            +{score}
          </div>

          {/* Explanation */}
          <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{pillarData.icon}</span>
              <span className="text-sm font-medium" style={{ color: pillarData.bg }}>
                {pillarData.name}
              </span>
            </div>
            <p className="text-white/80 text-sm">{quiz.explanation}</p>
          </div>

          {/* Correct answer highlight */}
          <div className="mb-6">
            <p className="text-xs text-white/40 mb-2">Correct answer:</p>
            <div
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: `${ANSWER_COLORS[quiz.correctIndex].bg}30` }}
            >
              {quiz.options[quiz.correctIndex]}
            </div>
          </div>

          <button
            onClick={() => {
              onComplete(score);
              onBack();
            }}
            className="btn-primary w-full"
          >
            Continue
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-white/50 hover:text-white text-sm">
          &larr; Back
        </button>
        <div className="flex items-center gap-2">
          <span>{pillarData.icon}</span>
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: pillarData.bg }}>
            {pillarData.name}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        <div className="bg-white/10 rounded-2xl p-6 mb-8 question-enter">
          <h1 className="text-xl md:text-2xl font-bold text-center leading-relaxed">{quiz.question}</h1>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {quiz.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === quiz.correctIndex;
            const showResult = selectedAnswer !== null;

            let bgColor = ANSWER_COLORS[index].bg;
            let borderColor = 'transparent';
            let scale = '';

            if (showResult) {
              if (isCorrect) {
                bgColor = '#22c55e';
                borderColor = '#22c55e';
                scale = 'scale-105';
              } else if (isSelected && !isCorrect) {
                bgColor = '#ef4444';
                borderColor = '#ef4444';
              } else {
                bgColor = `${ANSWER_COLORS[index].bg}50`;
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                className={`w-full p-4 rounded-xl text-left font-medium transition-all duration-300 border-2 answer-btn ${scale}`}
                style={{
                  backgroundColor: bgColor,
                  borderColor,
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-sm font-bold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showResult && isCorrect && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Singapore flag decoration */}
      <div className="text-center mt-6">
        <span className="text-4xl">🇸🇬</span>
      </div>
    </main>
  );
}
