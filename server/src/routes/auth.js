import { Router } from 'express';
import { nanoid } from 'nanoid';
import { OAuth2Client } from 'google-auth-library';
import db from '../db/schema.js';
import { signToken, authMiddleware } from '../auth.js';

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Google OAuth — verify ID token from frontend, create/login user
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'credential required' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

    if (!user) {
      // Check if a user with this email exists (link accounts)
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (user) {
        db.prepare('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?')
          .run(googleId, picture, user.id);
        user.google_id = googleId;
        user.avatar_url = picture;
      } else {
        const id = nanoid();
        const invite_code = nanoid(8);
        const api_key = `stk_${nanoid(32)}`;
        db.prepare(
          'INSERT INTO users (id, name, email, avatar_url, google_id, api_key, invite_code) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(id, name, email, picture, googleId, api_key, invite_code);
        user = { id, name, email, avatar_url: picture, google_id: googleId, api_key, invite_code };
      }
    }

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google token', details: err.message });
  }
});

// Demo login — for development without Google OAuth setup
router.post('/demo', (req, res) => {
  const { name } = req.body;
  const userName = name || 'Demo User';

  let user = db.prepare('SELECT * FROM users WHERE name = ? AND google_id IS NULL').get(userName);
  if (!user) {
    const id = nanoid();
    const invite_code = nanoid(8);
    const api_key = `stk_${nanoid(32)}`;
    db.prepare(
      'INSERT INTO users (id, name, api_key, invite_code) VALUES (?, ?, ?, ?)'
    ).run(id, userName, api_key, invite_code);
    user = { id, name: userName, api_key, invite_code };
  }

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, avatar_url: user.avatar_url } });
});

// Get current user profile
router.get('/me', authMiddleware, (req, res) => {
  const { id, name, email, avatar_url, api_key, invite_code } = req.user;
  res.json({ id, name, email, avatar_url, api_key, invite_code });
});

// Generate a new API key (for iOS Shortcuts)
router.post('/api-key', authMiddleware, (req, res) => {
  const newKey = `stk_${nanoid(32)}`;
  db.prepare('UPDATE users SET api_key = ? WHERE id = ?').run(newKey, req.user.id);
  res.json({ api_key: newKey });
});

export default router;
