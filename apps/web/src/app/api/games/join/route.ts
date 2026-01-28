import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@gameblitz/database';
import { isValidPin } from '@gameblitz/game-logic';

const joinGameSchema = z.object({
  pin: z.string().refine(isValidPin, 'Invalid game PIN'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = joinGameSchema.parse(body);

    const game = await prisma.game.findUnique({
      where: { pin },
      include: {
        quiz: {
          select: {
            title: true,
            _count: { select: { questions: true } },
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.status === 'FINISHED') {
      return NextResponse.json({ error: 'Game has ended' }, { status: 400 });
    }

    if (game.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Game already in progress' }, { status: 400 });
    }

    return NextResponse.json({
      game: {
        pin: game.pin,
        quizTitle: game.quiz.title,
        questionCount: game.quiz._count.questions,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error joining game:', error);
    return NextResponse.json({ error: 'Failed to join game' }, { status: 500 });
  }
}
