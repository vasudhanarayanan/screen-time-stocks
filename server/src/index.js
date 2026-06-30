import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import usersRouter from './routes/users.js';
import appsRouter from './routes/apps.js';
import snapshotsRouter from './routes/snapshots.js';
import marketsRouter from './routes/markets.js';
import authRouter from './routes/auth.js';
import shortcutsRouter from './routes/shortcuts.js';
import { authMiddleware } from './auth.js';
import { setupWebSocket } from './websocket.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRouter);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes
app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/apps', authMiddleware, appsRouter);
app.use('/api/snapshots', authMiddleware, snapshotsRouter);
app.use('/api/markets', authMiddleware, marketsRouter);
app.use('/api/shortcuts', shortcutsRouter);

// WebSocket
const io = setupWebSocket(server);
app.set('io', io);

// Serve static client in production
const clientDist = join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(join(clientDist, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
