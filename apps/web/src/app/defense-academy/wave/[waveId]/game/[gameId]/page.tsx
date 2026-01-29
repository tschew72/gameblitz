'use client';

import { useParams, useRouter } from 'next/navigation';
import { getWave, getGame } from '../../../../data/content';
import { useAcademyProgress } from '../../../../hooks/useAcademyProgress';
import { KnowledgeBlaster } from '../../../../components/games/KnowledgeBlaster';
import { PillarMatch } from '../../../../components/games/PillarMatch';
import { FactRunner } from '../../../../components/games/FactRunner';
import { QuizTower } from '../../../../components/games/QuizTower';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const waveId = parseInt(params.waveId as string, 10);
  const gameId = params.gameId as string;

  const wave = getWave(waveId);
  const game = getGame(waveId, gameId);
  const { isLoaded, isWaveUnlocked, markGameComplete } = useAcademyProgress();

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!wave || !game) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 p-4">
        <h1 className="text-2xl font-bold mb-4">Game not found</h1>
        <button
          onClick={() => router.push('/defense-academy')}
          className="text-cyan-400 hover:underline"
        >
          Back to Academy
        </button>
      </main>
    );
  }

  if (!isWaveUnlocked(waveId)) {
    router.push('/defense-academy');
    return null;
  }

  const handleComplete = (score: number, factsLearned: string[]) => {
    markGameComplete(waveId, gameId, score, factsLearned);
  };

  const handleBack = () => {
    router.push(`/defense-academy/wave/${waveId}`);
  };

  const commonProps = {
    game,
    waveColor: wave.color,
    onComplete: handleComplete,
    onBack: handleBack,
  };

  switch (game.type) {
    case 'knowledge-blaster':
      return <KnowledgeBlaster {...commonProps} />;
    case 'pillar-match':
      return <PillarMatch {...commonProps} />;
    case 'fact-runner':
      return <FactRunner {...commonProps} />;
    case 'quiz-tower':
      return <QuizTower {...commonProps} />;
    default:
      return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 p-4">
          <h1 className="text-2xl font-bold mb-4">Unknown game type</h1>
          <button onClick={handleBack} className="text-cyan-400 hover:underline">
            Back to Wave
          </button>
        </main>
      );
  }
}
