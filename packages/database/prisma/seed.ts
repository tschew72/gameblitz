import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo user
  const hashedPassword = await hash('demo123', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@gameblitz.com' },
    update: {},
    create: {
      email: 'demo@gameblitz.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  console.log('✓ Created demo user:', demoUser.email);

  // Create sample quiz
  const sampleQuiz = await prisma.quiz.upsert({
    where: { id: 'sample-quiz-1' },
    update: {},
    create: {
      id: 'sample-quiz-1',
      title: 'Singapore General Knowledge',
      description: 'Test your knowledge about Singapore!',
      userId: demoUser.id,
      isPublic: true,
      questions: {
        create: [
          {
            text: 'What year did Singapore gain independence?',
            type: 'MULTIPLE_CHOICE',
            timeLimit: 20,
            points: 1000,
            order: 0,
            options: JSON.stringify({
              answers: ['1963', '1965', '1959', '1971'],
              correctIndex: 1,
            }),
          },
          {
            text: 'What is the national flower of Singapore?',
            type: 'MULTIPLE_CHOICE',
            timeLimit: 20,
            points: 1000,
            order: 1,
            options: JSON.stringify({
              answers: ['Rose', 'Orchid', 'Sunflower', 'Lily'],
              correctIndex: 1,
            }),
          },
          {
            text: 'Singapore is located on the equator.',
            type: 'TRUE_FALSE',
            timeLimit: 15,
            points: 800,
            order: 2,
            options: JSON.stringify({
              answers: ['True', 'False'],
              correctIndex: 1,
            }),
          },
          {
            text: 'How many official languages does Singapore have?',
            type: 'MULTIPLE_CHOICE',
            timeLimit: 20,
            points: 1000,
            order: 3,
            options: JSON.stringify({
              answers: ['2', '3', '4', '5'],
              correctIndex: 2,
            }),
          },
          {
            text: 'What is the name of Singapore\'s iconic hotel with a rooftop infinity pool?',
            type: 'MULTIPLE_CHOICE',
            timeLimit: 20,
            points: 1000,
            order: 4,
            options: JSON.stringify({
              answers: ['The Ritz Carlton', 'Marina Bay Sands', 'Raffles Hotel', 'Fullerton Hotel'],
              correctIndex: 1,
            }),
          },
        ],
      },
    },
  });

  console.log('✓ Created sample quiz:', sampleQuiz.title);

  // Create Total Defence quiz
  const tdQuiz = await prisma.quiz.upsert({
    where: { id: 'total-defence-quiz' },
    update: {},
    create: {
      id: 'total-defence-quiz',
      title: 'Total Defence Knowledge',
      description: 'Learn about Singapore\'s Total Defence pillars',
      userId: demoUser.id,
      isPublic: true,
      questions: {
        create: [
          {
            text: 'How many pillars make up Total Defence?',
            type: 'MULTIPLE_CHOICE',
            timeLimit: 20,
            points: 1000,
            order: 0,
            options: JSON.stringify({
              answers: ['4', '5', '6', '7'],
              correctIndex: 2,
            }),
          },
          {
            text: 'When is Total Defence Day observed in Singapore?',
            type: 'MULTIPLE_CHOICE',
            timeLimit: 20,
            points: 1000,
            order: 1,
            options: JSON.stringify({
              answers: ['9 August', '15 February', '1 July', '21 October'],
              correctIndex: 1,
            }),
          },
          {
            text: 'Which pillar involves the Singapore Armed Forces?',
            type: 'MULTIPLE_CHOICE',
            timeLimit: 20,
            points: 1000,
            order: 2,
            options: JSON.stringify({
              answers: ['Civil Defence', 'Military Defence', 'Social Defence', 'Economic Defence'],
              correctIndex: 1,
            }),
          },
          {
            text: 'Digital Defence was added as the newest pillar.',
            type: 'TRUE_FALSE',
            timeLimit: 15,
            points: 800,
            order: 3,
            options: JSON.stringify({
              answers: ['True', 'False'],
              correctIndex: 0,
            }),
          },
        ],
      },
    },
  });

  console.log('✓ Created Total Defence quiz:', tdQuiz.title);

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Email: demo@gameblitz.com');
  console.log('  Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
