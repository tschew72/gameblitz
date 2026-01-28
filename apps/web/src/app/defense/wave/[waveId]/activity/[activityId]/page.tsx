'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { WAVES, getActivity } from '../../../../data/content';
import { useDefenseProgress } from '../../../../hooks/useDefenseProgress';
import { RapidResponse } from '../../../../components/games/RapidResponse';
import { DefenseDefender } from '../../../../components/games/DefenseDefender';
import { ResourceRush } from '../../../../components/games/ResourceRush';
import { ShieldBuilder } from '../../../../components/games/ShieldBuilder';
import { DefenseQuiz } from '../../../../components/DefenseQuiz';

export default function ActivityPage() {
  const params = useParams();
  const router = useRouter();
  const waveId = parseInt(params.waveId as string, 10);
  const activityId = params.activityId as string;

  const { isLoaded, isWaveUnlocked, markActivityComplete } = useDefenseProgress();
  const wave = WAVES.find((w) => w.id === waveId);
  const activity = getActivity(waveId, activityId);

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!wave || !activity) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Activity not found</h1>
        <Link href="/defense" className="text-red-400 hover:underline">Back to waves</Link>
      </main>
    );
  }

  if (!isWaveUnlocked(waveId)) {
    router.push('/defense');
    return null;
  }

  const handleComplete = (score: number) => {
    markActivityComplete(waveId, activityId, score);
  };

  const handleBack = () => {
    router.push(`/defense/wave/${waveId}`);
  };

  // Render the appropriate game or quiz
  if (activity.type === 'quiz' && activity.data) {
    return (
      <DefenseQuiz
        waveId={waveId}
        quiz={activity.data}
        waveColor={wave.color}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    );
  }

  if (activity.type === 'game' && activity.data) {
    const gameData = activity.data;

    switch (gameData.type) {
      case 'rapid-response':
        return (
          <RapidResponse
            config={gameData}
            waveColor={wave.color}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        );
      case 'defense-defender':
        return (
          <DefenseDefender
            config={gameData}
            waveColor={wave.color}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        );
      case 'resource-rush':
        return (
          <ResourceRush
            config={gameData}
            waveColor={wave.color}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        );
      case 'shield-builder':
        return (
          <ShieldBuilder
            config={gameData}
            waveColor={wave.color}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        );
      default:
        return (
          <main className="min-h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4">Unknown game type</h1>
            <button onClick={handleBack} className="text-red-400 hover:underline">Back to wave</button>
          </main>
        );
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Activity not available</h1>
      <button onClick={handleBack} className="text-red-400 hover:underline">Back to wave</button>
    </main>
  );
}
