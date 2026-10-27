import pg from 'pg';
import { randomUUID } from 'crypto';

const { Pool } = pg;

let pool = null;
let useInMemory = false;

/* ── In-memory store (fallback when Postgres unavailable) ────── */
export const mem = {
  workflows:   new Map(),
  runs:        new Map(),
  nodeRuns:    new Map(),
  deadLetters: new Map(),
};

/* ── Helpers ──────────────────────────────────────────────────── */
function now() { return new Date().toISOString(); }

function paginate(arr, limit = 50, offset = 0) {
  return arr.slice(Number(offset), Number(offset) + Number(limit));
}

/* ── Sample Seed Workflows ────────────────────────────────────── */
const SEED_WORKFLOWS = [
  {
    id: 'wf-ecommerce-demo-01',
    name: 'E-Commerce Order Validation & Routing',
    description: 'Triggered via webhook on checkout. Validates cart items, checks risk scoring, branches on total, and dispatches customer notification.',
    trigger_type: 'webhook',
    cron_expression: null,
    is_active: true,
    nodes: [
      {
        id: 'node_trigger_1',
        type: 'trigger',
        position: { x: 60, y: 160 },
        data: {
          label: 'Order Webhook',
          triggerType: 'webhook',
          description: 'Receives new checkout payload',
        },
      },
      {
        id: 'node_transform_1',
        type: 'transform',
        position: { x: 400, y: 160 },
        data: {
          label: 'Normalize & Calculate Total',
          expression: '({\n  orderId: input?.orderId || "ORD-" + Math.floor(1000 + Math.random() * 9000),\n  customer: input?.customer || "Jane Doe",\n  email: input?.email || "jane@example.com",\n  amount: Number(input?.amount || 249.50),\n  itemsCount: Array.isArray(input?.items) ? input.items.length : 3,\n  isVip: (input?.amount || 249.50) >= 200,\n  processedAt: new Date().toISOString()\n})',
        },
      },
      {
        id: 'node_condition_1',
        type: 'condition',
        position: { x: 740, y: 160 },
        data: {
          label: 'High-Value Order Check',
          expression: 'input.amount >= 150',
        },
      },
      {
        id: 'node_delay_1',
        type: 'delay',
        position: { x: 1080, y: 60 },
        data: {
          label: 'Fraud Cooldown (VIP)',
          delayMs: 800,
        },
      },
      {
        id: 'node_http_vip',
        type: 'http',
        position: { x: 1420, y: 60 },
        data: {
          label: 'Notify Priority Queue',
          method: 'POST',
          url: 'https://httpbin.org/post',
          body: '{\n  "event": "vip_order_authorized",\n  "order": "{{input.orderId}}",\n  "amount": "{{input.amount}}"\n}',
          maxRetries: 2,
        },
      },
      {
        id: 'node_http_standard',
        type: 'http',
        position: { x: 1080, y: 300 },
        data: {
          label: 'Standard Fulfillment',
          method: 'POST',
          url: 'https://httpbin.org/post',
          body: '{\n  "event": "standard_order_queued",\n  "order": "{{input.orderId}}"\n}',
          maxRetries: 1,
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'node_trigger_1', target: 'node_transform_1', animated: true },
      { id: 'e2', source: 'node_transform_1', target: 'node_condition_1', animated: true },
      { id: 'e3', source: 'node_condition_1', sourceHandle: 'true', target: 'node_delay_1', animated: true, label: 'True (VIP)' },
      { id: 'e4', source: 'node_delay_1', target: 'node_http_vip', animated: true },
      { id: 'e5', source: 'node_condition_1', sourceHandle: 'false', target: 'node_http_standard', animated: true, label: 'False (Standard)' },
    ],
  },
  {
    id: 'wf-api-sentinel-02',
    name: 'Microservice Health & Latency Sentinel',
    description: 'Scheduled every 5 minutes. Pings external telemetry endpoint, checks HTTP 200 and latency SLAs, and triggers alerts.',
    trigger_type: 'cron',
    cron_expression: '*/5 * * * *',
    is_active: true,
    nodes: [
      {
        id: 'node_cron_1',
        type: 'trigger',
        position: { x: 60, y: 160 },
        data: {
          label: '5-Minute Cron Ping',
          triggerType: 'cron',
          cronExpression: '*/5 * * * *',
        },
      },
      {
        id: 'node_ping_http',
        type: 'http',
        position: { x: 400, y: 160 },
        data: {
          label: 'Ping Telemetry API',
          method: 'GET',
          url: 'https://httpbin.org/json',
          maxRetries: 3,
          baseDelayMs: 500,
        },
      },
      {
        id: 'node_transform_metric',
        type: 'transform',
        position: { x: 740, y: 160 },
        data: {
          label: 'Extract Latency & Status',
          expression: '({\n  status: input?.status || 200,\n  healthy: (input?.status || 200) === 200,\n  slideshowTitle: input?.data?.slideshow?.title || "Operational",\n  evaluatedAt: new Date().toISOString()\n})',
        },
      },
      {
        id: 'node_cond_health',
        type: 'condition',
        position: { x: 1080, y: 160 },
        data: {
          label: 'Is Service Healthy?',
          expression: 'input.healthy === true',
        },
      },
      {
        id: 'node_notify_slack',
        type: 'webhook_out',
        position: { x: 1420, y: 160 },
        data: {
          label: 'Broadcast Metric Pulse',
          channel: 'infrastructure-alerts',
          message: 'All systems operational. Latency SLA within threshold.',
        },
      },
    ],
    edges: [
      { id: 'e_s1', source: 'node_cron_1', target: 'node_ping_http', animated: true },
      { id: 'e_s2', source: 'node_ping_http', target: 'node_transform_metric', animated: true },
      { id: 'e_s3', source: 'node_transform_metric', target: 'node_cond_health', animated: true },
      { id: 'e_s4', source: 'node_cond_health', sourceHandle: 'true', target: 'node_notify_slack', animated: true, label: 'Healthy' },
    ],
  },
  {
    id: 'wf-resilient-etl-03',
    name: 'Resilient Data Ingestion with DLQ Recovery',
    description: 'Demonstrates exponential backoff with jitter and automatic Dead-Letter Queue isolation if third-party endpoints fail.',
    trigger_type: 'manual',
    cron_expression: null,
    is_active: true,
    nodes: [
      {
        id: 'node_manual_start',
        type: 'trigger',
        position: { x: 60, y: 160 },
        data: {
          label: 'Manual Ingestion Trigger',
          triggerType: 'manual',
        },
      },
      {
        id: 'node_fetch_batch',
        type: 'http',
        position: { x: 400, y: 160 },
        data: {
          label: 'Fetch Upstream Batch',
          method: 'GET',
          url: 'https://httpbin.org/get?source=etl_pipeline&batch=849',
          maxRetries: 2,
          baseDelayMs: 600,
        },
      },
      {
        id: 'node_clean_data',
        type: 'transform',
        position: { x: 740, y: 160 },
        data: {
          label: 'Sanitize & Aggregate Records',
          expression: '({\n  recordsParsed: 1420,\n  origin: input?.data?.args?.source || "unknown",\n  checksum: "sha256-d7a8f19",\n  timestamp: Date.now()\n})',
        },
      },
      {
        id: 'node_staging_delay',
        type: 'delay',
        position: { x: 1080, y: 160 },
        data: {
          label: 'Buffer Before Sink',
          delayMs: 600,
        },
      },
      {
        id: 'node_sink_out',
        type: 'webhook_out',
        position: { x: 1420, y: 160 },
        data: {
          label: 'Sink to Data Lake',
          channel: 'lake-ingestion',
          message: 'Batch 849 successfully committed to analytical storage.',
        },
      },
    ],
    edges: [
      { id: 'e_etl_1', source: 'node_manual_start', target: 'node_fetch_batch', animated: true },
      { id: 'e_etl_2', source: 'node_fetch_batch', target: 'node_clean_data', animated: true },
      { id: 'e_etl_3', source: 'node_clean_data', target: 'node_staging_delay', animated: true },
      { id: 'e_etl_4', source: 'node_staging_delay', target: 'node_sink_out', animated: true },
    ],
  },
  {
    id: 'wf-beginner-showcase-04',
    name: 'Beginner Flow: Website Scraper to Discord Alert',
    description: 'Step-by-step beginner example: Starts on demand, scrapes a live website, normalizes the article titles, checks content rules, and branches to send a Discord notification.',
    trigger_type: 'manual',
    cron_expression: null,
    is_active: true,
    nodes: [
      {
        id: 'node_beg_1',
        type: 'trigger',
        position: { x: 60, y: 160 },
        data: {
          label: '1. Start Pipeline (Manual)',
          triggerType: 'manual',
        },
      },
      {
        id: 'node_beg_2',
        type: 'scraper',
        position: { x: 400, y: 160 },
        data: {
          label: '2. Scrape News / Website',
          url: 'https://news.ycombinator.com',
          extractMode: 'all',
        },
      },
      {
        id: 'node_beg_3',
        type: 'transform',
        position: { x: 740, y: 160 },
        data: {
          label: '3. Format Article Digest',
          expression: '({\n  scrapedUrl: input?.url || "https://news.ycombinator.com",\n  title: input?.title || "Hacker News Digest",\n  totalHeadings: (input?.headings || []).length,\n  topStory: input?.headings?.[0] || "AI Workflow Automation in NodeVerse",\n  isHighTraffic: true,\n  scrapedAt: new Date().toLocaleTimeString()\n})',
        },
      },
      {
        id: 'node_beg_4',
        type: 'condition',
        position: { x: 1080, y: 160 },
        data: {
          label: '4. Check Content Found?',
          expression: 'input.totalHeadings > 0',
        },
      },
      {
        id: 'node_beg_5',
        type: 'app_connector',
        position: { x: 1420, y: 80 },
        data: {
          label: '5. Dispatch Discord Alert',
          platform: 'discord',
          action: 'Discord Webhook Broadcast',
          url: 'https://httpbin.org/post',
          method: 'POST',
          body: '{\n  "content": "🚀 **News Scraper Finished**: {{input.topStory}}\\n*Source: {{input.scrapedUrl}}*",\n  "username": "NodeVerse Bot"\n}',
        },
      },
      {
        id: 'node_beg_6',
        type: 'webhook_out',
        position: { x: 1420, y: 280 },
        data: {
          label: '6. Empty Content Alert',
          channel: 'system-warnings',
          message: 'Scraper completed but 0 headings detected at {{input.scrapedAt}}',
        },
      },
    ],
    edges: [
      { id: 'e_beg_1', source: 'node_beg_1', target: 'node_beg_2', animated: true },
      { id: 'e_beg_2', source: 'node_beg_2', target: 'node_beg_3', animated: true },
      { id: 'e_beg_3', source: 'node_beg_3', target: 'node_beg_4', animated: true },
      { id: 'e_beg_4', source: 'node_beg_4', sourceHandle: 'true', target: 'node_beg_5', animated: true },
      { id: 'e_beg_5', source: 'node_beg_4', sourceHandle: 'false', target: 'node_beg_6', animated: true },
    ],
  },
];

/* ── Seed memory with initial workflows & sample runs ────────── */
function seedInitialData() {
  for (const wf of SEED_WORKFLOWS) {
    if (!mem.workflows.has(wf.id)) {
      mem.workflows.set(wf.id, {
        ...wf,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
      });
    }
  }

  // Pre-seed a sample completed run and an exhausted dead letter for instant demonstration
  const sampleRunId = 'run-demo-sample-01';
  if (!mem.runs.has(sampleRunId)) {
    const started = new Date(Date.now() - 120000).toISOString();
    const completed = new Date(Date.now() - 117800).toISOString();
    mem.runs.set(sampleRunId, {
      id: sampleRunId,
      workflow_id: 'wf-ecommerce-demo-01',
      status: 'completed',
      trigger_type: 'webhook',
      input_data: { orderId: 'ORD-7821', amount: 320, customer: 'Alice Cooper', items: ['EdgeRouter Pro', 'SFP+ Fiber'] },
      started_at: started,
      completed_at: completed,
      error: null,
    });

    const nr1 = {
      id: 'nr-sample-1',
      run_id: sampleRunId,
      node_id: 'node_trigger_1',
      node_type: 'trigger',
      status: 'completed',
      input: {},
      output: { triggered: true, payload: { orderId: 'ORD-7821', amount: 320 } },
      error: null,
      attempt: 1,
      logs: ['[00:00.000] Webhook payload accepted', '[00:00.010] Trigger initialized'],
      started_at: started,
      completed_at: new Date(Date.now() - 119900).toISOString(),
    };
    const nr2 = {
      id: 'nr-sample-2',
      run_id: sampleRunId,
      node_id: 'node_transform_1',
      node_type: 'transform',
      status: 'completed',
      input: nr1.output,
      output: { orderId: 'ORD-7821', customer: 'Alice Cooper', amount: 320, itemsCount: 2, isVip: true },
      error: null,
      attempt: 1,
      logs: ['[00:00.100] Evaluating JS transform expression', '[00:00.120] Transformed 4 fields successfully'],
      started_at: new Date(Date.now() - 119850).toISOString(),
      completed_at: new Date(Date.now() - 119700).toISOString(),
    };
    const nr3 = {
      id: 'nr-sample-3',
      run_id: sampleRunId,
      node_id: 'node_condition_1',
      node_type: 'condition',
      status: 'completed',
      input: nr2.output,
      output: { result: true, branch: 'true', input: nr2.output },
      error: null,
      attempt: 1,
      logs: ['[00:00.200] Condition evaluated: amount (320) >= 150 -> TRUE'],
      started_at: new Date(Date.now() - 119650).toISOString(),
      completed_at: new Date(Date.now() - 119600).toISOString(),
    };
    const nr4 = {
      id: 'nr-sample-4',
      run_id: sampleRunId,
      node_id: 'node_delay_1',
      node_type: 'delay',
      status: 'completed',
      input: nr3.output,
      output: { delayed: 800 },
      error: null,
      attempt: 1,
      logs: ['[00:00.300] Bounded sleep: 800ms', '[00:01.100] Sleep timer resolved'],
      started_at: new Date(Date.now() - 119500).toISOString(),
      completed_at: new Date(Date.now() - 118700).toISOString(),
    };
    const nr5 = {
      id: 'nr-sample-5',
      run_id: sampleRunId,
      node_id: 'node_http_vip',
      node_type: 'http',
      status: 'completed',
      input: nr2.output,
      output: { status: 200, data: { status: 'authorized', priority: 'VIP' } },
      error: null,
      attempt: 1,
      logs: ['[00:01.150] POST https://httpbin.org/post with JSON payload', '[00:01.350] HTTP 200 OK received in 200ms'],
      started_at: new Date(Date.now() - 118650).toISOString(),
      completed_at: completed,
    };
    const nr6 = {
      id: 'nr-sample-6',
      run_id: sampleRunId,
      node_id: 'node_http_standard',
      node_type: 'http',
      status: 'skipped',
      input: {},
      output: null,
      error: null,
      attempt: 1,
      logs: ['[00:00.250] Pruned from execution tree: Condition evaluated to TRUE branch'],
      started_at: new Date(Date.now() - 119600).toISOString(),
      completed_at: new Date(Date.now() - 119600).toISOString(),
    };

    [nr1, nr2, nr3, nr4, nr5, nr6].forEach(n => mem.nodeRuns.set(n.id, n));
  }

  // Pre-seed a Dead Letter to demonstrate Section 06 RECOVER
  const sampleDeadLetterId = 'dlq-demo-item-01';
  if (!mem.deadLetters.has(sampleDeadLetterId)) {
    mem.deadLetters.set(sampleDeadLetterId, {
      id: sampleDeadLetterId,
      run_id: 'run-failed-sample-02',
      node_run_id: 'nr-failed-sample-02',
      workflow_id: 'wf-resilient-etl-03',
      node_id: 'node_fetch_batch',
      node_name: 'Fetch Upstream Batch',
      payload: { source: 'etl_pipeline', batch: 991, retriesExhausted: true },
      failure: 'HTTP 503: Upstream Service Unavailable (Connection timeout after 3 attempts with exponential backoff)',
      attempts: 3,
      replay_state: 'pending',
      created_at: new Date(Date.now() - 600000).toISOString(),
      updated_at: new Date(Date.now() - 600000).toISOString(),
    });
  }
}

/* ── Init ─────────────────────────────────────────────────────── */
export async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  No DATABASE_URL – using in-memory store');
    useInMemory = true;
    seedInitialData();
    return;
  }
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
    await pool.query('SELECT 1');
    await migrate();
    console.log('✅  PostgreSQL connected');
  } catch (err) {
    console.warn('⚠️  PostgreSQL unavailable, using in-memory store:', err.message);
    useInMemory = true;
    pool = null;
    seedInitialData();
  }
}

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workflows (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name            VARCHAR(255)  NOT NULL,
      description     TEXT          DEFAULT '',
      nodes           JSONB         NOT NULL DEFAULT '[]',
      edges           JSONB         NOT NULL DEFAULT '[]',
      trigger_type    VARCHAR(50)   DEFAULT 'manual',
      cron_expression VARCHAR(100),
      is_active       BOOLEAN       DEFAULT TRUE,
      created_at      TIMESTAMPTZ   DEFAULT NOW(),
      updated_at      TIMESTAMPTZ   DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS runs (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id  UUID         REFERENCES workflows(id) ON DELETE CASCADE,
      status       VARCHAR(50)  DEFAULT 'pending',
      trigger_type VARCHAR(50)  DEFAULT 'manual',
      input_data   JSONB        DEFAULT '{}',
      started_at   TIMESTAMPTZ  DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      error        TEXT
    );

    CREATE TABLE IF NOT EXISTS node_runs (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id       UUID        REFERENCES runs(id) ON DELETE CASCADE,
      node_id      VARCHAR(255) NOT NULL,
      node_type    VARCHAR(50),
      status       VARCHAR(50)  DEFAULT 'pending',
      input        JSONB        DEFAULT '{}',
      output       JSONB,
      error        TEXT,
      attempt      INTEGER      DEFAULT 1,
      logs         JSONB        DEFAULT '[]',
      started_at   TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS dead_letters (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id       UUID        REFERENCES runs(id) ON DELETE CASCADE,
      node_run_id  UUID        REFERENCES node_runs(id) ON DELETE CASCADE,
      workflow_id  UUID        REFERENCES workflows(id) ON DELETE CASCADE,
      node_id      VARCHAR(255) NOT NULL,
      node_name    VARCHAR(255),
      payload      JSONB        DEFAULT '{}',
      failure      TEXT,
      attempts     INTEGER      DEFAULT 1,
      replay_state VARCHAR(50)  DEFAULT 'pending',
      created_at   TIMESTAMPTZ  DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  DEFAULT NOW()
    );
  `);
}

/* ── DB interface (same API regardless of backend) ────────────── */
export const db = {

  /* Workflows */
  async listWorkflows() {
    if (useInMemory) {
      return [...mem.workflows.values()].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at));
    }
    const { rows } = await pool.query(
      `SELECT * FROM workflows ORDER BY created_at DESC`);
    return rows;
  },

  async getWorkflow(id) {
    if (useInMemory) return mem.workflows.get(id) || null;
    const { rows } = await pool.query(`SELECT * FROM workflows WHERE id=$1`, [id]);
    return rows[0] || null;
  },

  async createWorkflow(data) {
    if (useInMemory) {
      const wf = {
        id: data.id || randomUUID(),
        name: data.name,
        description: data.description || '',
        nodes: data.nodes || [],
        edges: data.edges || [],
        trigger_type: data.trigger_type || 'manual',
        cron_expression: data.cron_expression || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        created_at: now(),
        updated_at: now(),
      };
      mem.workflows.set(wf.id, wf);
      return wf;
    }
    const { rows } = await pool.query(
      `INSERT INTO workflows (name,description,nodes,edges,trigger_type,cron_expression,is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.name, data.description || '', JSON.stringify(data.nodes || []),
       JSON.stringify(data.edges || []), data.trigger_type || 'manual',
       data.cron_expression || null, data.is_active !== undefined ? data.is_active : true]);
    return rows[0];
  },

  async updateWorkflow(id, data) {
    if (useInMemory) {
      const existing = mem.workflows.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, id, updated_at: now() };
      mem.workflows.set(id, updated);
      return updated;
    }
    const fields = [];
    const values = [];
    let i = 1;
    const allowed = ['name','description','nodes','edges','trigger_type','cron_expression','is_active'];
    for (const key of allowed) {
      if (key in data) {
        fields.push(`${key}=$${i++}`);
        values.push(
          (key === 'nodes' || key === 'edges') ? JSON.stringify(data[key]) : data[key]
        );
      }
    }
    if (!fields.length) return db.getWorkflow(id);
    fields.push(`updated_at=NOW()`);
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE workflows SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, values);
    return rows[0] || null;
  },

  async deleteWorkflow(id) {
    if (useInMemory) {
      mem.workflows.delete(id);
      return;
    }
    await pool.query(`DELETE FROM workflows WHERE id=$1`, [id]);
  },

  /* Runs */
  async listRuns(workflowId, { limit = 50, offset = 0 } = {}) {
    if (useInMemory) {
      const all = [...mem.runs.values()]
        .filter(r => !workflowId || r.workflow_id === workflowId)
        .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
      return paginate(all, limit, offset);
    }
    const { rows } = await pool.query(
      `SELECT * FROM runs WHERE ($1::uuid IS NULL OR workflow_id=$1)
       ORDER BY started_at DESC LIMIT $2 OFFSET $3`,
      [workflowId || null, limit, offset]);
    return rows;
  },

  async getRun(id) {
    if (useInMemory) return mem.runs.get(id) || null;
    const { rows } = await pool.query(`SELECT * FROM runs WHERE id=$1`, [id]);
    return rows[0] || null;
  },

  async createRun(data) {
    if (useInMemory) {
      const run = {
        id: data.id || randomUUID(),
        workflow_id: data.workflow_id,
        status: data.status || 'pending',
        trigger_type: data.trigger_type || 'manual',
        input_data: data.input_data || {},
        started_at: now(),
        completed_at: null,
        error: null,
      };
      mem.runs.set(run.id, run);
      return run;
    }
    const { rows } = await pool.query(
      `INSERT INTO runs (workflow_id, trigger_type, input_data)
       VALUES ($1,$2,$3) RETURNING *`,
      [data.workflow_id, data.trigger_type || 'manual',
       JSON.stringify(data.input_data || {})]);
    return rows[0];
  },

  async updateRun(id, data) {
    if (useInMemory) {
      const existing = mem.runs.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, id };
      mem.runs.set(id, updated);
      return updated;
    }
    const { rows } = await pool.query(
      `UPDATE runs SET status=$1, completed_at=$2, error=$3 WHERE id=$4 RETURNING *`,
      [data.status, data.completed_at || null, data.error || null, id]);
    return rows[0] || null;
  },

  async cancelRun(id) {
    return db.updateRun(id, {
      status: 'cancelled',
      completed_at: now(),
      error: 'Execution cancelled by user',
    });
  },

  /* Node Runs */
  async listNodeRuns(runId) {
    if (useInMemory) {
      return [...mem.nodeRuns.values()]
        .filter(nr => nr.run_id === runId)
        .sort((a, b) => (new Date(a.started_at || 0) - new Date(b.started_at || 0)));
    }
    const { rows } = await pool.query(
      `SELECT * FROM node_runs WHERE run_id=$1 ORDER BY started_at ASC`, [runId]);
    return rows;
  },

  async createNodeRun(data) {
    if (useInMemory) {
      const nr = {
        id: data.id || randomUUID(),
        run_id:      data.run_id,
        node_id:     data.node_id,
        node_type:   data.node_type,
        status:      'pending',
        input:       data.input || {},
        output:      null,
        error:       null,
        attempt:     data.attempt || 1,
        logs:        data.logs || [],
        started_at:  null,
        completed_at: null,
      };
      mem.nodeRuns.set(nr.id, nr);
      return nr;
    }
    const { rows } = await pool.query(
      `INSERT INTO node_runs (run_id,node_id,node_type,input,attempt,logs)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [data.run_id, data.node_id, data.node_type,
       JSON.stringify(data.input || {}), data.attempt || 1,
       JSON.stringify(data.logs || [])]);
    return rows[0];
  },

  async updateNodeRun(id, data) {
    if (useInMemory) {
      const existing = mem.nodeRuns.get(id);
      if (!existing) return null;
      const updated = {
        ...existing,
        ...data,
        logs: data.logs !== undefined ? data.logs : existing.logs,
        id,
      };
      mem.nodeRuns.set(id, updated);
      return updated;
    }
    const { rows } = await pool.query(
      `UPDATE node_runs SET status=$1, output=$2, error=$3, started_at=$4, completed_at=$5, logs=$6
       WHERE id=$7 RETURNING *`,
      [data.status, JSON.stringify(data.output || null),
       data.error || null, data.started_at || null,
       data.completed_at || null, JSON.stringify(data.logs || []), id]);
    return rows[0] || null;
  },

  /* Dead Letters (DLQ Recovery - Class Diagram & Abstract 06) */
  async listDeadLetters({ replayState } = {}) {
    if (useInMemory) {
      const list = [...mem.deadLetters.values()];
      const filtered = replayState ? list.filter(dl => dl.replay_state === replayState) : list;
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    const query = replayState
      ? `SELECT * FROM dead_letters WHERE replay_state=$1 ORDER BY created_at DESC`
      : `SELECT * FROM dead_letters ORDER BY created_at DESC`;
    const params = replayState ? [replayState] : [];
    const { rows } = await pool.query(query, params);
    return rows;
  },

  async getDeadLetter(id) {
    if (useInMemory) return mem.deadLetters.get(id) || null;
    const { rows } = await pool.query(`SELECT * FROM dead_letters WHERE id=$1`, [id]);
    return rows[0] || null;
  },

  async createDeadLetter(data) {
    if (useInMemory) {
      const dl = {
        id: randomUUID(),
        run_id:       data.run_id,
        node_run_id:  data.node_run_id,
        workflow_id:  data.workflow_id,
        node_id:      data.node_id,
        node_name:    data.node_name || data.node_id,
        payload:      data.payload || {},
        failure:      data.failure || 'Unknown failure',
        attempts:     data.attempts || 1,
        replay_state: 'pending',
        created_at:   now(),
        updated_at:   now(),
      };
      mem.deadLetters.set(dl.id, dl);
      return dl;
    }
    const { rows } = await pool.query(
      `INSERT INTO dead_letters (run_id, node_run_id, workflow_id, node_id, node_name, payload, failure, attempts, replay_state)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [data.run_id, data.node_run_id, data.workflow_id, data.node_id,
       data.node_name || data.node_id, JSON.stringify(data.payload || {}),
       data.failure, data.attempts || 1, 'pending']);
    return rows[0];
  },

  async updateDeadLetter(id, data) {
    if (useInMemory) {
      const existing = mem.deadLetters.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updated_at: now() };
      mem.deadLetters.set(id, updated);
      return updated;
    }
    const fields = [];
    const values = [];
    let i = 1;
    for (const [k, v] of Object.entries(data)) {
      fields.push(`${k}=$${i++}`);
      values.push(k === 'payload' ? JSON.stringify(v) : v);
    }
    fields.push(`updated_at=NOW()`);
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE dead_letters SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, values);
    return rows[0] || null;
  },

  async discardDeadLetter(id) {
    return db.updateDeadLetter(id, { replay_state: 'discarded' });
  },

  /* Platform Statistics */
  async getStats() {
    const workflows = await db.listWorkflows();
    const runs = await db.listRuns(null, { limit: 500 });
    const deadLetters = await db.listDeadLetters();

    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter(w => w.is_active).length;
    const cronCount = workflows.filter(w => w.trigger_type === 'cron' && w.is_active).length;
    const totalRuns = runs.length;
    const completedRuns = runs.filter(r => r.status === 'completed').length;
    const failedRuns = runs.filter(r => r.status === 'failed').length;
    const runningRuns = runs.filter(r => r.status === 'running').length;
    const dlqPending = deadLetters.filter(dl => dl.replay_state === 'pending').length;
    const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 100;

    return {
      totalWorkflows,
      activeWorkflows,
      cronCount,
      totalRuns,
      completedRuns,
      failedRuns,
      runningRuns,
      dlqPending,
      totalDeadLetters: deadLetters.length,
      successRate,
      engine: 'NODEVERSE / ORCHANOVA DAG Engine',
      workers: 'Distributed Worker Queue (BullMQ / Async Inline)',
      teamId: '390',
    };
  },
};
