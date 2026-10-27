import { Router } from 'express';
import { db } from '../db.js';
import { enqueueRun } from '../queue.js';

const router = Router();

/* GET /api/dead-letters */
router.get('/', async (req, res) => {
  try {
    const { replayState } = req.query;
    const items = await db.listDeadLetters({ replayState });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/dead-letters/:id */
router.get('/:id', async (req, res) => {
  try {
    const dl = await db.getDeadLetter(req.params.id);
    if (!dl) return res.status(404).json({ error: 'Dead letter not found' });
    res.json(dl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/dead-letters/:id/replay */
router.post('/:id/replay', async (req, res) => {
  try {
    const dl = await db.getDeadLetter(req.params.id);
    if (!dl) return res.status(404).json({ error: 'Dead letter not found' });

    // Mark as replayed
    await db.updateDeadLetter(dl.id, { replay_state: 'replayed' });

    // Enqueue a fresh run of the workflow with the original payload
    const newRun = await db.createRun({
      workflow_id:  dl.workflow_id,
      trigger_type: 'manual',
      input_data:   dl.payload || {},
    });

    await enqueueRun(dl.workflow_id, newRun.id, dl.payload || {});

    res.json({
      success: true,
      message: `Dead letter ${dl.id.slice(0, 8)} replayed successfully`,
      newRunId: newRun.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/dead-letters/:id/discard */
router.post('/:id/discard', async (req, res) => {
  try {
    const dl = await db.getDeadLetter(req.params.id);
    if (!dl) return res.status(404).json({ error: 'Dead letter not found' });

    await db.discardDeadLetter(dl.id);
    res.json({ success: true, message: 'Dead letter discarded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
