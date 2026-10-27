import { Router } from 'express';
import { db } from '../db.js';
import { enqueueRun } from '../queue.js';

const router = Router();

/* POST /webhooks/:workflowId */
router.post('/:workflowId', async (req, res) => {
  try {
    const wf = await db.getWorkflow(req.params.workflowId);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    if (!wf.is_active) return res.status(400).json({ error: 'Workflow is inactive' });
    if (wf.trigger_type !== 'webhook') {
      return res.status(400).json({ error: 'Workflow is not configured for webhook trigger' });
    }

    const run = await db.createRun({
      workflow_id:  wf.id,
      trigger_type: 'webhook',
      input_data:   req.body || {},
    });

    await enqueueRun(wf.id, run.id, req.body || {});
    res.status(202).json({ runId: run.id, message: 'Run enqueued' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
