'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PublicGame {
  pin: string;
  quizTitle: string;
  questionCount: number;
  hostName: string;
  createdAt: string;
}

export default function PlayPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [publicGames, setPublicGames] = useState<PublicGame[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  useEffect(() => {
    fetchPublicGames();
    const interval = setInterval(fetchPublicGames, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchPublicGames() {
    try {
      const res = await fetch('/api/games/public');
      if (res.ok) {
        const data = await res.json();
        setPublicGames(data.games);
      }
    } catch {
      // Silent fail - PIN entry still works
    } finally {
      setIsLoadingGames(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 6) {
      toast.error('PIN must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/games/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/play/${pin}`);
      } else {
        toast.error(data.error || 'Game not found');
      }
    } catch {
      toast.error('Connection failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="game-bg" />

      <div className="text-center space-y-8 w-full max-w-md relative z-10">
        <Link href="/" className="text-4xl font-bold inline-block phase-enter">
          Game<span className="text-brand-pink">Blitz</span>
        </Link>

        <div className="card phase-enter" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-2xl font-bold mb-6">Join a Game</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter game PIN"
                className="input text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={pin.length !== 6 || isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </button>
          </form>
        </div>

        {/* Public Games Section */}
        {!isLoadingGames && publicGames.length > 0 && (
          <div className="w-full phase-enter" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-white/10" />
              <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                Open Games
              </h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="space-y-3">
              {publicGames.map((game) => (
                <button
                  key={game.pin}
                  onClick={() => router.push(`/play/${game.pin}`)}
                  className="card w-full text-left hover:bg-white/15 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{game.quizTitle}</h3>
                      <p className="text-sm text-white/50">
                        by {game.hostName} &middot; {game.questionCount} questions
                      </p>
                    </div>
                    <span className="btn-primary text-sm px-4 py-1.5 shrink-0 group-hover:scale-105 transition-transform">
                      Join
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoadingGames && (
          <p className="text-white/30 text-sm animate-pulse">Looking for open games...</p>
        )}

        <p className="text-white/60 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          Want to create quizzes?{' '}
          <Link href="/login" className="text-brand-pink hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
