import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@gameblitz/database';
import { authOptions } from '@/lib/auth';

const questionOptionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const updateQuestionSchema = z.object({
  text: z.string().min(1).optional(),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']).optional(),
  timeLimit: z.number().min(10).max(60).optional(),
  points: z.number().min(500).max(2000).optional(),
  options: z.array(questionOptionSchema).min(2).max(4).optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify quiz ownership and question exists
    const question = await prisma.question.findFirst({
      where: {
        id: params.questionId,
        quizId: params.id,
        quiz: { userId: session.user.id },
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = updateQuestionSchema.parse(body);

    // Validate correct answer if options are being updated
    if (data.options) {
      const correctCount = data.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        return NextResponse.json(
          { error: 'Exactly one option must be marked as correct' },
          { status: 400 }
        );
      }
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: params.questionId },
      data,
    });

    return NextResponse.json({ question: updatedQuestion });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify quiz ownership and question exists
    const question = await prisma.question.findFirst({
      where: {
        id: params.questionId,
        quizId: params.id,
        quiz: { userId: session.user.id },
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    await prisma.question.delete({
      where: { id: params.questionId },
    });

    // Reorder remaining questions
    await prisma.$executeRaw`
      UPDATE "Question"
      SET "order" = "order" - 1
      WHERE "quizId" = ${params.id} AND "order" > ${question.order}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
