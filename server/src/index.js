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

/**
 * Build the Express app and wire up all routes.
 *
 * @param {object} [options]
 * @param {boolean} [options.serveClient=true] Serve the built React client.
 *        Disabled in tests, where the client bundle doesn't exist.
 * @returns {import('express').Express}
 */
export function createApp({ serveClient = true } = {}) {
  const app = express();

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

  // Serve static client in production
  if (serveClient) {
    const clientDist = join(__dirname, '..', '..', 'client', 'dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(join(clientDist, 'index.html'));
    });
  }

  return app;
}

/**
 * Create the app plus an HTTP server with WebSocket support attached.
 * Returns both so callers (and tests) can start/stop the server and access io.
 */
export function createServerWithApp(options) {
  const app = createApp(options);
  const server = createServer(app);
  const io = setupWebSocket(server);
  app.set('io', io);
  return { app, server, io };
}

// Only start listening when run directly (not when imported by tests).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = process.env.PORT || 3001;
  const { server } = createServerWithApp();
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
