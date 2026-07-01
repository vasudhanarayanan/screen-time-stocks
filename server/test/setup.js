// Runs before any test module is imported. Configures the environment so the
// singleton DB (server/src/db/schema.js) opens an isolated in-memory database
// and auth uses a deterministic secret.
process.env.DATABASE_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';
