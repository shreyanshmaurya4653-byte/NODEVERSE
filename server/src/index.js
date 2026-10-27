import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import { initQueue } from './queue.js';
import { initScheduler } from './scheduler.js';
import workflowRoutes from './routes/workflows.js';
import runRoutes from './routes/runs.js';
import webhookRoutes from './routes/webhooks.js';
import deadLetterRoutes from './routes/deadLetters.js';
import statsRoutes from './routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-webhook-secret'],
}));
app.use(express.json({ limit: '5mb' }));

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/workflows',    workflowRoutes);
app.use('/api/runs',         runRoutes);
app.use('/api/dead-letters', deadLetterRoutes);
app.use('/api/stats',        statsRoutes);
app.use('/webhooks',         webhookRoutes);

// ── Health ─────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  service: 'NODEVERSE / ORCHANOVA',
  teamId: '390',
  timestamp: new Date().toISOString(),
}));

// ── Serve React Client (dist) ──────────────────────────────────
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/webhooks') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// ── Boot ───────────────────────────────────────────────────────
async function start() {
  await initDb();
  await initQueue();
  await initScheduler();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀  NODEVERSE FULL-STACK PLATFORM READY!`);
    console.log(`💻  UI Studio & App  →  http://localhost:${PORT}`);
    console.log(`📡  Webhook Ingress  →  http://localhost:${PORT}/webhooks/:workflowId`);
    console.log(`💓  System Health    →  http://localhost:${PORT}/health\n`);
  });
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
