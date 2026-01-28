FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/game-logic/package.json ./packages/game-logic/
COPY apps/socket-server/package.json ./apps/socket-server/

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/game-logic/node_modules ./packages/game-logic/node_modules
COPY --from=deps /app/apps/socket-server/node_modules ./apps/socket-server/node_modules

# Copy source
COPY . .

# Generate Prisma client
RUN pnpm --filter @gameblitz/database db:generate

# Build the app
RUN pnpm --filter @gameblitz/socket-server build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 socketio

# Copy built files
COPY --from=builder /app/apps/socket-server/dist ./dist
COPY --from=builder /app/apps/socket-server/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

USER socketio

EXPOSE 3001

CMD ["node", "dist/index.js"]
