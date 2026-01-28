import { NextResponse } from 'next/server';
import { prisma } from '@gameblitz/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis (via socket server if available)
  try {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      health.services.redis = 'configured';
    } else {
      health.services.redis = 'not configured';
    }
  } catch {
    health.services.redis = 'unhealthy';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
