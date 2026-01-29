'use client';

import { useParams, useRouter } from 'next/navigation';
import { getWave, getGame } from '../../../../data/content';
import { useRPGProgress } from '../../../../hooks/useRPGProgress';
import { HeroQuest } from '../../../../components/games/HeroQuest';
import { DungeonCrawl } from '../../../../components/games/DungeonCrawl';
import { PillarWarriors } from '../../../../components/games/PillarWarriors';
import { BossRaid } from '../../../../components/games/BossRaid';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const waveId = parseInt(params.waveId as string, 10);
  const gameId = params.gameId as string;

  const wave = getWave(waveId);
  const game = getGame(waveId, gameId);
  const { isLoaded, characterStats, isWaveUnlocked, markGameComplete, addExp } = useRPGProgress();

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!wave || !game) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 p-4">
        <h1 className="text-2xl font-bold mb-4">Quest not found</h1>
        <button
          onClick={() => router.push('/defense-rpg')}
          className="text-purple-400 hover:underline"
        >
          Back to Quest Hub
        </button>
      </main>
    );
  }

  if (!isWaveUnlocked(waveId) || !characterStats) {
    router.push('/defense-rpg');
    return null;
  }

  const handleComplete = (score: number, factsLearned: string[], expEarned: number) => {
    markGameComplete(waveId, gameId, score, factsLearned);
    addExp(expEarned);
  };

  const handleBack = () => {
    router.push(`/defense-rpg/wave/${waveId}`);
  };

  const commonProps = {
    game,
    waveColor: wave.color,
    characterStats,
    onComplete: handleComplete,
    onBack: handleBack,
  };

  switch (game.type) {
    case 'hero-quest':
      return <HeroQuest {...commonProps} />;
    case 'dungeon-crawl':
      return <DungeonCrawl {...commonProps} />;
    case 'pillar-warriors':
      return <PillarWarriors {...commonProps} />;
    case 'boss-raid':
      return <BossRaid {...commonProps} />;
    default:
      return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 p-4">
          <h1 className="text-2xl font-bold mb-4">Unknown quest type</h1>
          <button onClick={handleBack} className="text-purple-400 hover:underline">
            Back to Chapter
          </button>
        </main>
      );
  }
}
