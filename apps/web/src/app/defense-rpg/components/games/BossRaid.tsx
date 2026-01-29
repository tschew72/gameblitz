'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameConfig, QuizQuestion, PILLAR_INFO } from '../../data/content';

interface CharacterStats {
  class: string;
  level: number;
  maxHP: number;
  attack: number;
  defense: number;
}

interface BossRaidProps {
  game: GameConfig;
  waveColor: string;
  characterStats: CharacterStats;
  onComplete: (score: number, factsLearned: string[], expEarned: number) => void;
  onBack: () => void;
}

interface BossState {
  hp: number;
  maxHP: number;
  phase: number;
  isAttacking: boolean;
  attackTimer: number;
}

export function BossRaid({ game, waveColor, characterStats, onComplete, onBack }: BossRaidProps) {
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'battle' | 'quiz' | 'phase-transition' | 'victory' | 'defeat'>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [score, setScore] = useState(0);
  const [playerHP, setPlayerHP] = useState(characterStats.maxHP);
  const [boss, setBoss] = useState<BossState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [factsLearned, setFactsLearned] = useState<string[]>([]);
  const [ultimateCharge, setUltimateCharge] = useState(0);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [showEffect, setShowEffect] = useState<{ type: string; value: string } | null>(null);
  const [bossAttackWarning, setBossAttackWarning] = useState(false);

  const bossHP = (game.config.bossHP as number) || 200;
  const totalPhases = (game.config.phases as number) || 3;
  const chargePerCorrect = (game.config.chargePerCorrect as number) || 20;
  const attackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const BOSS_PHASES = [
    { name: 'Awakened', icon: '😤', color: '#22c55e', attackSpeed: 8000 },
    { name: 'Enraged', icon: '😡', color: '#eab308', attackSpeed: 6000 },
    { name: 'Berserk', icon: '🔥', color: '#ef4444', attackSpeed: 4000 },
    { name: 'Desperate', icon: '💀', color: '#a855f7', attackSpeed: 3000 },
    { name: 'Final Form', icon: '👹', color: '#dc2626', attackSpeed: 2500 },
    { name: 'Ultimate', icon: '😈', color: '#7c3aed', attackSpeed: 2000 },
  ];

  const getCurrentPhaseInfo = useCallback(() => {
    if (!boss) return BOSS_PHASES[0];
    return BOSS_PHASES[Math.min(boss.phase - 1, BOSS_PHASES.length - 1)];
  }, [boss]);

  const getQuestion = useCallback((): QuizQuestion | null => {
    if (questionsUsed >= game.questions.length) {
      return game.questions[Math.floor(Math.random() * game.questions.length)];
    }
    const q = game.questions[questionsUsed];
    setQuestionsUsed((prev) => prev + 1);
    return q;
  }, [game.questions, questionsUsed]);

  const bossAttack = useCallback(() => {
    if (phase !== 'battle') return;

    setBossAttackWarning(true);
    setTimeout(() => {
      setBossAttackWarning(false);
      const damage = Math.max(5, 10 + (boss?.phase || 1) * 3 - characterStats.defense);
      setPlayerHP((prev) => {
        const newHP = Math.max(0, prev - damage);
        if (newHP <= 0) {
          setPhase('defeat');
        }
        return newHP;
      });
      setShowEffect({ type: 'boss-attack', value: `-${damage}` });
      setTimeout(() => setShowEffect(null), 800);
    }, 1000);
  }, [phase, boss?.phase, characterStats.defense]);

  // Boss attack timer
  useEffect(() => {
    if (phase !== 'battle' || !boss) return;

    const phaseInfo = getCurrentPhaseInfo();
    attackIntervalRef.current = setInterval(() => {
      bossAttack();
    }, phaseInfo.attackSpeed);

    return () => {
      if (attackIntervalRef.current) clearInterval(attackIntervalRef.current);
    };
  }, [phase, boss, getCurrentPhaseInfo, bossAttack]);

  const handleAttack = () => {
    if (phase !== 'battle') return;
    const question = getQuestion();
    if (question) {
      setCurrentQuestion(question);
      setPhase('quiz');
    }
  };

  const handleUltimate = () => {
    if (phase !== 'battle' || ultimateCharge < 100 || !boss) return;

    const damage = characterStats.attack * 5;
    const newBossHP = Math.max(0, boss.hp - damage);

    setShowEffect({ type: 'ultimate', value: `ULTIMATE! -${damage}` });
    setTimeout(() => setShowEffect(null), 1500);

    setUltimateCharge(0);
    setScore((prev) => prev + 200);

    if (newBossHP <= 0) {
      setBoss({ ...boss, hp: 0 });
      setPhase('victory');
    } else {
      // Check for phase transition
      const hpPercent = newBossHP / boss.maxHP;
      const newPhase = Math.min(totalPhases, Math.ceil((1 - hpPercent) * totalPhases) + 1);

      if (newPhase > boss.phase) {
        setBoss({ ...boss, hp: newBossHP, phase: newPhase });
        setPhase('phase-transition');
      } else {
        setBoss({ ...boss, hp: newBossHP });
      }
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (!currentQuestion || !boss) return;

    const isCorrect = optionIndex === currentQuestion.correctIndex;

    if (isCorrect) {
      const damage = characterStats.attack + Math.floor(Math.random() * 10);
      const newBossHP = Math.max(0, boss.hp - damage);

      setScore((prev) => prev + 30);
      setFactsLearned((prev) => [...new Set([...prev, currentQuestion.fact])]);
      setUltimateCharge((prev) => Math.min(100, prev + chargePerCorrect));

      setShowEffect({ type: 'player-attack', value: `-${damage}` });
      setTimeout(() => setShowEffect(null), 800);

      if (newBossHP <= 0) {
        setBoss({ ...boss, hp: 0 });
        setPhase('victory');
      } else {
        // Check for phase transition
        const hpPercent = newBossHP / boss.maxHP;
        const newPhase = Math.min(totalPhases, Math.ceil((1 - hpPercent) * totalPhases) + 1);

        if (newPhase > boss.phase) {
          setBoss({ ...boss, hp: newBossHP, phase: newPhase });
          setPhase('phase-transition');
        } else {
          setBoss({ ...boss, hp: newBossHP });
          setPhase('battle');
        }
      }
    } else {
      setPhase('battle');
    }

    setCurrentQuestion(null);
  };

  const continueFromTransition = () => {
    setPhase('battle');
  };

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownNum <= 0) {
      setBoss({
        hp: bossHP,
        maxHP: bossHP,
        phase: 1,
        isAttacking: false,
        attackTimer: 0,
      });
      setPhase('battle');
      return;
    }
    const timer = setTimeout(() => setCountdownNum((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdownNum, bossHP]);

  const startGame = () => {
    setPhase('countdown');
    setCountdownNum(3);
    setScore(0);
    setPlayerHP(characterStats.maxHP);
    setBoss(null);
    setFactsLearned([]);
    setUltimateCharge(0);
    setQuestionsUsed(0);
  };

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950 to-slate-950" />

        {/* Dramatic background effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[100px] animate-pulse" />
        </div>

        <div className="relative z-10 max-w-md">
          <div className="text-8xl mb-6">{game.icon}</div>
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
            {game.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{game.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-red-500/20">
            <p className="text-sm text-red-400/80 mb-4 font-bold">⚠️ BOSS BATTLE</p>
            <div className="space-y-3 text-left">
              <p className="flex items-center gap-3">
                <span className="text-2xl">⚔️</span>
                <span>Answer quickly - boss attacks on a timer!</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <span>Correct answers charge your ultimate</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-2xl">💥</span>
                <span>Boss has {totalPhases} phases - each faster than the last</span>
              </p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="px-16 py-5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-2xl font-bold text-xl hover:scale-105 transition-transform animate-pulse"
          >
            CHALLENGE BOSS
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
          className="relative z-10 text-[200px] font-black bg-gradient-to-b from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent animate-countdown"
        >
          {countdownNum || 'FIGHT!'}
        </div>
      </main>
    );
  }

  if (phase === 'phase-transition' && boss) {
    const phaseInfo = getCurrentPhaseInfo();

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950 to-slate-950" />

        <div className="relative z-10 text-center phase-enter">
          <div className="text-8xl mb-4 animate-bounce">{phaseInfo.icon}</div>
          <h2 className="text-3xl font-black" style={{ color: phaseInfo.color }}>
            PHASE {boss.phase}
          </h2>
          <p className="text-xl text-white/60 mt-2">{phaseInfo.name}</p>
          <p className="text-sm text-red-400 mt-4">Boss attacks faster!</p>

          <button
            onClick={continueFromTransition}
            className="mt-8 px-12 py-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            Continue Fighting
          </button>
        </div>
      </main>
    );
  }

  if (phase === 'victory' || phase === 'defeat') {
    const won = phase === 'victory';
    const expEarned = won ? 80 + (boss?.phase || 1) * 20 : Math.floor((boss?.phase || 1) * 15);

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950 to-slate-950" />

        <div className="relative z-10 max-w-md phase-enter">
          <div className="text-8xl mb-4">{won ? '👑' : '💀'}</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
            {won ? 'BOSS DEFEATED!' : 'Defeated...'}
          </h1>

          <div className="text-6xl font-black my-6" style={{ color: waveColor }}>
            {score.toLocaleString()}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-red-400">
                {boss ? Math.round((1 - boss.hp / boss.maxHP) * 100) : 0}%
              </p>
              <p className="text-xs text-white/50">Boss Damage</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-amber-400">+{expEarned}</p>
              <p className="text-xs text-white/50">EXP Earned</p>
            </div>
          </div>

          {factsLearned.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6 text-left">
              <p className="text-sm text-white/50 mb-2">Power gained:</p>
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
            <button onClick={() => onComplete(score, factsLearned, expEarned)} className="flex-1 py-4 bg-gradient-to-r from-red-500 to-amber-500 rounded-xl font-bold transition-all hover:scale-105">
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
            <span className="text-4xl">⚡</span>
            <p className="text-white/60 mt-2">Quick! Answer to strike!</p>
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
  if (!boss) return null;

  const phaseInfo = getCurrentPhaseInfo();
  const hpPercent = (boss.hp / boss.maxHP) * 100;

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950 to-slate-950" />

      {/* Boss attack warning */}
      {bossAttackWarning && (
        <div className="absolute inset-0 bg-red-500/20 animate-pulse z-20 pointer-events-none" />
      )}

      {/* Effect overlay */}
      {showEffect && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div
            className={`text-4xl font-black animate-bounce ${
              showEffect.type === 'ultimate' ? 'text-amber-400' : showEffect.type === 'boss-attack' ? 'text-red-500' : 'text-green-400'
            }`}
          >
            {showEffect.value}
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-lg mx-auto p-4 h-screen flex flex-col">
        {/* HUD */}
        <div className="flex justify-between items-center py-4">
          <span className="text-xl font-bold" style={{ color: waveColor }}>{score}</span>
          <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: phaseInfo.color + '40', color: phaseInfo.color }}>
            Phase {boss.phase}/{totalPhases}
          </span>
        </div>

        {/* Boss */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <div
              className={`text-[100px] transition-transform ${bossAttackWarning ? 'animate-shake scale-110' : ''}`}
            >
              {phaseInfo.icon}
            </div>
            <h3 className="text-2xl font-black mt-4" style={{ color: phaseInfo.color }}>
              {phaseInfo.name}
            </h3>
          </div>

          {/* Boss HP */}
          <div className="w-full max-w-xs mt-6">
            <div className="h-6 bg-white/10 rounded-full overflow-hidden border-2 border-white/20">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${hpPercent}%`,
                  background: `linear-gradient(90deg, ${phaseInfo.color}, #ef4444)`,
                }}
              />
            </div>
            <p className="text-center text-white/60 mt-2">
              {boss.hp.toLocaleString()} / {boss.maxHP.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Player stats */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 mb-4">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-3xl">🦸</span>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>HP</span>
                <span>{playerHP}/{characterStats.maxHP}</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(playerHP / characterStats.maxHP) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ultimate charge */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>⚡ Ultimate</span>
              <span>{ultimateCharge}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${ultimateCharge >= 100 ? 'bg-amber-400 animate-pulse' : 'bg-amber-600'}`}
                style={{ width: `${ultimateCharge}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleAttack}
            className="py-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-bold text-lg hover:scale-105 transition-all"
          >
            ⚔️ Attack
          </button>
          <button
            onClick={handleUltimate}
            disabled={ultimateCharge < 100}
            className={`py-4 rounded-xl font-bold text-lg transition-all ${
              ultimateCharge >= 100
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:scale-105 animate-pulse text-black'
                : 'bg-white/10 opacity-50 cursor-not-allowed'
            }`}
          >
            💥 Ultimate
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
