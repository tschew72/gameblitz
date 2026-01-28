'use client';

import { useState, useEffect } from 'react';
import { ANSWER_COLORS, DEFAULT_TIME_LIMIT, DEFAULT_POINTS } from '@gameblitz/types';

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
  imageUrl: string | null;
}

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Question, 'id' | 'order'>) => void;
  question: Question | null;
  isSaving: boolean;
}

const getDefaultOptions = (): QuestionOption[] => [
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
];

const getTrueFalseOptions = (): QuestionOption[] => [
  { text: 'True', isCorrect: true },
  { text: 'False', isCorrect: false },
];

export function QuestionEditorModal({
  isOpen,
  onClose,
  onSave,
  question,
  isSaving,
}: QuestionEditorModalProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState<'MULTIPLE_CHOICE' | 'TRUE_FALSE'>('MULTIPLE_CHOICE');
  const [timeLimit, setTimeLimit] = useState(DEFAULT_TIME_LIMIT);
  const [points, setPoints] = useState(DEFAULT_POINTS);
  const [options, setOptions] = useState<QuestionOption[]>(getDefaultOptions());
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setText(question.text);
      setType(question.type);
      setTimeLimit(question.timeLimit);
      setPoints(question.points);
      setOptions([...question.options]);
    } else {
      setText('');
      setType('MULTIPLE_CHOICE');
      setTimeLimit(DEFAULT_TIME_LIMIT);
      setPoints(DEFAULT_POINTS);
      setOptions(getDefaultOptions());
    }
    setValidationError(null);
  }, [question, isOpen]);

  function handleTypeChange(newType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE') {
    setType(newType);
    if (newType === 'TRUE_FALSE') {
      setOptions(getTrueFalseOptions());
    } else {
      setOptions(getDefaultOptions());
    }
    setValidationError(null);
  }

  function handleOptionChange(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text: value };
    setOptions(newOptions);
    setValidationError(null);
  }

  function handleCorrectChange(index: number) {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setOptions(newOptions);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    // Validate question text
    if (!text.trim()) {
      setValidationError('Please enter a question');
      return;
    }

    // Validate all options have text
    const emptyOptions = options.filter((o) => !o.text.trim());
    if (emptyOptions.length > 0) {
      setValidationError('Please fill in all answer options');
      return;
    }

    onSave({
      text: text.trim(),
      type,
      timeLimit,
      points,
      options: options.map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect })),
      imageUrl: null,
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-brand-purple border border-white/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">
            {question ? 'Edit Question' : 'Add Question'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Question</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={2}
              className="input resize-none"
              placeholder="Enter your question"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={type}
                onChange={(e) =>
                  handleTypeChange(e.target.value as 'MULTIPLE_CHOICE' | 'TRUE_FALSE')
                }
                className="input"
              >
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TRUE_FALSE">True/False</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time Limit</label>
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="input"
              >
                <option value={10}>10 seconds</option>
                <option value={20}>20 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={45}>45 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Points</label>
            <select
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="input"
            >
              <option value={500}>500 points</option>
              <option value={1000}>1000 points</option>
              <option value={1500}>1500 points</option>
              <option value={2000}>2000 points</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Answers (click to mark correct)
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCorrectChange(index)}
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                    style={{
                      backgroundColor: ANSWER_COLORS[index].bg,
                      opacity: option.isCorrect ? 1 : 0.4,
                    }}
                  >
                    {option.isCorrect && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required
                    disabled={type === 'TRUE_FALSE'}
                    className="input flex-1"
                    placeholder={`Answer ${index + 1}`}
                    style={{
                      borderColor: `${ANSWER_COLORS[index].bg}60`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {validationError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-200">
              {validationError}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={isSaving}>
              {isSaving ? 'Saving...' : question ? 'Save Changes' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
