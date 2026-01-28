import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@gameblitz/database';
import { authOptions } from '@/lib/auth';

const questionOptionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
});

const createQuestionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']),
  timeLimit: z.number().min(10).max(60).optional().default(20),
  points: z.number().min(500).max(2000).optional().default(1000),
  options: z.array(questionOptionSchema).min(2).max(4),
  imageUrl: z.string().url().nullish(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify quiz ownership
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        _count: { select: { questions: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = createQuestionSchema.parse(body);

    // Validate that exactly one option is correct
    const correctCount = data.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      return NextResponse.json(
        { error: 'Exactly one option must be marked as correct' },
        { status: 400 }
      );
    }

    const question = await prisma.question.create({
      data: {
        quizId: params.id,
        text: data.text,
        type: data.type,
        timeLimit: data.timeLimit,
        points: data.points,
        options: data.options,
        imageUrl: data.imageUrl,
        order: quiz._count.questions,
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
