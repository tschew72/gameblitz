'use client';

import { useHostStore } from '@/stores/hostStore';
import { ANSWER_COLORS } from '@gameblitz/types';

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  timeLimit: number;
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
}

interface HostResultsProps {
  question: Question | null;
}

export function HostResults({ question }: HostResultsProps) {
  const { questionResults, showLeaderboard, currentQuestionIndex, totalQuestions } = useHostStore();

  if (!question || !questionResults) return null;

  const totalAnswers = questionResults.answerCounts.reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...questionResults.answerCounts, 1);

  return (
    <main className="min-h-screen flex flex-col p-6 relative">
      <div className="game-bg" />

      <div className="relative z-10 flex flex-col flex-1 phase-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/40 text-sm uppercase tracking-wider">
            Q{currentQuestionIndex + 1} / {totalQuestions}
          </span>
          <span className="text-white/40 text-sm">{totalAnswers} answers</span>
        </div>

        {/* Question */}
        <div className="card text-center mb-8 bg-white/5">
          <p className="text-xl font-bold">{question.text}</p>
        </div>

        {/* Answer distribution bars */}
        <div className="flex-1 space-y-5 mb-8">
          {question.options.map((option, index) => {
            const count = questionResults.answerCounts[index] || 0;
            const percentage = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const isCorrect = index === questionResults.correctIndex;

            return (
              <div
                key={index}
                className="lb-row"
                style={{ animationDelay: `${index * 0.12}s` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center ${isCorrect ? 'ring-2 ring-white/50' : ''}`}
                      style={{ backgroundColor: ANSWER_COLORS[index].bg }}
                    >
                      {isCorrect && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${isCorrect ? 'font-bold' : 'text-white/80'}`}>{option.text}</span>
                  </div>
                  <span className="text-white/50 text-sm tabular-nums">
                    {count} ({Math.round(percentage)}%)
                  </span>
                </div>
                <div className="h-9 bg-white/5 rounded-lg overflow-hidden">
                  <div
                    className="bar-fill h-full rounded-lg transition-all duration-700"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: isCorrect ? '#26890c' : ANSWER_COLORS[index].bg,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => showLeaderboard()} className="btn-primary text-lg py-4">
          Show Leaderboard
        </button>
      </div>
    </main>
  );
}
