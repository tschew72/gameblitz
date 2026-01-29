import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@gameblitz/database';
import { authOptions } from '@/lib/auth';
import { QuizEditor } from '@/components/quiz/QuizEditor';
import type { QuestionOption } from '@gameblitz/types';

export default async function EditQuizPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const quizData = await prisma.quiz.findFirst({
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

  if (!quizData) {
    notFound();
  }

  // Transform Prisma data to match Quiz interface
  const quiz = {
    ...quizData,
    questions: quizData.questions.map((q) => ({
      ...q,
      options: q.options as unknown as QuestionOption[],
    })),
  };

  return <QuizEditor quiz={quiz} />;
}
