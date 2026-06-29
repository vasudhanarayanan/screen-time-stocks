import { Server } from 'socket.io';
import db from './db/schema.js';
import { verifyToken } from './auth.js';

export function setupWebSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));

    try {
      const payload = verifyToken(token);
      const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(payload.userId);
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Auto-join user's market rooms
    const markets = db.prepare(
      'SELECT market_id FROM market_members WHERE user_id = ?'
    ).all(socket.user.id);

    for (const { market_id } of markets) {
      socket.join(`market:${market_id}`);
    }

    socket.on('join-market', (marketId) => {
      const isMember = db.prepare(
        'SELECT 1 FROM market_members WHERE market_id = ? AND user_id = ?'
      ).get(marketId, socket.user.id);
      if (isMember) {
        socket.join(`market:${marketId}`);
      }
    });

    socket.on('leave-market', (marketId) => {
      socket.leave(`market:${marketId}`);
    });
  });

  return io;
}
