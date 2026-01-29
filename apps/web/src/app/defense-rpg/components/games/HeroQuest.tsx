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

interface HeroQuestProps {
  game: GameConfig;
  waveColor: string;
  characterStats: CharacterStats;
  onComplete: (score: number, factsLearned: string[], expEarned: number) => void;
  onBack: () => void;
}

interface Enemy {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  icon: string;
}

const ENEMY_TYPES = [
  { name: 'Shadow Scout', icon: '👤', hpMod: 0.8, atkMod: 0.7 },
  { name: 'Chaos Knight', icon: '🗡️', hpMod: 1.2, atkMod: 1.0 },
  { name: 'Dark Mage', icon: '🧙', hpMod: 0.7, atkMod: 1.3 },
  { name: 'Void Beast', icon: '👹', hpMod: 1.5, atkMod: 0.9 },
  { name: 'Fear Wraith', icon: '👻', hpMod: 0.9, atkMod: 1.1 },
];

export function HeroQuest({ game, waveColor, characterStats, onComplete, onBack }: HeroQuestProps) {
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'battle' | 'quiz' | 'victory' | 'defeat'>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [playerHP, setPlayerHP] = useState(characterStats.maxHP);
  const [score, setScore] = useState(0);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [factsLearned, setFactsLearned] = useState<string[]>([]);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [showDamage, setShowDamage] = useState<{ target: 'player' | 'enemy'; amount: number } | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [questionsUsed, setQuestionsUsed] = useState(0);

  const totalEnemies = (game.config.enemies as number) || 5;
  const baseEnemyHP = (game.config.enemyHP as number) || 30;

  const spawnEnemy = useCallback(() => {
    const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const hp = Math.floor(baseEnemyHP * type.hpMod * (1 + enemiesDefeated * 0.1));
    setEnemy({
      id: enemiesDefeated + 1,
      name: type.name,
      icon: type.icon,
      hp,
      maxHp: hp,
      attack: Math.floor(10 * type.atkMod * (1 + enemiesDefeated * 0.05)),
    });
    setBattleLog([`A ${type.name} appears!`]);
    setIsPlayerTurn(true);
  }, [enemiesDefeated, baseEnemyHP]);

  const getQuestion = useCallback((): QuizQuestion | null => {
    if (questionsUsed >= game.questions.length) return null;
    const q = game.questions[questionsUsed];
    setQuestionsUsed((prev) => prev + 1);
    return q;
  }, [game.questions, questionsUsed]);

  const handleAttack = () => {
    if (!isPlayerTurn || phase !== 'battle') return;
    const question = getQuestion();
    if (question) {
      setCurrentQuestion(question);
      setPhase('quiz');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (!currentQuestion || !enemy) return;

    const isCorrect = optionIndex === currentQuestion.correctIndex;

    if (isCorrect) {
      // Player attacks!
      const damage = characterStats.attack + Math.floor(Math.random() * 5);
      const newEnemyHP = Math.max(0, enemy.hp - damage);

      setEnemy({ ...enemy, hp: newEnemyHP });
      setShowDamage({ target: 'enemy', amount: damage });
      setBattleLog((prev) => [...prev, `You deal ${damage} damage!`]);
      setScore((prev) => prev + 50);
      setFactsLearned((prev) => [...new Set([...prev, currentQuestion.fact])]);

      setTimeout(() => {
        setShowDamage(null);
        if (newEnemyHP <= 0) {
          // Enemy defeated
          const bonus = 100 + enemiesDefeated * 20;
          setScore((prev) => prev + bonus);
          setEnemiesDefeated((prev) => prev + 1);
          setBattleLog((prev) => [...prev, `${enemy.name} defeated! +${bonus} bonus`]);

          setTimeout(() => {
            if (enemiesDefeated + 1 >= totalEnemies) {
              setPhase('victory');
            } else {
              spawnEnemy();
            }
          }, 1000);
        } else {
          // Enemy turn
          setIsPlayerTurn(false);
          enemyAttack();
        }
      }, 800);
    } else {
      // Miss! Enemy attacks
      setBattleLog((prev) => [...prev, 'Your attack missed!']);
      setIsPlayerTurn(false);
      setTimeout(() => enemyAttack(), 500);
    }

    setCurrentQuestion(null);
    setPhase('battle');
  };

  const enemyAttack = () => {
    if (!enemy) return;

    setTimeout(() => {
      const damage = Math.max(1, enemy.attack - characterStats.defense + Math.floor(Math.random() * 5));
      const newPlayerHP = Math.max(0, playerHP - damage);

      setPlayerHP(newPlayerHP);
      setShowDamage({ target: 'player', amount: damage });
      setBattleLog((prev) => [...prev, `${enemy.name} deals ${damage} damage!`]);

      setTimeout(() => {
        setShowDamage(null);
        if (newPlayerHP <= 0) {
          setPhase('defeat');
        } else {
          setIsPlayerTurn(true);
        }
      }, 800);
    }, 500);
  };

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownNum <= 0) {
      setPhase('battle');
      spawnEnemy();
      return;
    }
    const timer = setTimeout(() => setCountdownNum((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdownNum, spawnEnemy]);

  const startGame = () => {
    setPhase('countdown');
    setCountdownNum(3);
    setPlayerHP(characterStats.maxHP);
    setScore(0);
    setEnemy(null);
    setEnemiesDefeated(0);
    setFactsLearned([]);
    setBattleLog([]);
    setQuestionsUsed(0);
  };

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950 to-slate-950" />

        <div className="relative z-10 max-w-md">
          <div className="text-8xl mb-6">{game.icon}</div>
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            {game.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{game.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-sm text-white/50 mb-4">Battle Rules:</p>
            <div className="space-y-3 text-left">
              <p className="flex items-center gap-3">
                <span className="text-2xl">⚔️</span>
                <span>Answer correctly to attack enemies</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">❌</span>
                <span>Wrong answers let enemies strike back</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <span>Defeat {totalEnemies} enemies to win</span>
              </p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="px-16 py-5 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl font-bold text-xl hover:scale-105 transition-transform"
          >
            BEGIN QUEST
          </button>

          <button onClick={onBack} className="block mx-auto mt-6 text-white/40 hover:text-white transition-colors">
            ← Back to chapter
          </button>
        </div>
      </main>
    );
  }

  if (phase === 'countdown') {
    return (
      <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950 to-slate-950" />
        <div
          key={countdownNum}
          className="relative z-10 text-[200px] font-black bg-gradient-to-b from-red-400 to-orange-400 bg-clip-text text-transparent animate-countdown"
        >
          {countdownNum || 'FIGHT!'}
        </div>
      </main>
    );
  }

  if (phase === 'victory' || phase === 'defeat') {
    const expEarned = phase === 'victory' ? 50 + enemiesDefeated * 15 : Math.floor(enemiesDefeated * 10);

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950 to-slate-950" />

        <div className="relative z-10 max-w-md phase-enter">
          <div className="text-8xl mb-4">{phase === 'victory' ? '🏆' : '💀'}</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            {phase === 'victory' ? 'Victory!' : 'Defeated...'}
          </h1>

          <div className="text-6xl font-black my-6" style={{ color: waveColor }}>
            {score.toLocaleString()}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-red-400">{enemiesDefeated}/{totalEnemies}</p>
              <p className="text-xs text-white/50">Enemies</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-amber-400">+{expEarned}</p>
              <p className="text-xs text-white/50">EXP Earned</p>
            </div>
          </div>

          {factsLearned.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6 text-left">
              <p className="text-sm text-white/50 mb-2">Knowledge gained:</p>
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
            <button onClick={() => onComplete(score, factsLearned, expEarned)} className="flex-1 py-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-bold transition-all hover:scale-105">
              Complete
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'quiz' && currentQuestion) {
    const pillarInfo = PILLAR_INFO[currentQuestion.pillar];

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950 to-slate-950" />

        <div className="relative z-10 max-w-lg w-full">
          <div className="text-center mb-6">
            <span className="text-4xl">⚔️</span>
            <p className="text-white/60 mt-2">Answer to attack!</p>
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
                className="p-4 bg-white/10 hover:bg-red-500/30 rounded-xl font-medium text-left transition-all border border-white/10 hover:border-red-500/50"
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

  // Battle phase
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950 to-slate-950" />

      <div className="relative z-10 max-w-lg mx-auto p-4 h-screen flex flex-col">
        {/* HUD */}
        <div className="flex justify-between items-center py-4">
          <span className="text-xl font-bold" style={{ color: waveColor }}>{score}</span>
          <span className="text-white/60">Battle {enemiesDefeated + 1}/{totalEnemies}</span>
        </div>

        {/* Enemy */}
        {enemy && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="text-8xl animate-bounce" style={{ animationDuration: '2s' }}>
                {enemy.icon}
              </div>
              {showDamage?.target === 'enemy' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl font-black text-red-500 animate-float-up">
                  -{showDamage.amount}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold mt-4">{enemy.name}</h3>
            <div className="w-48 mt-2">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                />
              </div>
              <p className="text-center text-sm text-white/50 mt-1">{enemy.hp} / {enemy.maxHp}</p>
            </div>
          </div>
        )}

        {/* Battle Log */}
        <div className="bg-white/5 rounded-xl p-3 mb-4 h-24 overflow-y-auto border border-white/10">
          {battleLog.slice(-3).map((log, i) => (
            <p key={i} className="text-sm text-white/70">{log}</p>
          ))}
        </div>

        {/* Player */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="text-4xl">🦸</span>
              {showDamage?.target === 'player' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl font-black text-red-500 animate-float-up">
                  -{showDamage.amount}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>HP</span>
                <span>{playerHP} / {characterStats.maxHP}</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${(playerHP / characterStats.maxHP) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleAttack}
          disabled={!isPlayerTurn}
          className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${
            isPlayerTurn
              ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:scale-105'
              : 'bg-white/10 opacity-50 cursor-not-allowed'
          }`}
        >
          {isPlayerTurn ? '⚔️ ATTACK' : 'Enemy Turn...'}
        </button>
      </div>

      <style jsx>{`
        @keyframes float-up {
          0% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -30px); }
        }
        .animate-float-up {
          animation: float-up 0.8s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
