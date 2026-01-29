'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameConfig, QuizQuestion, PILLAR_INFO } from '../../data/content';

interface CharacterStats {
  class: string;
  level: number;
  maxHP: number;
  attack: number;
  defense: number;
}

interface DungeonCrawlProps {
  game: GameConfig;
  waveColor: string;
  characterStats: CharacterStats;
  onComplete: (score: number, factsLearned: string[], expEarned: number) => void;
  onBack: () => void;
}

interface Room {
  id: number;
  type: 'start' | 'treasure' | 'trap' | 'boss' | 'exit';
  explored: boolean;
  unlocked: boolean;
}

const ROOM_INFO = {
  start: { icon: '🚪', name: 'Entrance', color: '#22c55e' },
  treasure: { icon: '💎', name: 'Treasure Room', color: '#eab308' },
  trap: { icon: '⚠️', name: 'Trap Room', color: '#ef4444' },
  boss: { icon: '👹', name: 'Guardian Chamber', color: '#a855f7' },
  exit: { icon: '🏆', name: 'Exit', color: '#06b6d4' },
};

export function DungeonCrawl({ game, waveColor, characterStats, onComplete, onBack }: DungeonCrawlProps) {
  const [phase, setPhase] = useState<'ready' | 'exploring' | 'quiz' | 'reward' | 'finished'>('ready');
  const [score, setScore] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [factsLearned, setFactsLearned] = useState<string[]>([]);
  const [treasuresFound, setTreasuresFound] = useState(0);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [showReward, setShowReward] = useState<{ type: string; amount: number } | null>(null);
  const [trapDamage, setTrapDamage] = useState(0);

  const totalRooms = (game.config.rooms as number) || 5;
  const totalTreasures = (game.config.treasures as number) || 3;
  const totalTraps = (game.config.traps as number) || 0;

  const generateDungeon = useCallback(() => {
    const newRooms: Room[] = [];

    // Start room
    newRooms.push({ id: 0, type: 'start', explored: true, unlocked: true });

    // Generate middle rooms
    const middleCount = totalRooms - 2;
    const treasureCount = Math.min(totalTreasures, middleCount - 1);
    const trapCount = Math.min(totalTraps, middleCount - treasureCount - 1);

    const roomTypes: ('treasure' | 'trap' | 'boss')[] = [];
    for (let i = 0; i < treasureCount; i++) roomTypes.push('treasure');
    for (let i = 0; i < trapCount; i++) roomTypes.push('trap');
    if (middleCount > roomTypes.length) {
      roomTypes.push('boss');
    }
    while (roomTypes.length < middleCount) {
      roomTypes.push('treasure');
    }

    // Shuffle
    for (let i = roomTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roomTypes[i], roomTypes[j]] = [roomTypes[j], roomTypes[i]];
    }

    roomTypes.forEach((type, i) => {
      newRooms.push({ id: i + 1, type, explored: false, unlocked: false });
    });

    // Exit room
    newRooms.push({ id: newRooms.length, type: 'exit', explored: false, unlocked: false });

    setRooms(newRooms);
  }, [totalRooms, totalTreasures, totalTraps]);

  const getQuestion = useCallback((): QuizQuestion | null => {
    if (questionsUsed >= game.questions.length) {
      return game.questions[Math.floor(Math.random() * game.questions.length)];
    }
    const q = game.questions[questionsUsed];
    setQuestionsUsed((prev) => prev + 1);
    return q;
  }, [game.questions, questionsUsed]);

  const enterRoom = (roomId: number) => {
    if (phase !== 'exploring') return;
    if (roomId !== currentRoom + 1) return; // Can only enter next room

    const room = rooms[roomId];
    if (!room || room.explored) return;

    // Need to answer a question to unlock
    const question = getQuestion();
    if (question) {
      setCurrentQuestion(question);
      setPhase('quiz');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (!currentQuestion) return;

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    const nextRoomId = currentRoom + 1;
    const nextRoom = rooms[nextRoomId];

    if (isCorrect) {
      setScore((prev) => prev + 30);
      setFactsLearned((prev) => [...new Set([...prev, currentQuestion.fact])]);

      // Unlock and explore the room
      setRooms((prev) =>
        prev.map((r) =>
          r.id === nextRoomId ? { ...r, explored: true, unlocked: true } : r
        )
      );
      setCurrentRoom(nextRoomId);

      // Handle room effects
      if (nextRoom.type === 'treasure') {
        const reward = 100 + Math.floor(Math.random() * 50);
        setScore((prev) => prev + reward);
        setTreasuresFound((prev) => prev + 1);
        setShowReward({ type: 'treasure', amount: reward });
        setPhase('reward');
      } else if (nextRoom.type === 'trap') {
        const damage = 10 + Math.floor(Math.random() * 10);
        setTrapDamage((prev) => prev + damage);
        setShowReward({ type: 'trap', amount: damage });
        setPhase('reward');
      } else if (nextRoom.type === 'boss') {
        const reward = 150;
        setScore((prev) => prev + reward);
        setShowReward({ type: 'boss', amount: reward });
        setPhase('reward');
      } else if (nextRoom.type === 'exit') {
        const bonus = 200;
        setScore((prev) => prev + bonus);
        setShowReward({ type: 'exit', amount: bonus });
        setPhase('reward');
      } else {
        setPhase('exploring');
      }
    } else {
      // Wrong answer - stay in current room
      setPhase('exploring');
    }

    setCurrentQuestion(null);
  };

  const continueExploring = () => {
    const nextRoom = rooms[currentRoom];
    if (nextRoom?.type === 'exit') {
      setPhase('finished');
    } else {
      setShowReward(null);
      setPhase('exploring');
    }
  };

  const startGame = () => {
    setPhase('exploring');
    setScore(0);
    setCurrentRoom(0);
    setFactsLearned([]);
    setTreasuresFound(0);
    setQuestionsUsed(0);
    setTrapDamage(0);
    generateDungeon();
  };

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950" />

        <div className="relative z-10 max-w-md">
          <div className="text-8xl mb-6">{game.icon}</div>
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {game.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{game.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-sm text-white/50 mb-4">Dungeon Rules:</p>
            <div className="space-y-3 text-left">
              <p className="flex items-center gap-3">
                <span className="text-2xl">🚪</span>
                <span>Answer questions to unlock doors</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">💎</span>
                <span>Find treasures for bonus points</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <span>Reach the exit to complete</span>
              </p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="px-16 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl font-bold text-xl hover:scale-105 transition-transform"
          >
            ENTER DUNGEON
          </button>

          <button onClick={onBack} className="block mx-auto mt-6 text-white/40 hover:text-white transition-colors">
            ← Back to chapter
          </button>
        </div>
      </main>
    );
  }

  if (phase === 'quiz' && currentQuestion) {
    const pillarInfo = PILLAR_INFO[currentQuestion.pillar];

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950" />

        <div className="relative z-10 max-w-lg w-full">
          <div className="text-center mb-6">
            <span className="text-4xl">🔑</span>
            <p className="text-white/60 mt-2">Answer to unlock the door!</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{pillarInfo.icon}</span>
              <span className="text-sm text-white/50">{pillarInfo.name}</span>
            </div>
            <h2 className="text-xl font-bold">{currentQuestion.question}</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className="p-4 bg-white/10 hover:bg-emerald-500/30 rounded-xl font-medium text-left transition-all border border-white/10 hover:border-emerald-500/50"
              >
                <span className="mr-3 inline-block w-8 h-8 rounded-full bg-white/10 text-center leading-8">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'reward' && showReward) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950" />

        <div className="relative z-10 text-center phase-enter">
          {showReward.type === 'treasure' && (
            <>
              <div className="text-8xl mb-4 animate-bounce">💎</div>
              <h2 className="text-3xl font-black text-amber-400">Treasure Found!</h2>
              <p className="text-xl text-white/60 mt-2">+{showReward.amount} points</p>
            </>
          )}
          {showReward.type === 'trap' && (
            <>
              <div className="text-8xl mb-4">⚠️</div>
              <h2 className="text-3xl font-black text-red-400">Trap Triggered!</h2>
              <p className="text-xl text-white/60 mt-2">-{showReward.amount} HP (virtual)</p>
            </>
          )}
          {showReward.type === 'boss' && (
            <>
              <div className="text-8xl mb-4">👹</div>
              <h2 className="text-3xl font-black text-purple-400">Guardian Defeated!</h2>
              <p className="text-xl text-white/60 mt-2">+{showReward.amount} points</p>
            </>
          )}
          {showReward.type === 'exit' && (
            <>
              <div className="text-8xl mb-4">🏆</div>
              <h2 className="text-3xl font-black text-cyan-400">Dungeon Complete!</h2>
              <p className="text-xl text-white/60 mt-2">+{showReward.amount} bonus</p>
            </>
          )}

          <button
            onClick={continueExploring}
            className="mt-8 px-12 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            Continue
          </button>
        </div>
      </main>
    );
  }

  if (phase === 'finished') {
    const expEarned = 40 + treasuresFound * 15 + (currentRoom >= rooms.length - 1 ? 30 : 0);

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950" />

        <div className="relative z-10 max-w-md phase-enter">
          <div className="text-8xl mb-4">🏆</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Dungeon Cleared!
          </h1>

          <div className="text-6xl font-black my-6" style={{ color: waveColor }}>
            {score.toLocaleString()}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-emerald-400">{currentRoom}/{rooms.length - 1}</p>
              <p className="text-xs text-white/50">Rooms</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-amber-400">{treasuresFound}</p>
              <p className="text-xs text-white/50">Treasures</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-purple-400">+{expEarned}</p>
              <p className="text-xs text-white/50">EXP</p>
            </div>
          </div>

          {factsLearned.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6 text-left">
              <p className="text-sm text-white/50 mb-2">Secrets discovered:</p>
              <ul className="space-y-1">
                {factsLearned.slice(0, 3).map((fact, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-white/80">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={startGame} className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all border border-white/10">
              Try Again
            </button>
            <button onClick={() => onComplete(score, factsLearned, expEarned)} className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold transition-all hover:scale-105">
              Complete
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Exploring phase
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950" />

      <div className="relative z-10 max-w-lg mx-auto p-4">
        {/* HUD */}
        <div className="flex justify-between items-center py-4 mb-4">
          <span className="text-xl font-bold" style={{ color: waveColor }}>{score}</span>
          <span className="text-white/60">💎 {treasuresFound}</span>
        </div>

        {/* Dungeon Map */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-center text-white/60 mb-6">Dungeon Map</h3>

          <div className="flex flex-col gap-3">
            {rooms.map((room, index) => {
              const info = ROOM_INFO[room.type];
              const isCurrent = index === currentRoom;
              const isNext = index === currentRoom + 1;
              const canEnter = isNext && !room.explored;

              return (
                <button
                  key={room.id}
                  onClick={() => canEnter && enterRoom(room.id)}
                  disabled={!canEnter}
                  className={`relative p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-white/20 border-white/40 scale-105'
                      : room.explored
                      ? 'bg-white/5 border-white/10 opacity-60'
                      : canEnter
                      ? 'bg-white/10 border-white/20 hover:scale-105 hover:border-white/40 cursor-pointer'
                      : 'bg-white/5 border-white/5 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: room.explored || canEnter ? info.color + '40' : 'rgba(255,255,255,0.1)' }}
                    >
                      {room.explored ? info.icon : canEnter ? '🔒' : '❓'}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold" style={{ color: room.explored ? info.color : 'rgba(255,255,255,0.4)' }}>
                        {room.explored ? info.name : canEnter ? 'Locked Room' : 'Unknown'}
                      </p>
                      <p className="text-sm text-white/40">
                        Room {index + 1} of {rooms.length}
                      </p>
                    </div>
                    {isCurrent && <span className="text-2xl">👤</span>}
                    {canEnter && <span className="text-white/60">→</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <p className="text-center text-white/40 text-sm mt-6">
          Tap the next room to explore
        </p>
      </div>
    </main>
  );
}
