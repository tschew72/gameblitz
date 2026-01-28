'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    questionCount: number;
    gamesPlayed: number;
    updatedAt: Date;
  };
}

export function QuizCard({ quiz }: QuizCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Quiz deleted');
        router.refresh();
      } else {
        toast.error('Failed to delete quiz');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  }

  function handleStartClick() {
    if (quiz.questionCount === 0) {
      toast.error('Add at least one question before starting a game');
      return;
    }
    setShowStartDialog(true);
  }

  async function handleConfirmStart() {
    setIsStarting(true);
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quiz.id, isPublic }),
      });

      if (res.ok) {
        const { game } = await res.json();
        router.push(`/host/${game.id}`);
      } else {
        toast.error('Failed to create game');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="card hover:bg-white/15 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold truncate flex-1">{quiz.title}</h3>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-white/40 hover:text-red-400 transition-colors ml-2"
          title="Delete quiz"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {quiz.description && (
        <p className="text-white/60 text-sm mb-4 line-clamp-2">{quiz.description}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-white/60 mb-6">
        <span>{quiz.questionCount} questions</span>
        <span>{quiz.gamesPlayed} games played</span>
      </div>

      {showStartDialog ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Public game</p>
              <p className="text-xs text-white/40">Players can find and join without a PIN</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isPublic ? 'bg-brand-pink' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowStartDialog(false); setIsPublic(false); }}
              className="btn-secondary text-sm flex-1"
              disabled={isStarting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmStart}
              className="btn-primary text-sm flex-1"
              disabled={isStarting}
            >
              {isStarting ? 'Starting...' : 'Start Game'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Link href={`/dashboard/quiz/${quiz.id}/edit`} className="btn-secondary text-sm flex-1 text-center">
            Edit
          </Link>
          <button onClick={handleStartClick} className="btn-primary text-sm flex-1">
            Start Game
          </button>
        </div>
      )}
    </div>
  );
}
