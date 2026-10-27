import cron from 'node-cron';
import { db } from './db.js';
import { enqueueRun } from './queue.js';

const scheduled = new Map(); // workflowId → cron task

export async function initScheduler() {
  // Load all cron workflows on startup
  const workflows = await db.listWorkflows();
  for (const wf of workflows) {
    if (wf.trigger_type === 'cron' && wf.cron_expression && wf.is_active) {
      scheduleWorkflow(wf);
    }
  }
  console.log(`✅  Scheduler initialised (${scheduled.size} cron job(s))`);
}

export function scheduleWorkflow(workflow) {
  if (!cron.validate(workflow.cron_expression)) {
    console.warn(`Invalid cron "${workflow.cron_expression}" for workflow ${workflow.id}`);
    return;
  }

  // Remove existing task if any
  unscheduleWorkflow(workflow.id);

  const task = cron.schedule(workflow.cron_expression, async () => {
    try {
      const run = await db.createRun({
        workflow_id:  workflow.id,
        trigger_type: 'cron',
        input_data:   {},
      });
      await enqueueRun(workflow.id, run.id, {});
      console.log(`⏰  Cron triggered workflow ${workflow.id} → run ${run.id}`);
    } catch (err) {
      console.error(`Cron execution error for ${workflow.id}:`, err.message);
    }
  });

  scheduled.set(workflow.id, task);
}

export function unscheduleWorkflow(workflowId) {
  const task = scheduled.get(workflowId);
  if (task) {
    task.stop();
    scheduled.delete(workflowId);
  }
}
