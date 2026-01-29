'use client';

import { useEffect } from 'react';

interface ExitGameModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  gameName?: string;
}

export function ExitGameModal({ isOpen, onConfirm, onCancel, gameName }: ExitGameModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-2xl animate-scaleIn">
        <div className="text-center">
          <div className="text-5xl mb-4">🚪</div>
          <h2 className="text-xl font-bold mb-2">Exit Game?</h2>
          <p className="text-white/60 text-sm mb-6">
            {gameName ? `Leave ${gameName}? ` : ''}
            Your progress in this game will not be saved.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all border border-white/10"
            >
              Keep Playing
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-all"
            >
              Exit Game
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
