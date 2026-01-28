'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHostStore } from '@/stores/hostStore';
import { HostLobby } from './HostLobby';
import { HostQuestion } from './HostQuestion';
import { HostResults } from './HostResults';
import { HostLeaderboard } from './HostLeaderboard';
import { HostPodium } from './HostPodium';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  timeLimit: number;
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
}

interface HostGameViewProps {
  gameId: string;
  quizId: string;
  quizTitle: string;
  hostId: string;
  isPublic: boolean;
  questions: Question[];
}

export function HostGameView({ gameId, quizId, quizTitle, hostId, isPublic, questions }: HostGameViewProps) {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    connect,
    disconnect,
    createGame,
    isConnected,
    gamePhase,
    pin,
    error,
    reset,
  } = useHostStore();

  useEffect(() => {
    connect();
    // Don't disconnect on cleanup - prevents React StrictMode issues
  }, []);

  useEffect(() => {
    if (isConnected && !isInitialized) {
      createGame(quizId, hostId).then((success) => {
        if (success) {
          setIsInitialized(true);
        }
      });
    }
  }, [isConnected, isInitialized, quizId, hostId, createGame]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  function handleExit() {
    reset();
    router.push('/dashboard');
  }

  if (!pin) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Setting up game...</p>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[useHostStore.getState().currentQuestionIndex] || null;

  switch (gamePhase) {
    case 'lobby':
      return <HostLobby pin={pin} quizTitle={quizTitle} isPublic={isPublic} onExit={handleExit} />;
    case 'question':
      return <HostQuestion question={currentQuestion} questions={questions} />;
    case 'results':
      return <HostResults question={currentQuestion} />;
    case 'leaderboard':
      return <HostLeaderboard questions={questions} />;
    case 'finished':
      return <HostPodium onExit={handleExit} />;
    default:
      return (
        <main className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading...</div>
        </main>
      );
  }
}
