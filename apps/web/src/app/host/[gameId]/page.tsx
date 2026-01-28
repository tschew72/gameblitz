import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@gameblitz/database';
import { authOptions } from '@/lib/auth';
import { HostGameView } from '@/components/host/HostGameView';

export default async function HostGamePage({ params }: { params: { gameId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const game = await prisma.game.findFirst({
    where: {
      id: params.gameId,
      hostId: session.user.id,
    },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  if (!game) {
    notFound();
  }

  if (game.status === 'FINISHED') {
    redirect('/dashboard');
  }

  return (
    <HostGameView
      gameId={game.id}
      quizId={game.quizId}
      quizTitle={game.quiz.title}
      hostId={session.user.id}
      isPublic={game.isPublic}
      questions={game.quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        timeLimit: q.timeLimit,
        points: q.points,
        options: q.options as Array<{ text: string; isCorrect: boolean }>,
      }))}
    />
  );
}
