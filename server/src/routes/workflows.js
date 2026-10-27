import { Router } from 'express';
import { db } from '../db.js';
import { analyzeGraph, hasCycle } from '../executor.js';
import { enqueueRun } from '../queue.js';
import { scheduleWorkflow, unscheduleWorkflow } from '../scheduler.js';

const router = Router();

/* GET /api/workflows */
router.get('/', async (req, res) => {
  try {
    const workflows = await db.listWorkflows();
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/workflows/validate  – graph analysis & cycle detection */
router.post('/validate', async (req, res) => {
  try {
    const { nodes = [], edges = [] } = req.body;
    const analysis = analyzeGraph(nodes, edges);
    res.json({
      valid: !analysis.hasCycle,
      hasCycle: analysis.hasCycle,
      cycleTrace: analysis.cycleTrace,
      topologicalOrder: analysis.topologicalOrder,
      nodeCount: analysis.nodeCount,
      edgeCount: analysis.edgeCount,
      message: analysis.hasCycle
        ? `Cycle detected involving: ${analysis.cycleTrace.join(' -> ')}`
        : `Valid DAG with ${analysis.nodeCount} nodes in deterministic order`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/workflows */
router.post('/', async (req, res) => {
  try {
    const { name, description, nodes, edges, trigger_type, cron_expression, is_active } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Workflow name is required' });

    if ((nodes || []).length && (edges || []).length && hasCycle(nodes, edges)) {
      return res.status(400).json({ error: 'Cannot save workflow: cycle detected in graph' });
    }

    const wf = await db.createWorkflow({
      name,
      description,
      nodes,
      edges,
      trigger_type,
      cron_expression,
      is_active: is_active !== undefined ? is_active : true,
    });

    if (wf.trigger_type === 'cron' && wf.cron_expression && wf.is_active) {
      scheduleWorkflow(wf);
    }

    res.status(201).json(wf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/workflows/:id */
router.get('/:id', async (req, res) => {
  try {
    const wf = await db.getWorkflow(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    res.json(wf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* PUT /api/workflows/:id */
router.put('/:id', async (req, res) => {
  try {
    const { nodes, edges, ...rest } = req.body;

    if ((nodes || []).length && (edges || []).length && hasCycle(nodes, edges)) {
      return res.status(400).json({ error: 'Workflow contains a cycle' });
    }

    const wf = await db.updateWorkflow(req.params.id, { nodes, edges, ...rest });
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    // Update scheduler
    unscheduleWorkflow(wf.id);
    if (wf.trigger_type === 'cron' && wf.cron_expression && wf.is_active) {
      scheduleWorkflow(wf);
    }

    res.json(wf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* PATCH /api/workflows/:id/toggle */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const wf = await db.getWorkflow(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    const newActive = !wf.is_active;
    const updated = await db.updateWorkflow(wf.id, { is_active: newActive });

    if (updated.trigger_type === 'cron') {
      if (newActive && updated.cron_expression) {
        scheduleWorkflow(updated);
      } else {
        unscheduleWorkflow(updated.id);
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/workflows/:id/duplicate */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const wf = await db.getWorkflow(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    const cloned = await db.createWorkflow({
      name: `${wf.name} (Copy)`,
      description: wf.description,
      nodes: wf.nodes,
      edges: wf.edges,
      trigger_type: wf.trigger_type,
      cron_expression: wf.cron_expression,
      is_active: false,
    });

    res.status(201).json(cloned);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE /api/workflows/:id */
router.delete('/:id', async (req, res) => {
  try {
    const wf = await db.getWorkflow(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    unscheduleWorkflow(req.params.id);
    await db.deleteWorkflow(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/workflows/:id/trigger  – manual trigger */
router.post('/:id/trigger', async (req, res) => {
  try {
    const wf = await db.getWorkflow(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    const run = await db.createRun({
      workflow_id:  wf.id,
      trigger_type: 'manual',
      input_data:   req.body?.input || {},
    });

    await enqueueRun(wf.id, run.id, req.body?.input || {});
    res.status(202).json(run);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/workflows/:id/validate  – instance validation */
router.post('/:id/validate', async (req, res) => {
  try {
    const wf = await db.getWorkflow(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    const nodes = req.body.nodes || wf.nodes || [];
    const edges = req.body.edges || wf.edges || [];
    const analysis = analyzeGraph(nodes, edges);

    res.json({
      valid: !analysis.hasCycle,
      hasCycle: analysis.hasCycle,
      cycleTrace: analysis.cycleTrace,
      topologicalOrder: analysis.topologicalOrder,
      nodeCount: analysis.nodeCount,
      edgeCount: analysis.edgeCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
