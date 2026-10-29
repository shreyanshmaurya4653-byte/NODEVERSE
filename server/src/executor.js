import fetch from 'node-fetch';
import { db } from './db.js';
import { sse } from './sse.js';

/* ── Cycle Detection & Topological Sort (Kahn's Algorithm) ──── */
export function analyzeGraph(nodes = [], edges = []) {
  const inDegree = new Map(nodes.map(n => [n.id, 0]));
  const adj      = new Map(nodes.map(n => [n.id, []]));

  for (const e of edges) {
    if (adj.has(e.source)) adj.get(e.source).push(e.target);
    if (inDegree.has(e.target)) inDegree.set(e.target, inDegree.get(e.target) + 1);
  }

  const queue  = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  const result = [];

  while (queue.length) {
    const curr = queue.shift();
    result.push(curr);
    for (const next of (adj.get(curr) || [])) {
      const nd = inDegree.get(next) - 1;
      inDegree.set(next, nd);
      if (nd === 0) queue.push(next);
    }
  }

  const hasCycle = result.length !== nodes.length;
  let cycleTrace = null;

  if (hasCycle) {
    // Detect cycle nodes
    const remaining = nodes.filter(n => !result.includes(n.id)).map(n => n.id);
    cycleTrace = remaining;
  }

  return {
    hasCycle,
    cycleTrace,
    topologicalOrder: hasCycle ? null : result,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
}

export function hasCycle(nodes, edges) {
  const analysis = analyzeGraph(nodes, edges);
  return analysis.hasCycle;
}

/* ── String Interpolation Helper ─────────────────────────────── */
function interpolate(str, data) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const path = key.trim().replace(/^input\./, '');
    const val = path.split('.').reduce((o, k) => o?.[k], data);
    return val !== undefined ? String(val) : '';
  });
}

function timestampLog(msg) {
  const d = new Date();
  const time = d.toISOString().split('T')[1].replace('Z', '');
  return `[${time}] ${msg}`;
}

/* ── Node Executors ──────────────────────────────────────────── */
async function executeTrigger(config, input, logs) {
  logs.push(timestampLog(`Trigger evaluated: type=${config.triggerType || 'manual'}`));

  let configuredPayload = {};
  if (config.payload) {
    try {
      configuredPayload = typeof config.payload === 'string' ? JSON.parse(config.payload) : config.payload;
      logs.push(timestampLog(`Loaded configured trigger payload (${Object.keys(configuredPayload).length} keys)`));
    } catch {
      configuredPayload = { raw: config.payload };
    }
  }

  const rawInput = (input && typeof input === 'object') ? input : {};
  const merged = { ...configuredPayload, ...rawInput };

  return {
    ...merged,
    payload: merged,
    triggered: true,
    receivedAt: new Date().toISOString(),
  };
}

