import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';
import { sse } from '../sse.js';

const router = Router();

/* GET /api/runs?workflowId=xxx&limit=50&offset=0 */
router.get('/', async (req, res) => {
  try {
    const { workflowId, limit = 50, offset = 0 } = req.query;
    const runs = await db.listRuns(workflowId || null, { limit, offset });
    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/runs/:id */
router.get('/:id', async (req, res) => {
  try {
    const run = await db.getRun(req.params.id);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    const nodeRuns = await db.listNodeRuns(req.params.id);
    res.json({ ...run, nodeRuns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/runs/:id/node-runs */
router.get('/:id/node-runs', async (req, res) => {
  try {
    const nodeRuns = await db.listNodeRuns(req.params.id);
    res.json(nodeRuns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/runs/:id/cancel */
router.post('/:id/cancel', async (req, res) => {
  try {
    const run = await db.getRun(req.params.id);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    const cancelled = await db.cancelRun(req.params.id);
    sse.runUpdate(req.params.id, cancelled);
    res.json(cancelled);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/runs/:id/stream  – SSE live stream */
router.get('/:id/stream', async (req, res) => {
  const runId    = req.params.id;
  const clientId = randomUUID();

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial snapshot
  try {
    const run      = await db.getRun(runId);
    const nodeRuns = await db.listNodeRuns(runId);
    res.write(`event: snapshot\ndata: ${JSON.stringify({ run, nodeRuns })}\n\n`);
  } catch { /* ignore */ }

  // Register client
  sse.add(runId, clientId, res);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 20_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sse.remove(runId, clientId);
  });
});

export default router;
