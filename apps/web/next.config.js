/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@gameblitz/database', '@gameblitz/types', '@gameblitz/game-logic'],
};

module.exports = nextConfig;
