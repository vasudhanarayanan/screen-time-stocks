import jwt from 'jsonwebtoken';
import db from './db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  // Check if it's an API key (for iOS Shortcuts)
  const userByApiKey = db.prepare('SELECT * FROM users WHERE api_key = ?').get(token);
  if (userByApiKey) {
    req.user = userByApiKey;
    return next();
  }

  // Otherwise treat as JWT
  try {
    const payload = verifyToken(token);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header) return next();

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  try {
    const payload = verifyToken(token);
    req.user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);
  } catch { /* not authenticated, continue anyway */ }
  next();
}
