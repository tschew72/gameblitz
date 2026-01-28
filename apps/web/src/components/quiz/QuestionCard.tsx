'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ANSWER_COLORS } from '@gameblitz/types';

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  timeLimit: number;
  points: number;
  options: QuestionOption[];
}

interface QuestionCardProps {
  question: Question;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function QuestionCard({ question, index, onEdit, onDelete }: QuestionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const correctIndex = question.options.findIndex((o) => o.isCorrect);

  return (
    <div ref={setNodeRef} style={style} className="card">
      <div className="flex items-start gap-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-white/40 hover:text-white/60 p-1 mt-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <span className="text-white/40 text-sm">Question {index + 1}</span>
              <h3 className="font-medium mt-1">{question.text}</h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onEdit}
                className="text-white/40 hover:text-white transition-colors"
                title="Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="text-white/40 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {question.options.map((option, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm"
                style={{
                  backgroundColor: `${ANSWER_COLORS[i].bg}${option.isCorrect ? '' : '40'}`,
                }}
              >
                {option.isCorrect && (
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className="truncate">{option.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>{question.timeLimit}s</span>
            <span>{question.points} points</span>
            <span className="capitalize">{question.type.replace('_', ' ').toLowerCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
