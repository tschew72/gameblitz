'use client';

import { useHostStore } from '@/stores/hostStore';

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  timeLimit: number;
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
}

interface HostLeaderboardProps {
  questions: Question[];
}

export function HostLeaderboard({ questions }: HostLeaderboardProps) {
  const { leaderboard, nextQuestion, endGame, currentQuestionIndex, totalQuestions } = useHostStore();

  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

  async function handleNext() {
    if (isLastQuestion) {
      await endGame();
    } else {
      await nextQuestion();
    }
  }

  return (
    <main className="min-h-screen flex flex-col p-6 relative">
      <div className="game-bg" />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="text-center mb-8 phase-enter">
          <h1 className="text-3xl font-black">Leaderboard</h1>
          <p className="text-white/40 text-sm mt-1">
            After question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        </div>

        {/* Top 5 */}
        <div className="flex-1 max-w-2xl mx-auto w-full">
          <div className="space-y-4">
            {leaderboard.slice(0, 5).map((entry, index) => (
              <div key={entry.playerId} className="lb-row card flex items-center gap-4 py-5 bg-white/5">
                <span
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    index === 0
                      ? 'rank-badge-gold'
                      : index === 1
                        ? 'rank-badge-silver'
                        : index === 2
                          ? 'rank-badge-bronze'
                          : 'bg-white/10'
                  }`}
                >
                  {entry.rank}
                </span>
                <span className="flex-1 font-bold text-lg truncate">{entry.nickname}</span>
                <div className="text-right">
                  <p className="font-bold text-xl tabular-nums">{entry.score.toLocaleString()}</p>
                  {entry.pointsThisRound !== undefined && entry.pointsThisRound > 0 && (
                    <p className="text-green-400 text-sm font-semibold points-reveal">
                      +{entry.pointsThisRound.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {leaderboard.length > 5 && (
            <p className="text-center text-white/30 mt-4 text-sm">
              +{leaderboard.length - 5} more players
            </p>
          )}
        </div>

        <button onClick={handleNext} className="btn-primary text-lg py-4 mt-8">
          {isLastQuestion ? 'Show Final Results' : 'Next Question'}
        </button>
      </div>
    </main>
  );
}
