import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@gameblitz/database';
import { authOptions } from '@/lib/auth';

const reorderSchema = z.object({
  questionIds: z.array(z.string()),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
        questions: { select: { id: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const body = await request.json();
    const { questionIds } = reorderSchema.parse(body);

    // Validate all question IDs belong to this quiz
    const quizQuestionIds = new Set(quiz.questions.map((q) => q.id));
    const allValid = questionIds.every((id) => quizQuestionIds.has(id));

    if (!allValid || questionIds.length !== quiz.questions.length) {
      return NextResponse.json({ error: 'Invalid question IDs' }, { status: 400 });
    }

    // Update order for each question
    await prisma.$transaction(
      questionIds.map((id, index) =>
        prisma.question.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error reordering questions:', error);
    return NextResponse.json({ error: 'Failed to reorder questions' }, { status: 500 });
  }
}
