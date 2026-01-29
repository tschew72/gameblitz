'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PillarType } from '../data/content';

interface CharacterStats {
  class: PillarType;
  level: number;
  exp: number;
  maxHP: number;
  attack: number;
  defense: number;
}

interface RPGProgress {
  characterStats: CharacterStats | null;
  completedGames: Record<string, boolean>;
  gameScores: Record<string, number>;
  unlockedWaves: number[];
  totalScore: number;
  factsLearned: string[];
  achievements: string[];
}

const STORAGE_KEY = 'defense-rpg-progress';

const DEFAULT_PROGRESS: RPGProgress = {
  characterStats: null,
  completedGames: {},
  gameScores: {},
  unlockedWaves: [1],
  totalScore: 0,
  factsLearned: [],
  achievements: [],
};

export function useRPGProgress() {
  const [progress, setProgress] = useState<RPGProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProgress({ ...DEFAULT_PROGRESS, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load RPG progress:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save RPG progress:', e);
    }
  }, [progress, isLoaded]);

  const createCharacter = useCallback((pillarClass: PillarType) => {
    const stats: CharacterStats = {
      class: pillarClass,
      level: 1,
      exp: 0,
      maxHP: 100,
      attack: 10,
      defense: 5,
    };
    setProgress((prev) => ({ ...prev, characterStats: stats }));
  }, []);

  const addExp = useCallback((amount: number) => {
    setProgress((prev) => {
      if (!prev.characterStats) return prev;

      let newExp = prev.characterStats.exp + amount;
      let newLevel = prev.characterStats.level;
      const expToLevel = newLevel * 100;

      while (newExp >= expToLevel) {
        newExp -= expToLevel;
        newLevel++;
      }

      const levelUps = newLevel - prev.characterStats.level;

      return {
        ...prev,
        characterStats: {
          ...prev.characterStats,
          exp: newExp,
          level: newLevel,
          maxHP: prev.characterStats.maxHP + levelUps * 20,
          attack: prev.characterStats.attack + levelUps * 3,
          defense: prev.characterStats.defense + levelUps * 2,
        },
      };
    });
  }, []);

  const markGameComplete = useCallback(
    (waveId: number, gameId: string, score: number, facts: string[]) => {
      setProgress((prev) => {
        const gameKey = `${waveId}-${gameId}`;
        const isNewCompletion = !prev.completedGames[gameKey];

        // Check if wave is now complete
        const waveGames = [
          `${waveId}-hero-quest-${waveId}`,
          `${waveId}-dungeon-crawl-${waveId}`,
          `${waveId}-pillar-warriors-${waveId}`,
          `${waveId}-boss-raid-${waveId}`,
        ];

        const completedGames = { ...prev.completedGames, [gameKey]: true };
        const allWaveComplete = waveGames.every((g) => completedGames[g]);

        const newUnlockedWaves = [...prev.unlockedWaves];
        if (allWaveComplete && waveId < 4 && !newUnlockedWaves.includes(waveId + 1)) {
          newUnlockedWaves.push(waveId + 1);
        }

        return {
          ...prev,
          completedGames,
          gameScores: {
            ...prev.gameScores,
            [gameKey]: Math.max(prev.gameScores[gameKey] || 0, score),
          },
          unlockedWaves: newUnlockedWaves,
          totalScore: isNewCompletion ? prev.totalScore + score : prev.totalScore,
          factsLearned: [...new Set([...prev.factsLearned, ...facts])],
        };
      });
    },
    []
  );

  const isWaveUnlocked = useCallback(
    (waveId: number) => progress.unlockedWaves.includes(waveId),
    [progress.unlockedWaves]
  );

  const isGameComplete = useCallback(
    (waveId: number, gameId: string) => {
      return progress.completedGames[`${waveId}-${gameId}`] || false;
    },
    [progress.completedGames]
  );

  const getGameScore = useCallback(
    (waveId: number, gameId: string) => {
      return progress.gameScores[`${waveId}-${gameId}`] || 0;
    },
    [progress.gameScores]
  );

  const getWaveProgress = useCallback(
    (waveId: number) => {
      const gameIds = [
        `hero-quest-${waveId}`,
        `dungeon-crawl-${waveId}`,
        `pillar-warriors-${waveId}`,
        `boss-raid-${waveId}`,
      ];
      const completed = gameIds.filter((id) => progress.completedGames[`${waveId}-${id}`]).length;
      return { completed, total: 4 };
    },
    [progress.completedGames]
  );

  const addAchievement = useCallback((achievement: string) => {
    setProgress((prev) => {
      if (prev.achievements.includes(achievement)) return prev;
      return { ...prev, achievements: [...prev.achievements, achievement] };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  return {
    ...progress,
    isLoaded,
    createCharacter,
    addExp,
    markGameComplete,
    isWaveUnlocked,
    isGameComplete,
    getGameScore,
    getWaveProgress,
    addAchievement,
    resetProgress,
  };
}
