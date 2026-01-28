import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { GameManager } from './services/GameManager';
import { registerHostHandlers } from './handlers/hostHandlers';
import { registerPlayerHandlers } from './handlers/playerHandlers';

const app = express();
const httpServer = createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

// Redis adapter for horizontal scaling (optional)
const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
  const pubClient = new Redis(redisUrl);
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.ping(), subClient.ping()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Connected to Redis');
    })
    .catch((err) => {
      console.warn('Redis connection failed, running without adapter:', err.message);
    });
}

// Initialize game manager
const gameManager = new GameManager();

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Register event handlers
  registerHostHandlers(io, socket, gameManager);
  registerPlayerHandlers(io, socket, gameManager);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    gameManager.handleDisconnect(socket.id, io);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