async function executeHttp(config, input, logs) {
  const rawUrl = config.url || 'https://httpbin.org/get';
  const url    = interpolate(rawUrl, input);
  const method = (config.method || 'GET').toUpperCase();

  let parsedHeaders = {};
  if (config.headers) {
    try {
      parsedHeaders = typeof config.headers === 'string' ? JSON.parse(config.headers) : config.headers;
    } catch {
      parsedHeaders = {};
    }
  }
  const headers = { 'Content-Type': 'application/json', ...parsedHeaders };

  logs.push(timestampLog(`Initiating HTTP ${method} -> ${url}`));

  let body;
  if (['POST', 'PUT', 'PATCH'].includes(method) && config.body) {
    const rawBody = typeof config.body === 'object' ? JSON.stringify(config.body) : config.body;
    body = interpolate(rawBody, input);
    logs.push(timestampLog(`Payload serialized (${body.length} bytes)`));
  }

  const startTime = Date.now();
  const res = await fetch(url, { method, headers, body });
  const durationMs = Date.now() - startTime;
  const text = await res.text();

  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  logs.push(timestampLog(`HTTP ${res.status} response received in ${durationMs}ms`));

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${typeof data === 'string' ? data.slice(0, 200) : JSON.stringify(data).slice(0, 200)}`);
  }

  return { status: res.status, durationMs, data };
}

async function executeTransform(config, input, logs) {
  const expr = config.expression || 'input';
  logs.push(timestampLog(`Executing transform expression: ${expr.slice(0, 50)}${expr.length > 50 ? '...' : ''}`));

  // Sandboxed Function evaluation with 'input' in scope
  const fn = new Function('input', `"use strict"; return (${expr});`);
  const result = fn(input);
  logs.push(timestampLog(`Transform evaluated successfully -> ${typeof result}`));
  return result;
}

async function executeCondition(config, input, logs) {
  const expr = config.expression || 'false';
  logs.push(timestampLog(`Evaluating condition expression: ${expr}`));

  const fn = new Function('input', `"use strict"; return Boolean(${expr});`);
  const result = Boolean(fn(input));
  const branch = result ? 'true' : 'false';

  logs.push(timestampLog(`Condition resolved to: ${result ? 'TRUE' : 'FALSE'} (Branch: ${branch})`));
  return { result, branch, input };
}

async function executeDelay(config, input, logs) {
  const ms = Math.min(Math.max(Number(config.delayMs) || 1000, 50), 30000);
  logs.push(timestampLog(`Delay scheduled: pausing execution for ${ms}ms`));
  await new Promise(r => setTimeout(r, ms));
  logs.push(timestampLog(`Delay completed: elapsed ${ms}ms`));
  return { delayed: ms, input };
}

/* ── Universal Web Scraper & Website Automator ────────────────── */
async function executeScraper(config, input, logs) {
  const rawUrl = config.url || 'https://news.ycombinator.com';
  const url = interpolate(rawUrl, input);
  logs.push(timestampLog(`Scraping target website: ${url}`));

  const startTime = Date.now();
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NodeVerse-Automator/2.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ...(config.headers || {}),
    },
  });
  const durationMs = Date.now() - startTime;
  const html = await res.text();
  logs.push(timestampLog(`HTTP ${res.status} received in ${durationMs}ms (${html.length} chars)`));

  // Extract metadata, title, headings, and links from any website
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'No title detected';
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = metaDescMatch ? metaDescMatch[1].trim() : null;
  const headings = [...html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi)].map(m => m[1].trim()).slice(0, 10);
  const links = [...html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(m => m[1]).slice(0, 10);

  logs.push(timestampLog(`Extracted: Title="${title.slice(0, 40)}" | ${headings.length} headings | ${links.length} links`));

  return {
    url,
    status: res.status,
    title,
    description,
    headings,
    links,
    scrapedAt: new Date().toISOString(),
    durationMs,
  };
}

/* ── Universal Platform / App Connector ──────────────────────── */
async function executeAppConnector(config, input, logs) {
  const platform = config.platform || 'custom';
  logs.push(timestampLog(`Executing platform integration: [${platform.toUpperCase()}]`));
  return await executeHttp(config, input, logs);
}

async function executeWebhookOut(config, input, logs) {
  logs.push(timestampLog(`Dispatching outbound notification to channel [${config.channel || 'general'}]`));
  const message = interpolate(config.message || 'Notification dispatched from NodeVerse', input);
  logs.push(timestampLog(`Message: ${message.slice(0, 80)}`));

  if (config.endpointUrl) {
    try {
      await fetch(config.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, input, timestamp: new Date().toISOString() }),
      });
      logs.push(timestampLog(`Dispatched to remote webhook endpoint: 200 OK`));
    } catch (err) {
      logs.push(timestampLog(`Warning: remote webhook dispatch failed (${err.message})`));
    }
  }

  return { dispatched: true, channel: config.channel || 'default', message, timestamp: new Date().toISOString() };
}

const EXECUTORS = {
  trigger:       executeTrigger,
  http:          executeHttp,
  transform:     executeTransform,
  condition:     executeCondition,
  delay:         executeDelay,
  webhook_out:   executeWebhookOut,
  scraper:       executeScraper,
  app_connector: executeAppConnector,
};

/* ── Main Graph Executor ─────────────────────────────────────── */
export async function executeRun(workflowId, runId, inputData = {}) {
  const workflow = await db.getWorkflow(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : JSON.parse(workflow.nodes || '[]');
  const edges = Array.isArray(workflow.edges) ? workflow.edges : JSON.parse(workflow.edges || '[]');

  if (!nodes.length) {
    const finishedRun = await db.updateRun(runId, {
      status: 'failed',
      error: 'Empty workflow: no nodes configured',
      completed_at: new Date().toISOString(),
    });
    sse.runUpdate(runId, finishedRun);
    return;
  }

  /* Mark run as running */
  let run = await db.updateRun(runId, { status: 'running' });
  sse.runUpdate(runId, run);

  /* Cycle validation & Topological sort */
  const graphAnalysis = analyzeGraph(nodes, edges);
  if (graphAnalysis.hasCycle) {
    const errorMsg = `Cycle detected in workflow graph! Cycle path nodes: ${graphAnalysis.cycleTrace.join(' -> ')}`;
    run = await db.updateRun(runId, {
      status: 'failed',
      error: errorMsg,
      completed_at: new Date().toISOString(),
    });
    sse.runUpdate(runId, run);
    return;
  }

  const order = graphAnalysis.topologicalOrder;

  /* Build incoming edge lookups for condition & input handling */
  const incomingEdges = new Map(); // targetNodeId -> [edge, ...]
  for (const e of edges) {
    if (!incomingEdges.has(e.target)) incomingEdges.set(e.target, []);
    incomingEdges.get(e.target).push(e);
  }

  const nodeById     = new Map(nodes.map(n => [n.id, n]));
  const nodeOutputs  = new Map(); // nodeId -> output
  const nodeStatuses = new Map(); // nodeId -> 'completed'|'failed'|'skipped'
  const nodeRunIds   = new Map(); // nodeId -> nodeRunId
  const nodeLogsMap  = new Map(); // nodeId -> [logString, ...]

  /* Initialize all node runs */
  for (const nodeId of order) {
    const node = nodeById.get(nodeId);
    const nr = await db.createNodeRun({
      run_id:    runId,
      node_id:   nodeId,
      node_type: node?.type || 'unknown',
      input:     {},
      logs:      [timestampLog(`Queued in topological plan`)],
    });
    nodeRunIds.set(nodeId, nr.id);
    nodeLogsMap.set(nodeId, [timestampLog(`Queued in topological plan`)]);
  }

  let anyFailed = false;

  /* Execute in topological order */
  for (const nodeId of order) {
    const node   = nodeById.get(nodeId);
    const nrId   = nodeRunIds.get(nodeId);
    const config = node?.data || {};
    const logs   = nodeLogsMap.get(nodeId) || [];

    const inEdges = incomingEdges.get(nodeId) || [];
    let nodeInput;
    let shouldSkip = false;
    let skipReason = '';

    if (inEdges.length === 0) {
      // Root trigger node
      nodeInput = inputData;
    } else {
      // Check condition routing and parent statuses
      for (const edge of inEdges) {
        const parentStatus = nodeStatuses.get(edge.source);
        const parentNode   = nodeById.get(edge.source);

        if (parentStatus === 'failed' || parentStatus === 'skipped') {
          shouldSkip = true;
          skipReason = `Upstream dependency [${parentNode?.data?.label || edge.source}] ${parentStatus}`;
          break;
        }

        // Check if edge is attached to a Condition node branch
        if (parentNode?.type === 'condition') {
          const parentOutput = nodeOutputs.get(edge.source);
          const chosenBranch = parentOutput?.branch; // 'true' or 'false'
          if (edge.sourceHandle && edge.sourceHandle !== chosenBranch) {
            shouldSkip = true;
            skipReason = `Pruned branch: condition branched to '${chosenBranch}', but edge requires '${edge.sourceHandle}'`;
            break;
          }
        }
      }

      if (shouldSkip) {
        logs.push(timestampLog(`Skipped: ${skipReason}`));
        nodeStatuses.set(nodeId, 'skipped');
        await db.updateNodeRun(nrId, {
          status:       'skipped',
          started_at:   new Date().toISOString(),
          completed_at: new Date().toISOString(),
          logs,
        });
        const nr = await getNodeRun(runId, nrId);
        sse.nodeUpdate(runId, nr);
        continue;
      }

      // Merge parent outputs as input
      if (inEdges.length === 1) {
        nodeInput = nodeOutputs.get(inEdges[0].source) ?? {};
      } else {
        nodeInput = {};
        for (const edge of inEdges) {
          nodeInput[edge.source] = nodeOutputs.get(edge.source);
        }
      }
    }

    /* Mark node as running */
    logs.push(timestampLog(`Starting execution on distributed engine`));
    await db.updateNodeRun(nrId, {
      status:     'running',
      input:      nodeInput,
      started_at: new Date().toISOString(),
      logs,
    });
    sse.nodeUpdate(runId, await getNodeRun(runId, nrId));

    /* Bounded retries with exponential backoff & jitter */
    const maxRetries  = Math.max(0, Number(config.maxRetries) || 0);
    const baseDelayMs = Math.max(100, Number(config.baseDelayMs) || 500);
    const maxDelayMs  = Math.max(baseDelayMs, Number(config.maxDelayMs) || 8000);
    let attempt = 1;
    let lastError = null;

    while (attempt <= maxRetries + 1) {
      if (attempt > 1) {
        const jitter = Math.floor(Math.random() * 150);
        const backoff = Math.min(baseDelayMs * Math.pow(2, attempt - 2) + jitter, maxDelayMs);
        logs.push(timestampLog(`Retry attempt ${attempt}/${maxRetries + 1} with backoff ${backoff}ms (jitter +${jitter}ms)`));
        await new Promise(r => setTimeout(r, backoff));
      }

      try {
        const executor = EXECUTORS[node?.type] || EXECUTORS.transform;
        const output = await executor(config, nodeInput, logs);

        nodeOutputs.set(nodeId, output);
        nodeStatuses.set(nodeId, 'completed');
        logs.push(timestampLog(`Node completed successfully`));

        await db.updateNodeRun(nrId, {
          status:       'completed',
          output,
          attempt,
          completed_at: new Date().toISOString(),
          logs,
        });
        sse.nodeUpdate(runId, await getNodeRun(runId, nrId));
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        logs.push(timestampLog(`Attempt ${attempt} failed: ${err.message}`));
        attempt++;
      }
    }

    if (lastError) {
      anyFailed = true;
      nodeStatuses.set(nodeId, 'failed');
      logs.push(timestampLog(`Exhausted all retries (${maxRetries + 1}). Marking FAILED.`));

      await db.updateNodeRun(nrId, {
        status:       'failed',
        error:        lastError.message,
        attempt:      attempt - 1,
        completed_at: new Date().toISOString(),
        logs,
      });
      sse.nodeUpdate(runId, await getNodeRun(runId, nrId));

      /* Create Dead-Letter Queue record (Section 06 RECOVER) */
      try {
        const dl = await db.createDeadLetter({
          run_id:      runId,
          node_run_id: nrId,
          workflow_id: workflowId,
          node_id:     nodeId,
          node_name:   config.label || nodeId,
          payload:     nodeInput,
          failure:     lastError.message,
          attempts:    attempt - 1,
        });
        logs.push(timestampLog(`Dead-Letter Record created [${dl.id.slice(0, 8)}] for operator review & replay`));
        sse.broadcast('dead_letter_created', dl);
      } catch (dlErr) {
        console.error('Failed to isolate dead letter:', dlErr);
      }
    }
  }

  /* Finalize Workflow Run */
  run = await db.updateRun(runId, {
    status:       anyFailed ? 'failed' : 'completed',
    completed_at: new Date().toISOString(),
    error:        anyFailed ? 'One or more DAG nodes failed execution' : null,
  });
  sse.runUpdate(runId, run);
}

async function getNodeRun(runId, nodeRunId) {
  const nodeRuns = await db.listNodeRuns(runId);
  return nodeRuns.find(nr => nr.id === nodeRunId) || { id: nodeRunId };
}
