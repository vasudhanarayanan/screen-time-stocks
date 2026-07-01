import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { testApp, resetDb, createUser, createAppStock } from './helpers.js';

const app = testApp();

beforeEach(() => resetDb());

describe('POST /api/auth/demo', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app).post('/api/auth/demo').send({ name: 'Ada' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.name).toBe('Ada');
  });

  it('reuses the same demo user on repeat login', async () => {
    const first = await request(app).post('/api/auth/demo').send({ name: 'Ada' });
    const second = await request(app).post('/api/auth/demo').send({ name: 'Ada' });
    expect(second.body.user.id).toBe(first.body.user.id);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the profile for the authenticated user', async () => {
    const { user, token } = createUser({ name: 'Grace' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Grace');
    expect(res.body.api_key).toBe(user.api_key);
  });

  it('401s without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/apps', () => {
  it('creates an app-stock, upcasing the ticker', async () => {
    const { user, token } = createUser();
    const res = await request(app)
      .post('/api/apps')
      .set('Authorization', `Bearer ${token}`)
      .send({ user_id: user.id, ticker: 'tik', display_name: 'TikTok', daily_goal_minutes: 20 });
    expect(res.status).toBe(201);
    expect(res.body.ticker).toBe('TIK');
    expect(res.body.current_price).toBe(100);
  });

  it('rejects incomplete payloads', async () => {
    const { user, token } = createUser();
    const res = await request(app)
      .post('/api/apps')
      .set('Authorization', `Bearer ${token}`)
      .send({ user_id: user.id, ticker: 'TIK' });
    expect(res.status).toBe(400);
  });

  it('409s on a duplicate ticker for the same user', async () => {
    const { user, token } = createUser();
    const payload = { user_id: user.id, ticker: 'IG', display_name: 'Instagram', daily_goal_minutes: 30 };
    await request(app).post('/api/apps').set('Authorization', `Bearer ${token}`).send(payload);
    const dup = await request(app).post('/api/apps').set('Authorization', `Bearer ${token}`).send(payload);
    expect(dup.status).toBe(409);
  });
});

describe('POST /api/snapshots', () => {
  it('logs usage, moving the price up when under goal', async () => {
    const { user, token } = createUser();
    const stock = createAppStock(user.id, { daily_goal_minutes: 30, current_price: 100 });

    const res = await request(app)
      .post('/api/snapshots')
      .set('Authorization', `Bearer ${token}`)
      .send({ app_id: stock.id, date: '2026-01-01', actual_minutes: 15 });

    expect(res.status).toBe(201);
    expect(res.body.price).toBeGreaterThan(100);
    expect(res.body.pct_change).toBeGreaterThan(0);
  });

  it('persists the new price on the app row', async () => {
    const { user, token } = createUser();
    const stock = createAppStock(user.id, { daily_goal_minutes: 30, current_price: 100 });

    await request(app)
      .post('/api/snapshots')
      .set('Authorization', `Bearer ${token}`)
      .send({ app_id: stock.id, date: '2026-01-01', actual_minutes: 15 });

    const history = await request(app)
      .get(`/api/apps/${stock.id}/history`)
      .set('Authorization', `Bearer ${token}`);
    expect(history.body.current_price).toBeGreaterThan(100);
    expect(history.body.snapshots).toHaveLength(1);
  });

  it('409s when logging the same app/date twice', async () => {
    const { user, token } = createUser();
    const stock = createAppStock(user.id);
    const body = { app_id: stock.id, date: '2026-01-01', actual_minutes: 15 };

    await request(app).post('/api/snapshots').set('Authorization', `Bearer ${token}`).send(body);
    const dup = await request(app).post('/api/snapshots').set('Authorization', `Bearer ${token}`).send(body);
    expect(dup.status).toBe(409);
  });

  it('404s for an unknown app', async () => {
    const { token } = createUser();
    const res = await request(app)
      .post('/api/snapshots')
      .set('Authorization', `Bearer ${token}`)
      .send({ app_id: 'nope', date: '2026-01-01', actual_minutes: 15 });
    expect(res.status).toBe(404);
  });
});

describe('markets', () => {
  it('creates a market, joins via invite code, and ranks members', async () => {
    const owner = createUser({ name: 'Owner' });
    const joiner = createUser({ name: 'Joiner' });

    // Owner has a pricier portfolio than joiner.
    createAppStock(owner.user.id, { ticker: 'IG', current_price: 150 });
    createAppStock(joiner.user.id, { ticker: 'YT', current_price: 90 });

    const created = await request(app)
      .post('/api/markets')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Friends', user_id: owner.user.id });
    expect(created.status).toBe(201);
    const invite = created.body.invite_code;

    const joined = await request(app)
      .post('/api/markets/join')
      .set('Authorization', `Bearer ${joiner.token}`)
      .send({ invite_code: invite, user_id: joiner.user.id });
    expect(joined.status).toBe(200);

    const board = await request(app)
      .get(`/api/markets/${created.body.id}`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(board.body.leaderboard).toHaveLength(2);
    // Ranked by portfolio value descending → owner first.
    expect(board.body.leaderboard[0].name).toBe('Owner');
  });

  it('409s when joining a market twice', async () => {
    const { user, token } = createUser();
    const created = await request(app)
      .post('/api/markets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Solo', user_id: user.id });

    // Creator is already a member.
    const rejoin = await request(app)
      .post('/api/markets/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ invite_code: created.body.invite_code, user_id: user.id });
    expect(rejoin.status).toBe(409);
  });

  it('404s joining with a bad invite code', async () => {
    const { user, token } = createUser();
    const res = await request(app)
      .post('/api/markets/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ invite_code: 'garbage', user_id: user.id });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/shortcuts/log', () => {
  it('auto-creates unseen apps and logs them (authed by API key)', async () => {
    const { user, apiKey } = createUser();

    const res = await request(app)
      .post('/api/shortcuts/log')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ date: '2026-01-01', entries: [{ app: 'Reddit', minutes: 10 }] });

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].app).toBe('Reddit');

    // The app should now exist for the user.
    const apps = await request(app)
      .get(`/api/apps/user/${user.id}`)
      .set('Authorization', `Bearer ${apiKey}`);
    expect(apps.body.map((a) => a.display_name)).toContain('Reddit');
  });

  it('marks a repeat same-day log as skipped', async () => {
    const { apiKey } = createUser();
    const body = { date: '2026-01-01', entries: [{ app: 'Reddit', minutes: 10 }] };

    await request(app).post('/api/shortcuts/log').set('Authorization', `Bearer ${apiKey}`).send(body);
    const second = await request(app)
      .post('/api/shortcuts/log')
      .set('Authorization', `Bearer ${apiKey}`)
      .send(body);

    expect(second.status).toBe(200);
    expect(second.body.results[0].skipped).toBe(true);
  });

  it('400s when entries are missing', async () => {
    const { apiKey } = createUser();
    const res = await request(app)
      .post('/api/shortcuts/log')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ date: '2026-01-01' });
    expect(res.status).toBe(400);
  });
});
