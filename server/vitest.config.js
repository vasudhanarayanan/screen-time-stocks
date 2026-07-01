import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Point the app at an in-memory SQLite DB and use a fixed JWT secret.
    // setupFiles run before each test module is imported, so schema.js picks
    // up DATABASE_PATH before it opens a connection.
    setupFiles: ['./test/setup.js'],
    // Each test file gets its own process (and thus its own in-memory DB),
    // which keeps state isolated across files.
    pool: 'forks',
  },
});
