import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@gameblitz/database';
import { authOptions } from '@/lib/auth';
import { QuizCard } from '@/components/dashboard/QuizCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const quizzes = await prisma.quiz.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { questions: true, games: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="min-h-screen">
      <DashboardHeader user={session.user} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Quizzes</h1>
            <p className="text-white/60 mt-1">Create and manage your quiz games</p>
          </div>
          <Link href="/dashboard/quiz/new" className="btn-primary">
            Create Quiz
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <div className="card text-center py-16">
            <h2 className="text-xl font-semibold mb-2">No quizzes yet</h2>
            <p className="text-white/60 mb-6">Create your first quiz to get started!</p>
            <Link href="/dashboard/quiz/new" className="btn-primary inline-block">
              Create Your First Quiz
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={{
                  ...quiz,
                  questionCount: quiz._count.questions,
                  gamesPlayed: quiz._count.games,
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
