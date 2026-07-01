import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { signToken, verifyToken, authMiddleware } from '../src/auth.js';
import { resetDb, createUser } from './helpers.js';

// A tiny app that just echoes the authenticated user, to exercise the
// middleware in isolation.
function guardedApp() {
  const app = express();
  app.get('/whoami', authMiddleware, (req, res) => res.json({ id: req.user.id }));
  return app;
}

describe('JWT helpers', () => {
  it('signs a token that verifies back to the same user id', () => {
    const token = signToken('user-123');
    expect(verifyToken(token).userId).toBe('user-123');
  });

  it('rejects a tampered token', () => {
    const token = signToken('user-123');
    expect(() => verifyToken(token + 'x')).toThrow();
  });
});

describe('authMiddleware', () => {
  beforeEach(() => resetDb());

  it('rejects requests with no Authorization header', async () => {
    const res = await request(guardedApp()).get('/whoami');
    expect(res.status).toBe(401);
  });

  it('rejects a syntactically invalid token', async () => {
    const res = await request(guardedApp())
      .get('/whoami')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('accepts a valid JWT and attaches the user', async () => {
    const { user, token } = createUser();
    const res = await request(guardedApp())
      .get('/whoami')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
  });

  it('accepts a raw API key as an alternative credential', async () => {
    const { user, apiKey } = createUser();
    const res = await request(guardedApp())
      .get('/whoami')
      .set('Authorization', `Bearer ${apiKey}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
  });

  it('rejects a valid JWT whose user no longer exists', async () => {
    const token = signToken('deleted-user');
    const res = await request(guardedApp())
      .get('/whoami')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
