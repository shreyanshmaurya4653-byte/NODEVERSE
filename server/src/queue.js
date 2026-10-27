import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { executeRun } from './executor.js';

let queue  = null;
let worker = null;
export let queueEnabled = false;

export async function initQueue() {
  if (!process.env.REDIS_URL) {
    console.log('⚠️  No REDIS_URL – BullMQ disabled, runs execute inline');
    return;
  }

  try {
    const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    await connection.ping();

    queue = new Queue('nodeverse-runs', { connection });

    worker = new Worker('nodeverse-runs', async job => {
      const { workflowId, runId, inputData } = job.data;
      await executeRun(workflowId, runId, inputData);
    }, { connection, concurrency: 5 });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err.message);
    });

    queueEnabled = true;
    console.log('✅  BullMQ + Redis connected');
  } catch (err) {
    console.warn('⚠️  Redis unavailable – runs execute inline:', err.message);
  }
}

/**
 * Enqueue a run (uses BullMQ if available, otherwise runs inline)
 */
export async function enqueueRun(workflowId, runId, inputData = {}) {
  if (queueEnabled && queue) {
    await queue.add('execute', { workflowId, runId, inputData }, {
      attempts: 1,
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  } else {
    // Inline async (non-blocking)
    setImmediate(() => executeRun(workflowId, runId, inputData));
  }
}
