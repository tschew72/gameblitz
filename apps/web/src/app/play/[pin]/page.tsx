'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { PlayerLobby } from '@/components/game/PlayerLobby';
import { PlayerQuestion } from '@/components/game/PlayerQuestion';
import { PlayerResults } from '@/components/game/PlayerResults';
import { PlayerLeaderboard } from '@/components/game/PlayerLeaderboard';
import { PlayerPodium } from '@/components/game/PlayerPodium';
import toast from 'react-hot-toast';

export default function PlayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const pin = params.pin as string;
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const {
    connect,
    disconnect,
    joinGame,
    isConnected,
    gamePhase,
    error,
    playerId,
    leaveGame,
  } = useGameStore();

  useEffect(() => {
    connect();
    // Don't disconnect on cleanup - let the socket persist
    // The socket will be cleaned up when navigating away or closing the page
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !isConnected) return;

    setIsJoining(true);
    const success = await joinGame(pin, nickname.trim());
    setIsJoining(false);

    if (!success) {
      // Error already shown via toast
    }
  }

  // Show nickname form if not joined
  if (!playerId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-2">Join Game</h1>
          <p className="text-white/60 text-center mb-6">PIN: {pin}</p>

          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              maxLength={20}
              className="input text-center text-xl"
              autoFocus
              disabled={!isConnected}
            />

            <button
              type="submit"
              disabled={!nickname.trim() || !isConnected || isJoining}
              className="btn-primary w-full"
            >
              {!isConnected ? 'Connecting...' : isJoining ? 'Joining...' : 'Join'}
            </button>
          </form>

          <button
            onClick={() => router.push('/play')}
            className="w-full text-white/60 hover:text-white mt-4 text-sm"
          >
            &larr; Enter different PIN
          </button>
        </div>
      </main>
    );
  }

  // Render based on game phase
  switch (gamePhase) {
    case 'lobby':
      return <PlayerLobby />;
    case 'question':
      return <PlayerQuestion />;
    case 'results':
      return <PlayerResults />;
    case 'leaderboard':
      return <PlayerLeaderboard />;
    case 'finished':
      return <PlayerPodium />;
    default:
      return (
        <main className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading...</div>
        </main>
      );
  }
}
