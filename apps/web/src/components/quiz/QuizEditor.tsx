'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { QuestionCard } from './QuestionCard';
import { QuestionEditorModal } from './QuestionEditorModal';
import type { Question as QuestionType, QuestionOption } from '@gameblitz/types';

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  timeLimit: number;
  points: number;
  options: QuestionOption[];
  order: number;
  imageUrl: string | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

interface QuizEditorProps {
  quiz: Quiz;
}

export function QuizEditor({ quiz: initialQuiz }: QuizEditorProps) {
  const router = useRouter();
  const [quiz, setQuiz] = useState(initialQuiz);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = quiz.questions.findIndex((q) => q.id === active.id);
      const newIndex = quiz.questions.findIndex((q) => q.id === over.id);

      const newQuestions = arrayMove(quiz.questions, oldIndex, newIndex);
      setQuiz({ ...quiz, questions: newQuestions });

      // Save new order
      try {
        await fetch(`/api/quizzes/${quiz.id}/questions/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds: newQuestions.map((q) => q.id) }),
        });
      } catch {
        toast.error('Failed to save order');
      }
    }
  }

  async function handleSaveQuestion(data: Omit<Question, 'id' | 'order'>) {
    setIsSaving(true);

    try {
      if (editingQuestion) {
        // Update existing question
        const res = await fetch(
          `/api/quizzes/${quiz.id}/questions/${editingQuestion.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }
        );

        if (res.ok) {
          const { question } = await res.json();
          setQuiz({
            ...quiz,
            questions: quiz.questions.map((q) =>
              q.id === editingQuestion.id ? { ...question, options: data.options } : q
            ),
          });
          toast.success('Question updated');
        } else {
          const { error } = await res.json();
          toast.error(error || 'Failed to update question');
        }
      } else {
        // Create new question
        const res = await fetch(`/api/quizzes/${quiz.id}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          const { question } = await res.json();
          setQuiz({
            ...quiz,
            questions: [...quiz.questions, { ...question, options: data.options }],
          });
          toast.success('Question added');
        } else {
          const { error } = await res.json();
          toast.error(error || 'Failed to add question');
        }
      }

      setIsModalOpen(false);
      setEditingQuestion(null);
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm('Delete this question?')) return;

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setQuiz({
          ...quiz,
          questions: quiz.questions.filter((q) => q.id !== questionId),
        });
        toast.success('Question deleted');
      } else {
        toast.error('Failed to delete question');
      }
    } catch {
      toast.error('An error occurred');
    }
  }

  function openAddModal() {
    setEditingQuestion(null);
    setIsModalOpen(true);
  }

  function openEditModal(question: Question) {
    setEditingQuestion(question);
    setIsModalOpen(true);
  }

  async function handleStartGame() {
    if (quiz.questions.length === 0) {
      toast.error('Add at least one question before starting a game');
      return;
    }

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quiz.id }),
      });

      if (res.ok) {
        const { game } = await res.json();
        router.push(`/host/${game.id}`);
      } else {
        toast.error('Failed to create game');
      }
    } catch {
      toast.error('An error occurred');
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white/5 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-white/60 hover:text-white">
            &larr; Back to Dashboard
          </Link>
          <button onClick={handleStartGame} className="btn-primary text-sm">
            Start Game
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          {quiz.description && <p className="text-white/60 mt-2">{quiz.description}</p>}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Questions ({quiz.questions.length})
          </h2>
          <button onClick={openAddModal} className="btn-secondary text-sm">
            + Add Question
          </button>
        </div>

        {quiz.questions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-white/60 mb-4">No questions yet</p>
            <button onClick={openAddModal} className="btn-primary">
              Add Your First Question
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={quiz.questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {quiz.questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    onEdit={() => openEditModal(question)}
                    onDelete={() => handleDeleteQuestion(question.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      <QuestionEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        question={editingQuestion}
        isSaving={isSaving}
      />
    </div>
  );
}
