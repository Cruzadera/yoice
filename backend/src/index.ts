import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { initDB } from './services/db';
import authRoutes from './routes/authRoutes';
import groupRoutes from './routes/groupRoutes';
import internalRoutes from './routes/internalRoutes';
import pollRoutes from './routes/pollRoutes';
import questionRoutes from './routes/questionRoutes';
import userRoutes from './routes/userRoutes';
import voteRoutes from './routes/voteRoutes';
import { startPollCron } from './services/pollCron';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL;

app.use(
  cors({
    origin: corsOrigin
      ? (origin, callback) => {
          if (!origin || origin === corsOrigin) {
            callback(null, true);
            return;
          }
          callback(new Error('Origen no permitido por CORS'));
        }
      : true,
  }),
);
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/user', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/votes', voteRoutes);
app.use('/internal', internalRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

initDB()
  .then(() => {
    if (process.env.ENABLE_POLL_CRON === 'true') {
      startPollCron();
    }

    app.listen(port, () => {
      console.log(`Back-end running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('DB initialization failed', error);
    process.exit(1);
  });
