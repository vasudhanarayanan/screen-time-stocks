import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { io as ioClient } from 'socket.io-client';
import db from '../src/db/schema.js';
import { createServerWithApp } from '../src/index.js';
import { resetDb, createUser, createAppStock } from './helpers.js';

// Add a user to a market so the socket auto-joins its room.
function joinMarket(marketId, userId, createdBy = userId) {
  db.prepare('INSERT OR IGNORE INTO markets (id, name, invite_code, created_by) VALUES (?, ?, ?, ?)')
    .run(marketId, 'Test Market', `code-${marketId}`, createdBy);
  db.prepare('INSERT OR IGNORE INTO market_members (market_id, user_id) VALUES (?, ?)')
    .run(marketId, userId);
}

describe('WebSocket live updates', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    resetDb();
    const built = createServerWithApp({ serveClient: false });
    server = built.server;
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://localhost:${server.address().port}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('rejects a socket connection without a token', async () => {
    const socket = ioClient(baseUrl, { auth: {}, reconnection: false });
    const err = await new Promise((resolve) => {
      socket.on('connect_error', resolve);
      socket.on('connect', () => resolve(null));
    });
    socket.close();
    expect(err).toBeTruthy(); // connection was refused
  });

  it('pushes a price-update to a market member when they log time', async () => {
    const { user, token, apiKey } = createUser();
    const marketId = 'mkt-1';
    joinMarket(marketId, user.id);
    const stock = createAppStock(user.id, { daily_goal_minutes: 30, current_price: 100 });

    // Connect an authenticated socket; it auto-joins the user's market room.
    const socket = ioClient(baseUrl, { auth: { token }, reconnection: false });
    await new Promise((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
    });

    // Set up the listener, then trigger a log over HTTP.
    const updatePromise = new Promise((resolve) => socket.on('price-update', resolve));
    const res = await request(baseUrl)
      .post('/api/snapshots')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ app_id: stock.id, date: '2026-01-01', actual_minutes: 15 });
    expect(res.status).toBe(201);

    const update = await updatePromise;
    socket.close();

    expect(update.app_id).toBe(stock.id);
    expect(update.ticker).toBe(stock.ticker);
    expect(update.price).toBeGreaterThan(100);
  });
});
