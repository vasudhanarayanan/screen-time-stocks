import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.js';
import appsRouter from './routes/apps.js';
import snapshotsRouter from './routes/snapshots.js';
import marketsRouter from './routes/markets.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/apps', appsRouter);
app.use('/api/snapshots', snapshotsRouter);
app.use('/api/markets', marketsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
