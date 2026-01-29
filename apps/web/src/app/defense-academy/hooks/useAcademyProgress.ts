'use client';

import { useState, useEffect, useCallback } from 'react';

interface AcademyProgress {
  completedGames: Record<string, number>; // "wave1-game1": score
  unlockedWaves: number[];
  totalScore: number;
  factsLearned: string[]; // Track learned facts
}

const STORAGE_KEY = 'defence-academy-progress';

const DEFAULT_PROGRESS: AcademyProgress = {
  completedGames: {},
  unlockedWaves: [1],
  totalScore: 0,
  factsLearned: [],
};

export function useAcademyProgress() {
  const [progress, setProgress] = useState<AcademyProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load academy progress:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  const saveProgress = useCallback((newProgress: AcademyProgress) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (e) {
      console.error('Failed to save academy progress:', e);
    }
  }, []);

  const markGameComplete = useCallback(
    (waveId: number, gameId: string, score: number, facts: string[]) => {
      const key = `wave${waveId}-${gameId}`;
      const existingScore = progress.completedGames[key] || 0;

      // Only update if new score is higher
      if (score <= existingScore) {
        // Still add any new facts
        const newFacts = [...new Set([...progress.factsLearned, ...facts])];
        if (newFacts.length > progress.factsLearned.length) {
          saveProgress({ ...progress, factsLearned: newFacts });
        }
        return;
      }

      const scoreDiff = score - existingScore;
      const newProgress = {
        ...progress,
        completedGames: { ...progress.completedGames, [key]: score },
        totalScore: progress.totalScore + scoreDiff,
        factsLearned: [...new Set([...progress.factsLearned, ...facts])],
      };

      // Check if wave is now complete (all 4 games done)
      const waveGames = ['game-1', 'game-2', 'game-3', 'game-4'];
      const waveComplete = waveGames.every((g) => newProgress.completedGames[`wave${waveId}-${g}`] > 0);

      if (waveComplete && !newProgress.unlockedWaves.includes(waveId + 1) && waveId < 4) {
        newProgress.unlockedWaves = [...newProgress.unlockedWaves, waveId + 1];
      }

      saveProgress(newProgress);
    },
    [progress, saveProgress]
  );

  const isWaveUnlocked = useCallback(
    (waveId: number) => {
      return progress.unlockedWaves.includes(waveId);
    },
    [progress.unlockedWaves]
  );

  const isGameComplete = useCallback(
    (waveId: number, gameId: string) => {
      const key = `wave${waveId}-${gameId}`;
      return (progress.completedGames[key] || 0) > 0;
    },
    [progress.completedGames]
  );

  const getGameScore = useCallback(
    (waveId: number, gameId: string) => {
      const key = `wave${waveId}-${gameId}`;
      return progress.completedGames[key] || 0;
    },
    [progress.completedGames]
  );

  const getWaveProgress = useCallback(
    (waveId: number) => {
      const games = ['game-1', 'game-2', 'game-3', 'game-4'];
      const completed = games.filter((g) => (progress.completedGames[`wave${waveId}-${g}`] || 0) > 0).length;
      return {
        completed,
        total: 4,
        percentage: Math.round((completed / 4) * 100),
      };
    },
    [progress.completedGames]
  );

  const getWaveScore = useCallback(
    (waveId: number) => {
      const games = ['game-1', 'game-2', 'game-3', 'game-4'];
      return games.reduce((sum, g) => sum + (progress.completedGames[`wave${waveId}-${g}`] || 0), 0);
    },
    [progress.completedGames]
  );

  const resetProgress = useCallback(() => {
    saveProgress(DEFAULT_PROGRESS);
  }, [saveProgress]);

  return {
    isLoaded,
    progress,
    markGameComplete,
    isWaveUnlocked,
    isGameComplete,
    getGameScore,
    getWaveProgress,
    getWaveScore,
    getTotalScore: () => progress.totalScore,
    getFactsLearned: () => progress.factsLearned,
    resetProgress,
  };
}
