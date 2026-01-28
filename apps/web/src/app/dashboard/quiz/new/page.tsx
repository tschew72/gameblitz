'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewQuizPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (res.ok) {
        const { quiz } = await res.json();
        toast.success('Quiz created!');
        router.push(`/dashboard/quiz/${quiz.id}/edit`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create quiz');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-white/60 hover:text-white">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Quiz Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={100}
                className="input"
                placeholder="Enter quiz title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={500}
                className="input resize-none"
                placeholder="Describe your quiz"
              />
            </div>

            <div className="flex gap-4">
              <Link href="/dashboard" className="btn-secondary flex-1 text-center">
                Cancel
              </Link>
              <button type="submit" disabled={isLoading} className="btn-primary flex-1">
                {isLoading ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
