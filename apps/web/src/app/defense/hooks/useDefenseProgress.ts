'use client';

import { useState, useEffect, useCallback } from 'react';
import { WAVES } from '../data/content';

const STORAGE_KEY = 'defense-game-progress';

interface DefenseProgress {
  completedActivities: Record<string, boolean>; // "1-game-1": true
  activityScores: Record<string, number>; // "1-game-1": 580
  unlockedWaves: number[];
}

const defaultProgress: DefenseProgress = {
  completedActivities: {},
  activityScores: {},
  unlockedWaves: [1],
};

export function useDefenseProgress() {
  const [progress, setProgress] = useState<DefenseProgress>(defaultProgress);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch (e) {
        console.error('Failed to save progress:', e);
      }
    }
  }, [progress, isLoaded]);

  const markActivityComplete = useCallback((waveId: number, activityId: string, score: number) => {
    setProgress((prev) => {
      const key = `${waveId}-${activityId}`;
      const newCompleted = { ...prev.completedActivities, [key]: true };
      const newScores = { ...prev.activityScores, [key]: Math.max(prev.activityScores[key] || 0, score) };

      // Check if this wave is now complete
      const wave = WAVES.find((w) => w.id === waveId);
      if (wave) {
        const allActivities = [...wave.games.map((g) => g.id), ...wave.quizzes.map((q) => q.id)];
        const allComplete = allActivities.every((id) => newCompleted[`${waveId}-${id}`]);

        // Unlock next wave if this one is complete
        let newUnlocked = [...prev.unlockedWaves];
        if (allComplete && waveId < WAVES.length && !newUnlocked.includes(waveId + 1)) {
          newUnlocked = [...newUnlocked, waveId + 1];
        }

        return {
          completedActivities: newCompleted,
          activityScores: newScores,
          unlockedWaves: newUnlocked,
        };
      }

      return {
        ...prev,
        completedActivities: newCompleted,
        activityScores: newScores,
      };
    });
  }, []);

  const isActivityComplete = useCallback(
    (waveId: number, activityId: string) => {
      return progress.completedActivities[`${waveId}-${activityId}`] || false;
    },
    [progress.completedActivities]
  );

  const getActivityScore = useCallback(
    (waveId: number, activityId: string) => {
      return progress.activityScores[`${waveId}-${activityId}`] || 0;
    },
    [progress.activityScores]
  );

  const isWaveUnlocked = useCallback(
    (waveId: number) => {
      return progress.unlockedWaves.includes(waveId);
    },
    [progress.unlockedWaves]
  );

  const getWaveProgress = useCallback(
    (waveId: number) => {
      const wave = WAVES.find((w) => w.id === waveId);
      if (!wave) return { completed: 0, total: 0, percentage: 0 };

      const allActivities = [...wave.games.map((g) => g.id), ...wave.quizzes.map((q) => q.id)];
      const completed = allActivities.filter((id) => progress.completedActivities[`${waveId}-${id}`]).length;

      return {
        completed,
        total: allActivities.length,
        percentage: Math.round((completed / allActivities.length) * 100),
      };
    },
    [progress.completedActivities]
  );

  const getWaveScore = useCallback(
    (waveId: number) => {
      const wave = WAVES.find((w) => w.id === waveId);
      if (!wave) return 0;

      const allActivities = [...wave.games.map((g) => g.id), ...wave.quizzes.map((q) => q.id)];
      return allActivities.reduce((sum, id) => sum + (progress.activityScores[`${waveId}-${id}`] || 0), 0);
    },
    [progress.activityScores]
  );

  const getTotalScore = useCallback(() => {
    return Object.values(progress.activityScores).reduce((sum, score) => sum + score, 0);
  }, [progress.activityScores]);

  const resetProgress = useCallback(() => {
    setProgress(defaultProgress);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    isLoaded,
    progress,
    markActivityComplete,
    isActivityComplete,
    getActivityScore,
    isWaveUnlocked,
    getWaveProgress,
    getWaveScore,
    getTotalScore,
    resetProgress,
  };
}
