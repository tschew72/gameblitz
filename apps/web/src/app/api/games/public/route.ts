import { NextResponse } from 'next/server';
import { prisma } from '@gameblitz/database';

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      where: {
        status: 'LOBBY',
        isPublic: true,
      },
      include: {
        quiz: {
          select: {
            title: true,
            _count: { select: { questions: true } },
          },
        },
        host: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const publicGames = games.map((game) => ({
      pin: game.pin,
      quizTitle: game.quiz.title,
      questionCount: game.quiz._count.questions,
      hostName: game.host.name,
      createdAt: game.createdAt.toISOString(),
    }));

    return NextResponse.json({ games: publicGames });
  } catch (error) {
    console.error('Error fetching public games:', error);
    return NextResponse.json({ error: 'Failed to fetch public games' }, { status: 500 });
  }
}
