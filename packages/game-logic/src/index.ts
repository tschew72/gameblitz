import type { Player, LeaderboardEntry, Answer } from '@gameblitz/types';

/**
 * Calculate score based on correctness and response time.
 * Faster correct answers earn more points (minimum 50% of max points).
 */
export function calculateScore(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitMs: number,
  maxPoints: number
): number {
  if (!isCorrect) return 0;

  // Clamp response time to valid range
  const clampedTime = Math.max(0, Math.min(responseTimeMs, timeLimitMs));

  // Calculate time ratio (0 = used all time, 1 = instant answer)
  const timeRatio = 1 - clampedTime / timeLimitMs;

  // Score ranges from 50% to 100% of max points based on speed
  const timeBonusRatio = 0.5 + timeRatio * 0.5;

  return Math.round(maxPoints * timeBonusRatio);
}

/**
 * Generate a unique 6-digit game PIN.
 */
export function generateGamePin(): string {
  // Generate random 6-digit number (100000-999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create leaderboard from players sorted by score.
 */
export function createLeaderboard(
  players: Player[],
  currentRoundAnswers?: Map<string, { pointsEarned: number }>
): LeaderboardEntry[] {
  return players
    .map((player) => ({
      playerId: player.id,
      nickname: player.nickname,
      score: player.score,
      rank: 0,
      pointsThisRound: currentRoundAnswers?.get(player.id)?.pointsEarned,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

/**
 * Calculate answer distribution for a question.
 */
export function calculateAnswerStats(
  answers: Answer[],
  optionCount: number,
  correctIndex: number
): {
  answerCounts: number[];
  correctCount: number;
  totalAnswers: number;
} {
  const answerCounts = new Array(optionCount).fill(0);

  for (const answer of answers) {
    if (answer.optionIndex >= 0 && answer.optionIndex < optionCount) {
      answerCounts[answer.optionIndex]++;
    }
  }

  return {
    answerCounts,
    correctCount: answerCounts[correctIndex] || 0,
    totalAnswers: answers.length,
  };
}

/**
 * Get podium (top 3) from leaderboard.
 */
export function getPodium(leaderboard: LeaderboardEntry[]): LeaderboardEntry[] {
  return leaderboard.slice(0, 3);
}

/**
 * Validate game PIN format.
 */
export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Validate nickname.
 */
export function isValidNickname(nickname: string): boolean {
  const trimmed = nickname.trim();
  return trimmed.length >= 1 && trimmed.length <= 20;
}

/**
 * Generate a random avatar identifier for a player.
 */
export function generateAvatar(): string {
  const avatars = [
    'bear',
    'cat',
    'dog',
    'fox',
    'lion',
    'owl',
    'panda',
    'rabbit',
    'tiger',
    'wolf',
  ];
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

  const avatar = avatars[Math.floor(Math.random() * avatars.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return `${color}-${avatar}`;
}
