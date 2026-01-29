'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameConfig, QuizQuestion, PILLAR_INFO, PillarType } from '../../data/content';
import { ExitGameModal } from '@/components/game/ExitGameModal';

interface CharacterStats {
  class: PillarType;
  level: number;
  maxHP: number;
  attack: number;
  defense: number;
}

interface PillarWarriorsProps {
  game: GameConfig;
  waveColor: string;
  characterStats: CharacterStats;
  onComplete: (score: number, factsLearned: string[], expEarned: number) => void;
  onBack: () => void;
}

interface BattleState {
  round: number;
  playerHP: number;
  enemyHP: number;
  enemyMaxHP: number;
  enemyPillar: PillarType;
  comboCount: number;
}

export function PillarWarriors({ game, waveColor, characterStats, onComplete, onBack }: PillarWarriorsProps) {
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'battle' | 'quiz' | 'round-win' | 'finished'>('ready');
  const [countdownNum, setCountdownNum] = useState(3);
  const [score, setScore] = useState(0);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [factsLearned, setFactsLearned] = useState<string[]>([]);
  const [roundsWon, setRoundsWon] = useState(0);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [specialCharge, setSpecialCharge] = useState(0);
  const [showEffect, setShowEffect] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const totalRounds = (game.config.battles as number) || 4;
  const expPerWin = (game.config.expPerWin as number) || 25;

  const PILLARS: PillarType[] = ['military', 'civil', 'economic', 'social', 'digital', 'psychological'];

  const getRandomEnemyPillar = useCallback((): PillarType => {
    const available = PILLARS.filter((p) => p !== characterStats.class);
    return available[Math.floor(Math.random() * available.length)];
  }, [characterStats.class]);

  const startRound = useCallback(() => {
    const enemyPillar = getRandomEnemyPillar();
    const baseHP = 50 + roundsWon * 20;

    setBattle({
      round: roundsWon + 1,
      playerHP: characterStats.maxHP,
      enemyHP: baseHP,
      enemyMaxHP: baseHP,
      enemyPillar,
      comboCount: 0,
    });
    setPhase('battle');
  }, [roundsWon, characterStats.maxHP, getRandomEnemyPillar]);

  const getQuestion = useCallback((): QuizQuestion | null => {
    if (questionsUsed >= game.questions.length) {
      return game.questions[Math.floor(Math.random() * game.questions.length)];
    }
    const q = game.questions[questionsUsed];
    setQuestionsUsed((prev) => prev + 1);
    return q;
  }, [game.questions, questionsUsed]);

  const handleAttack = () => {
    if (phase !== 'battle' || !battle) return;
    const question = getQuestion();
    if (question) {
      setCurrentQuestion(question);
      setPhase('quiz');
    }
  };

  const handleSpecialAttack = () => {
    if (phase !== 'battle' || !battle || specialCharge < 100) return;

    // Special attack deals massive damage
    const damage = characterStats.attack * 3;
    const newEnemyHP = Math.max(0, battle.enemyHP - damage);

    setShowEffect('SPECIAL ATTACK!');
    setTimeout(() => setShowEffect(null), 1000);

    setSpecialCharge(0);
    setBattle({ ...battle, enemyHP: newEnemyHP });
    setScore((prev) => prev + 100);

    if (newEnemyHP <= 0) {
      handleRoundWin();
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (!currentQuestion || !battle) return;

    const isCorrect = optionIndex === currentQuestion.correctIndex;

    if (isCorrect) {
      // Calculate damage with combo bonus
      const comboDamage = Math.floor(characterStats.attack * (1 + battle.comboCount * 0.2));
      const newEnemyHP = Math.max(0, battle.enemyHP - comboDamage);
      const newCombo = battle.comboCount + 1;

      setScore((prev) => prev + 20 + newCombo * 10);
      setFactsLearned((prev) => [...new Set([...prev, currentQuestion.fact])]);
      setSpecialCharge((prev) => Math.min(100, prev + 20));

      setShowEffect(`-${comboDamage} ${newCombo > 1 ? `(${newCombo}x COMBO!)` : ''}`);
      setTimeout(() => setShowEffect(null), 800);

      setBattle({ ...battle, enemyHP: newEnemyHP, comboCount: newCombo });

      if (newEnemyHP <= 0) {
        handleRoundWin();
      } else {
        setPhase('battle');
      }
    } else {
      // Enemy counter-attack
      const damage = Math.max(5, 15 - characterStats.defense);
      const newPlayerHP = Math.max(0, battle.playerHP - damage);

      setShowEffect(`Enemy: -${damage}`);
      setTimeout(() => setShowEffect(null), 800);

      setBattle({ ...battle, playerHP: newPlayerHP, comboCount: 0 });

      if (newPlayerHP <= 0) {
        setPhase('finished');
      } else {
        setPhase('battle');
      }
    }

    setCurrentQuestion(null);
  };

  const handleRoundWin = () => {
    setRoundsWon((prev) => prev + 1);
    setScore((prev) => prev + 150);
    setPhase('round-win');
  };

  const continueToNextRound = () => {
    if (roundsWon >= totalRounds) {
      setPhase('finished');
    } else {
      startRound();
    }
  };

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownNum <= 0) {
      startRound();
      return;
    }
    const timer = setTimeout(() => setCountdownNum((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdownNum, startRound]);

  const startGame = () => {
    setPhase('countdown');
    setCountdownNum(3);
    setScore(0);
    setBattle(null);
    setFactsLearned([]);
    setRoundsWon(0);
    setQuestionsUsed(0);
    setSpecialCharge(0);
  };

  const pillarInfo = PILLAR_INFO[characterStats.class];

  if (phase === 'ready') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950" />

        <div className="relative z-10 max-w-md">
          <div className="text-8xl mb-6">{game.icon}</div>
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {game.title}
          </h1>
          <p className="text-white/60 mb-8 text-lg">{game.description}</p>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-4xl">{pillarInfo.icon}</span>
              <div>
                <p className="font-bold" style={{ color: pillarInfo.color }}>{pillarInfo.class}</p>
                <p className="text-sm text-white/50">Your class</p>
              </div>
            </div>
            <div className="space-y-2 text-left text-sm">
              <p className="flex items-center gap-2">
                <span>⚔️</span> Answer correctly to attack
              </p>
              <p className="flex items-center gap-2">
                <span>🔥</span> Build combos for bonus damage
              </p>
              <p className="flex items-center gap-2">
                <span>💥</span> Charge special attack for massive damage
              </p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="px-16 py-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-xl hover:scale-105 transition-transform"
          >
            BEGIN TRAINING
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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950" />
        <div
          key={countdownNum}
          className="relative z-10 text-[200px] font-black bg-gradient-to-b from-purple-400 to-pink-400 bg-clip-text text-transparent animate-countdown"
        >
          {countdownNum || 'FIGHT!'}
        </div>
      </main>
    );
  }

  if (phase === 'round-win') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950" />

        <div className="relative z-10 text-center phase-enter">
          <div className="text-8xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-3xl font-black text-purple-400">Round {roundsWon} Complete!</h2>
          <p className="text-white/60 mt-2">{roundsWon}/{totalRounds} victories</p>

          <button
            onClick={continueToNextRound}
            className="mt-8 px-12 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            {roundsWon >= totalRounds ? 'Victory!' : 'Next Round'}
          </button>
        </div>
      </main>
    );
  }

  if (phase === 'finished') {
    const won = roundsWon >= totalRounds || (battle && battle.playerHP > 0);
    const expEarned = roundsWon * expPerWin;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950" />

        <div className="relative z-10 max-w-md phase-enter">
          <div className="text-8xl mb-4">{won ? '👑' : '💪'}</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {won ? 'Training Complete!' : 'Good Effort!'}
          </h1>

          <div className="text-6xl font-black my-6" style={{ color: waveColor }}>
            {score.toLocaleString()}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-purple-400">{roundsWon}/{totalRounds}</p>
              <p className="text-xs text-white/50">Rounds Won</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-amber-400">+{expEarned}</p>
              <p className="text-xs text-white/50">EXP Earned</p>
            </div>
          </div>

          {factsLearned.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6 text-left">
              <p className="text-sm text-white/50 mb-2">Skills learned:</p>
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
            <button onClick={() => onComplete(score, factsLearned, expEarned)} className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold transition-all hover:scale-105">
              Complete
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'quiz' && currentQuestion) {
    const qPillarInfo = PILLAR_INFO[currentQuestion.pillar];

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950" />

        <div className="relative z-10 max-w-lg w-full">
          <div className="text-center mb-6">
            <span className="text-4xl">{pillarInfo.icon}</span>
            <p className="text-white/60 mt-2">Strike with knowledge!</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{qPillarInfo.icon}</span>
              <span className="text-sm text-white/50">{qPillarInfo.name}</span>
            </div>
            <h2 className="text-xl font-bold">{currentQuestion.question}</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className="p-4 bg-white/10 hover:bg-purple-500/30 rounded-xl font-medium text-left transition-all border border-white/10 hover:border-purple-500/50"
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
  if (!battle) return null;

  const enemyPillarInfo = PILLAR_INFO[battle.enemyPillar];

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950" />

      {/* Exit Modal */}
      <ExitGameModal
        isOpen={showExitModal}
        onConfirm={onBack}
        onCancel={() => setShowExitModal(false)}
        gameName={game.title}
      />

      <div className="relative z-10 max-w-lg mx-auto p-4 h-screen flex flex-col">
        {/* HUD */}
        <div className="flex justify-between items-center py-3">
          <button
            onClick={() => setShowExitModal(true)}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
            aria-label="Exit game"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-xl font-bold" style={{ color: waveColor }}>{score}</span>
          <div className="text-right">
            <span className="text-white/60 text-sm">Round {battle.round}/{totalRounds}</span>
            {battle.comboCount > 1 && (
              <span className="block text-amber-400 font-bold text-sm animate-pulse">{battle.comboCount}x COMBO</span>
            )}
          </div>
        </div>

        {/* Effect overlay */}
        {showEffect && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50">
            <div className="text-3xl font-black text-amber-400 animate-bounce">{showEffect}</div>
          </div>
        )}

        {/* Enemy */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-4">
            <span className="text-xs text-white/40">ENEMY</span>
          </div>
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mb-4"
            style={{ backgroundColor: enemyPillarInfo.color + '40' }}
          >
            {enemyPillarInfo.icon}
          </div>
          <h3 className="font-bold" style={{ color: enemyPillarInfo.color }}>
            {enemyPillarInfo.class}
          </h3>
          <div className="w-48 mt-3">
            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(battle.enemyHP / battle.enemyMaxHP) * 100}%`,
                  backgroundColor: enemyPillarInfo.color,
                }}
              />
            </div>
            <p className="text-center text-sm text-white/50 mt-1">
              {battle.enemyHP} / {battle.enemyMaxHP}
            </p>
          </div>
        </div>

        {/* VS */}
        <div className="text-center py-4">
          <span className="text-4xl font-black text-white/20">VS</span>
        </div>

        {/* Player */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: pillarInfo.color + '40' }}
            >
              {pillarInfo.icon}
            </div>
            <div className="flex-1">
              <p className="font-bold" style={{ color: pillarInfo.color }}>{pillarInfo.class}</p>
              <div className="mt-2">
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${(battle.playerHP / characterStats.maxHP) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-white/50 mt-1">HP: {battle.playerHP}/{characterStats.maxHP}</p>
              </div>
            </div>
          </div>

          {/* Special charge */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>Special</span>
              <span>{specialCharge}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${specialCharge}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleAttack}
            className="py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-lg hover:scale-105 transition-all"
          >
            ⚔️ Attack
          </button>
          <button
            onClick={handleSpecialAttack}
            disabled={specialCharge < 100}
            className={`py-4 rounded-xl font-bold text-lg transition-all ${
              specialCharge >= 100
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-105 animate-pulse'
                : 'bg-white/10 opacity-50 cursor-not-allowed'
            }`}
          >
            💥 Special
          </button>
        </div>
      </div>
    </main>
  );
}
