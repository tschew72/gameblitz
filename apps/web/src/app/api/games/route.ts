import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@gameblitz/database';
import { generateGamePin } from '@gameblitz/game-logic';
import { authOptions } from '@/lib/auth';

const createGameSchema = z.object({
  quizId: z.string(),
  isPublic: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quizId, isPublic } = createGameSchema.parse(body);

    // Verify quiz ownership and has questions
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id,
      },
      include: {
        _count: { select: { questions: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (quiz._count.questions === 0) {
      return NextResponse.json(
        { error: 'Quiz must have at least one question' },
        { status: 400 }
      );
    }

    // Generate unique PIN
    let pin: string;
    let attempts = 0;
    do {
      pin = generateGamePin();
      const existing = await prisma.game.findUnique({ where: { pin } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json({ error: 'Failed to generate game PIN' }, { status: 500 });
    }

    const game = await prisma.game.create({
      data: {
        pin,
        quizId,
        hostId: session.user.id,
        status: 'LOBBY',
        isPublic,
      },
    });

    return NextResponse.json({ game }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}
