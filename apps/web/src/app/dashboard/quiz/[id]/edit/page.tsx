import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@gameblitz/database';
import { authOptions } from '@/lib/auth';
import { QuizEditor } from '@/components/quiz/QuizEditor';

export default async function EditQuizPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const quiz = await prisma.quiz.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  return <QuizEditor quiz={quiz} />;
}
