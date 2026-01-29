'use client';

import Link from 'next/link';
import { useState } from 'react';
import { WAVES, PILLAR_INFO, PillarType } from './data/content';
import { useRPGProgress } from './hooks/useRPGProgress';

export default function DefenseRPGPage() {
  const {
    isLoaded,
    characterStats,
    totalScore,
    factsLearned,
    isWaveUnlocked,
    getWaveProgress,
    createCharacter,
  } = useRPGProgress();

  const [showClassSelect, setShowClassSelect] = useState(false);

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Character creation screen
  if (!characterStats || showClassSelect) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950" />

        {/* Animated stars background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            Choose Your Path
          </h1>
          <p className="text-white/60 text-lg mb-12">
            Select a Defence Pillar to become your class. Each grants unique powers.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {(Object.entries(PILLAR_INFO) as [PillarType, typeof PILLAR_INFO[PillarType]][]).map(
              ([pillar, info]) => (
                <button
                  key={pillar}
                  onClick={() => {
                    createCharacter(pillar);
                    setShowClassSelect(false);
                  }}
                  className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:scale-105 transition-all hover:border-white/30"
                  style={{ '--pillar-color': info.color } as React.CSSProperties}
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"
                    style={{ backgroundColor: info.color }}
                  />
                  <span className="text-5xl mb-3 block">{info.icon}</span>
                  <h3 className="font-bold text-lg" style={{ color: info.color }}>
                    {info.class}
                  </h3>
                  <p className="text-sm text-white/50 mt-1">{info.name}</p>
                </button>
              )
            )}
          </div>

          <Link href="/" className="text-white/40 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const pillarInfo = PILLAR_INFO[characterStats.class];
  const expToNextLevel = characterStats.level * 100;
  const expProgress = (characterStats.exp / expToNextLevel) * 100;

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950" />

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: pillarInfo.color,
              opacity: 0.2,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 pb-24">
        {/* Header */}
        <div className="text-center py-8 phase-enter">
          <Link href="/" className="inline-block mb-4 text-white/40 hover:text-white transition-colors text-sm">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            Defence Quest
          </h1>
          <p className="text-white/50 mt-2">RPG Adventure</p>
        </div>

        {/* Character Card */}
        <div
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10 phase-enter"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: pillarInfo.color + '40' }}
            >
              {pillarInfo.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg" style={{ color: pillarInfo.color }}>
                  {pillarInfo.class}
                </span>
                <span className="text-white/40">Lv.{characterStats.level}</span>
              </div>
              <div className="text-sm text-white/50">{pillarInfo.name}</div>
            </div>
            <button
              onClick={() => setShowClassSelect(true)}
              className="text-white/40 hover:text-white text-sm"
            >
              Change Class
            </button>
          </div>

          {/* EXP Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>EXP</span>
              <span>{characterStats.exp} / {expToNextLevel}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${expProgress}%`, backgroundColor: pillarInfo.color }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-2xl font-bold text-red-400">❤️ {characterStats.maxHP}</p>
              <p className="text-xs text-white/50">Max HP</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-2xl font-bold text-amber-400">⚔️ {characterStats.attack}</p>
              <p className="text-xs text-white/50">Attack</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-2xl font-bold text-cyan-400">🛡️ {characterStats.defense}</p>
              <p className="text-xs text-white/50">Defense</p>
            </div>
          </div>
        </div>

        {/* Score & Facts */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div
            className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 phase-enter"
            style={{ animationDelay: '0.15s' }}
          >
            <p className="text-3xl font-black text-amber-400">{totalScore.toLocaleString()}</p>
            <p className="text-sm text-white/50">Total Score</p>
          </div>
          <div
            className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 phase-enter"
            style={{ animationDelay: '0.2s' }}
          >
            <p className="text-3xl font-black text-purple-400">{factsLearned.length}</p>
            <p className="text-sm text-white/50">Facts Learned</p>
          </div>
        </div>

        {/* Waves */}
        <h2 className="text-xl font-bold mb-4 text-white/80">Story Chapters</h2>
        <div className="space-y-4">
          {WAVES.map((wave, index) => {
            const unlocked = isWaveUnlocked(wave.id);
            const progress = getWaveProgress(wave.id);
            const progressPercent = (progress.completed / progress.total) * 100;

            return (
              <Link
                key={wave.id}
                href={unlocked ? `/defense-rpg/wave/${wave.id}` : '#'}
                className={`block bg-white/5 backdrop-blur-xl rounded-2xl p-5 border transition-all phase-enter ${
                  unlocked
                    ? 'border-white/10 hover:border-white/30 hover:scale-[1.02]'
                    : 'border-white/5 opacity-50 cursor-not-allowed'
                }`}
                style={{ animationDelay: `${0.25 + index * 0.05}s` }}
                onClick={(e) => !unlocked && e.preventDefault()}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black"
                    style={{ backgroundColor: unlocked ? wave.color + '40' : 'rgba(255,255,255,0.1)' }}
                  >
                    {unlocked ? wave.id : '🔒'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg" style={{ color: unlocked ? wave.color : 'rgba(255,255,255,0.4)' }}>
                      Chapter {wave.id}: {wave.title}
                    </h3>
                    <p className="text-sm text-white/50">{wave.description}</p>
                    {unlocked && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progressPercent}%`, backgroundColor: wave.color }}
                          />
                        </div>
                        <p className="text-xs text-white/40 mt-1">
                          {progress.completed}/{progress.total} quests complete
                        </p>
                      </div>
                    )}
                  </div>
                  {unlocked && (
                    <span className="text-white/30 text-2xl">→</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
