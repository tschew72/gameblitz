// Total Defence Pillar Icons and Colors
export const PILLAR_COLORS = {
  military: { bg: '#1E3A5F', icon: '🛡️', name: 'Military Defence' },
  civil: { bg: '#C41E3A', icon: '🚒', name: 'Civil Defence' },
  economic: { bg: '#2E7D32', icon: '💰', name: 'Economic Defence' },
  social: { bg: '#7B1FA2', icon: '🤝', name: 'Social Defence' },
  digital: { bg: '#0288D1', icon: '💻', name: 'Digital Defence' },
  psychological: { bg: '#F57C00', icon: '🧠', name: 'Psychological Defence' },
} as const;

export type PillarType = keyof typeof PILLAR_COLORS;

export interface GameConfig {
  id: string;
  type: 'rapid-response' | 'defense-defender' | 'resource-rush' | 'shield-builder';
  title: string;
  description: string;
  timeLimit: number;
  targetScore: number;
  config: Record<string, unknown>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  pillar: PillarType;
}

export interface Wave {
  id: number;
  title: string;
  description: string;
  color: string;
  pillars: PillarType[];
  games: GameConfig[];
  quizzes: QuizQuestion[];
}

export const WAVES: Wave[] = [
  {
    id: 1,
    title: 'Total Defence Basics',
    description: 'Learn the 6 pillars that keep Singapore strong',
    color: '#EF3340',
    pillars: ['military', 'civil', 'economic', 'social', 'digital', 'psychological'],
    games: [
      {
        id: 'game-1',
        type: 'rapid-response',
        title: 'Pillar Spotter',
        description: 'Click defence pillar icons as fast as you can!',
        timeLimit: 30,
        targetScore: 500,
        config: { targetCount: 15, icons: ['military', 'civil', 'economic', 'social', 'digital', 'psychological'] },
      },
      {
        id: 'game-2',
        type: 'defense-defender',
        title: 'Defence Shield',
        description: 'Tap pillars to defend, avoid the threats!',
        timeLimit: 30,
        targetScore: 400,
        config: { spawnRate: 1200, goodIcons: ['military', 'civil', 'economic'], badIcons: ['threat'] },
      },
      {
        id: 'game-3',
        type: 'resource-rush',
        title: 'Resource Rally',
        description: 'Collect defence resources before they disappear!',
        timeLimit: 45,
        targetScore: 600,
        config: { spawnRate: 800, resources: ['shield', 'heart', 'star', 'coin'] },
      },
      {
        id: 'game-4',
        type: 'shield-builder',
        title: 'Fortress Singapore',
        description: 'Place defences to protect Singapore!',
        timeLimit: 60,
        targetScore: 300,
        config: { lanes: 3, waves: 5, towerTypes: ['military', 'civil', 'economic'] },
      },
    ],
    quizzes: [
      {
        id: 'quiz-1',
        question: 'How many pillars make up Total Defence?',
        options: ['4 pillars', '5 pillars', '6 pillars', '7 pillars'],
        correctIndex: 2,
        explanation: 'Total Defence has 6 pillars: Military, Civil, Economic, Social, Digital, and Psychological Defence.',
        pillar: 'military',
      },
      {
        id: 'quiz-2',
        question: 'When is Total Defence Day observed in Singapore?',
        options: ['9 August', '15 February', '1 July', '21 October'],
        correctIndex: 1,
        explanation: '15 February marks the fall of Singapore in 1942, reminding us why Total Defence is important.',
        pillar: 'civil',
      },
      {
        id: 'quiz-3',
        question: 'Which pillar focuses on maintaining a strong SAF?',
        options: ['Civil Defence', 'Military Defence', 'Social Defence', 'Economic Defence'],
        correctIndex: 1,
        explanation: 'Military Defence involves a strong Singapore Armed Forces to deter aggression and defend our nation.',
        pillar: 'military',
      },
      {
        id: 'quiz-4',
        question: 'What does the "We Are Total Defence" campaign encourage?',
        options: ['Only NS men to defend', 'Everyone to play a part', 'Buying more weapons', 'Building more shelters'],
        correctIndex: 1,
        explanation: 'Total Defence is about EVERYONE playing their part to keep Singapore strong and united.',
        pillar: 'social',
      },
    ],
  },
  {
    id: 2,
    title: 'Protection Force',
    description: 'Military and Civil Defence in action',
    color: '#1E3A5F',
    pillars: ['military', 'civil'],
    games: [
      {
        id: 'game-1',
        type: 'rapid-response',
        title: 'SAF Quick Deploy',
        description: 'Deploy SAF units with lightning speed!',
        timeLimit: 30,
        targetScore: 550,
        config: { targetCount: 18, icons: ['military', 'civil'], speedMultiplier: 1.2 },
      },
      {
        id: 'game-2',
        type: 'defense-defender',
        title: 'Emergency Response',
        description: 'Respond to emergencies, avoid false alarms!',
        timeLimit: 35,
        targetScore: 450,
        config: { spawnRate: 1000, goodIcons: ['civil', 'military'], badIcons: ['threat', 'fake'] },
      },
      {
        id: 'game-3',
        type: 'resource-rush',
        title: 'Supply Chain',
        description: 'Gather military and civil defence supplies!',
        timeLimit: 45,
        targetScore: 650,
        config: { spawnRate: 700, resources: ['medkit', 'ammo', 'food', 'water'] },
      },
      {
        id: 'game-4',
        type: 'shield-builder',
        title: 'Base Defence',
        description: 'Defend the military base from threats!',
        timeLimit: 60,
        targetScore: 350,
        config: { lanes: 3, waves: 6, towerTypes: ['soldier', 'tank', 'medic'] },
      },
    ],
    quizzes: [
      {
        id: 'quiz-1',
        question: 'What does NS stand for in Singapore?',
        options: ['National Service', 'National Security', 'Nation Strength', 'National Safety'],
        correctIndex: 0,
        explanation: 'National Service (NS) is the cornerstone of Military Defence, with all male citizens serving.',
        pillar: 'military',
      },
      {
        id: 'quiz-2',
        question: 'Which organization runs the Civil Defence shelter program?',
        options: ['SAF', 'SCDF', 'SPF', 'MHA'],
        correctIndex: 1,
        explanation: 'The Singapore Civil Defence Force (SCDF) manages shelters and emergency preparedness.',
        pillar: 'civil',
      },
      {
        id: 'quiz-3',
        question: 'What is the emergency number for SCDF?',
        options: ['999', '995', '911', '990'],
        correctIndex: 1,
        explanation: 'Call 995 for fire and ambulance emergencies handled by SCDF.',
        pillar: 'civil',
      },
      {
        id: 'quiz-4',
        question: 'The three services of SAF are Army, Navy, and?',
        options: ['Marines', 'Air Force', 'Coast Guard', 'Special Forces'],
        correctIndex: 1,
        explanation: 'The SAF consists of the Army, Navy, and Air Force (RSAF).',
        pillar: 'military',
      },
    ],
  },
  {
    id: 3,
    title: 'Building Resilience',
    description: 'Economic and Social strength for all',
    color: '#2E7D32',
    pillars: ['economic', 'social'],
    games: [
      {
        id: 'game-1',
        type: 'rapid-response',
        title: 'Market Watch',
        description: 'React to economic opportunities quickly!',
        timeLimit: 30,
        targetScore: 500,
        config: { targetCount: 16, icons: ['economic', 'social'], speedMultiplier: 1.1 },
      },
      {
        id: 'game-2',
        type: 'defense-defender',
        title: 'Unity Builder',
        description: 'Build social bonds, reject division!',
        timeLimit: 35,
        targetScore: 480,
        config: { spawnRate: 1100, goodIcons: ['social', 'economic'], badIcons: ['division', 'conflict'] },
      },
      {
        id: 'game-3',
        type: 'resource-rush',
        title: 'Community Support',
        description: 'Gather resources to help your community!',
        timeLimit: 45,
        targetScore: 620,
        config: { spawnRate: 750, resources: ['food', 'mask', 'sanitizer', 'voucher'] },
      },
      {
        id: 'game-4',
        type: 'shield-builder',
        title: 'Economy Guard',
        description: 'Protect Singapore economic stability!',
        timeLimit: 60,
        targetScore: 320,
        config: { lanes: 3, waves: 5, towerTypes: ['bank', 'factory', 'port'] },
      },
    ],
    quizzes: [
      {
        id: 'quiz-1',
        question: 'What is Economic Defence about?',
        options: ['Making everyone rich', 'A strong economy for tough times', 'Only saving money', 'Trading with everyone'],
        correctIndex: 1,
        explanation: 'Economic Defence means having a strong economy that can withstand crises and bounce back.',
        pillar: 'economic',
      },
      {
        id: 'quiz-2',
        question: 'Social Defence focuses on?',
        options: ['Military training', 'Racial and religious harmony', 'Building roads', 'Cyber security'],
        correctIndex: 1,
        explanation: 'Social Defence is about unity, trust and harmony among different races and religions.',
        pillar: 'social',
      },
      {
        id: 'quiz-3',
        question: 'Which event shows Singaporeans\' social cohesion during crisis?',
        options: ['F1 race', 'National Day', 'COVID-19 response', 'GST increase'],
        correctIndex: 2,
        explanation: 'During COVID-19, Singaporeans showed social cohesion by supporting each other and frontliners.',
        pillar: 'social',
      },
      {
        id: 'quiz-4',
        question: 'Why does Singapore maintain national reserves?',
        options: ['For government salary', 'Economic resilience', 'To buy weapons only', 'For decoration'],
        correctIndex: 1,
        explanation: 'National reserves help Singapore weather economic storms and fund recovery efforts.',
        pillar: 'economic',
      },
    ],
  },
  {
    id: 4,
    title: 'Modern Frontlines',
    description: 'Digital and Psychological warfare defence',
    color: '#0288D1',
    pillars: ['digital', 'psychological'],
    games: [
      {
        id: 'game-1',
        type: 'rapid-response',
        title: 'Cyber Alert',
        description: 'Identify and click cyber threats fast!',
        timeLimit: 30,
        targetScore: 580,
        config: { targetCount: 20, icons: ['digital', 'psychological'], speedMultiplier: 1.3 },
      },
      {
        id: 'game-2',
        type: 'defense-defender',
        title: 'Fake News Fighter',
        description: 'Tap real news, reject fake news!',
        timeLimit: 35,
        targetScore: 500,
        config: { spawnRate: 900, goodIcons: ['truth', 'verified'], badIcons: ['fakenews', 'scam'] },
      },
      {
        id: 'game-3',
        type: 'resource-rush',
        title: 'Data Defence',
        description: 'Secure digital assets before hackers get them!',
        timeLimit: 45,
        targetScore: 680,
        config: { spawnRate: 650, resources: ['password', 'firewall', 'backup', 'update'] },
      },
      {
        id: 'game-4',
        type: 'shield-builder',
        title: 'Mind Shield',
        description: 'Build mental resilience against influence ops!',
        timeLimit: 60,
        targetScore: 380,
        config: { lanes: 3, waves: 7, towerTypes: ['factcheck', 'critical', 'verify'] },
      },
    ],
    quizzes: [
      {
        id: 'quiz-1',
        question: 'What is Digital Defence about?',
        options: ['Playing games online', 'Cybersecurity and being safe online', 'Buying computers', 'Social media only'],
        correctIndex: 1,
        explanation: 'Digital Defence is about being secure and responsible online, protecting against cyber threats.',
        pillar: 'digital',
      },
      {
        id: 'quiz-2',
        question: 'Psychological Defence helps us to?',
        options: ['Be mentally strong against influence', 'Ignore all news', 'Trust everything online', 'Only follow leaders'],
        correctIndex: 0,
        explanation: 'Psychological Defence builds mental resilience to resist misinformation and hostile influence.',
        pillar: 'psychological',
      },
      {
        id: 'quiz-3',
        question: 'How can you practice Digital Defence?',
        options: ['Share passwords', 'Click all links', 'Use strong unique passwords', 'Ignore updates'],
        correctIndex: 2,
        explanation: 'Using strong unique passwords is a key practice in Digital Defence.',
        pillar: 'digital',
      },
      {
        id: 'quiz-4',
        question: 'How to identify fake news?',
        options: ['Believe headlines only', 'Check source and facts', 'Share immediately', 'Follow the crowd'],
        correctIndex: 1,
        explanation: 'Always verify news by checking the source and cross-referencing with credible outlets.',
        pillar: 'psychological',
      },
    ],
  },
];

// Helper to get activity by ID
export function getActivity(waveId: number, activityId: string) {
  const wave = WAVES.find((w) => w.id === waveId);
  if (!wave) return null;

  if (activityId.startsWith('game-')) {
    return { type: 'game' as const, data: wave.games.find((g) => g.id === activityId) };
  } else if (activityId.startsWith('quiz-')) {
    return { type: 'quiz' as const, data: wave.quizzes.find((q) => q.id === activityId) };
  }
  return null;
}

// Get all activities for a wave in order (games then quizzes)
export function getWaveActivities(waveId: number) {
  const wave = WAVES.find((w) => w.id === waveId);
  if (!wave) return [];

  return [
    ...wave.games.map((g) => ({ ...g, activityType: 'game' as const })),
    ...wave.quizzes.map((q) => ({ ...q, activityType: 'quiz' as const })),
  ];
}
