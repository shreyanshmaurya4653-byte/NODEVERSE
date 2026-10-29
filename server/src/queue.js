import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { executeRun } from './executor.js';

let queue  = null;
let worker = null;
export let queueEnabled = false;

function getConnectionErrorMessage(error) {
  if (error?.errors?.length) {
    const messages = error.errors
      .map(connectionError => connectionError.message)
      .filter(Boolean);
    if (messages.length) return messages.join('; ');
  }
  return error?.message || 'Unknown connection error';
}

export async function initQueue() {
  if (!process.env.REDIS_URL) {
    console.log('⚠️  No REDIS_URL – BullMQ disabled, runs execute inline');
    return;
  }

  let connection;
  let redisConnected = false;
  let lastConnectionError;
  try {
    connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: times => {
        if (!redisConnected && times >= 3) return null;
        return Math.min(times * 200, 1000);
      },
    });
    connection.on('error', err => {
      lastConnectionError = err;
      if (queueEnabled) {
        console.error('Redis connection error:', getConnectionErrorMessage(err));
      }
    });
    await connection.ping();
    redisConnected = true;

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
    if (connection && connection.status !== 'end') {
      connection.disconnect();
    }
    const reason = getConnectionErrorMessage(lastConnectionError || err);
    console.warn('⚠️  Redis unavailable – runs execute inline:', reason);
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
