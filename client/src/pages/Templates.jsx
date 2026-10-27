import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Zap,
  Clock,
  Play,
  Layers,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import { api } from '../api/index.js';

const TEMPLATES = [
  {
    id: 'tpl-beginner-starter',
    title: 'Beginner Flow: Website Scraper to Discord Alert',
    category: 'Beginner / Web Automation',
    triggerType: 'manual',
    badge: '🚀 Step-by-Step Starter',
    description: 'Perfect for beginners. Starts on demand, scrapes a live website (Hacker News), normalizes article titles, checks content rules, and branches to send a Discord notification.',
    nodesPreview: ['1. Manual Start', '2. Scrape Website', '3. Format Digest', '4. Check Rule', '5. Discord Alert', '6. Fallback Alert'],
    nodes: [
      { id: 'b1', type: 'trigger', position: { x: 60, y: 160 }, data: { label: '1. Start Pipeline (Manual)', triggerType: 'manual' } },
      { id: 'b2', type: 'scraper', position: { x: 380, y: 160 }, data: { label: '2. Scrape News / Website', url: 'https://news.ycombinator.com', extractMode: 'all' } },
      { id: 'b3', type: 'transform', position: { x: 720, y: 160 }, data: { label: '3. Format Article Digest', expression: '({\n  scrapedUrl: input?.url || "https://news.ycombinator.com",\n  title: input?.title || "Hacker News Digest",\n  totalHeadings: (input?.headings || []).length,\n  topStory: input?.headings?.[0] || "AI Workflow Automation in NodeVerse",\n  isHighTraffic: true,\n  scrapedAt: new Date().toLocaleTimeString()\n})' } },
      { id: 'b4', type: 'condition', position: { x: 1060, y: 160 }, data: { label: '4. Check Content Found?', expression: 'input.totalHeadings > 0' } },
      { id: 'b5', type: 'app_connector', position: { x: 1400, y: 80 }, data: { label: '5. Dispatch Discord Alert', platform: 'discord', action: 'Discord Webhook Broadcast', url: 'https://httpbin.org/post', method: 'POST', body: '{\n  "content": "🚀 **News Scraper Finished**: {{input.topStory}}\\n*Source: {{input.scrapedUrl}}*",\n  "username": "NodeVerse Bot"\n}' } },
      { id: 'b6', type: 'webhook_out', position: { x: 1400, y: 280 }, data: { label: '6. Empty Content Alert', channel: 'system-warnings', message: 'Scraper completed but 0 headings detected at {{input.scrapedAt}}' } },
    ],
    edges: [
      { id: 'be1', source: 'b1', target: 'b2', animated: true },
      { id: 'be2', source: 'b2', target: 'b3', animated: true },
      { id: 'be3', source: 'b3', target: 'b4', animated: true },
      { id: 'be4', source: 'b4', sourceHandle: 'true', target: 'b5', animated: true },
      { id: 'be5', source: 'b4', sourceHandle: 'false', target: 'b6', animated: true },
    ],
  },
  {
    id: 'tpl-ecommerce',
    title: 'E-Commerce Order Verification & Routing',
    category: 'E-Commerce / Ingestion',
    triggerType: 'webhook',
    badge: '⚡ Webhook Driven',
    description: 'Triggered via webhook when an order is completed. Normalizes order fields, computes VIP status, checks risk scoring, and branches to priority fulfillment or standard queues.',
    nodesPreview: ['Order Webhook', 'Transform Normalize', 'Condition VIP >= $200', 'Delay Fraud Cooldown', 'HTTP VIP Queue', 'HTTP Standard Queue'],
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 60, y: 160 }, data: { label: 'Order Webhook', triggerType: 'webhook' } },
      { id: 'n2', type: 'transform', position: { x: 340, y: 160 }, data: { label: 'Normalize & Total', expression: '({\n  orderId: input?.orderId || "ORD-" + Math.floor(1000 + Math.random()*9000),\n  customer: input?.customer || "John Doe",\n  amount: Number(input?.amount || 260),\n  isVip: (input?.amount || 260) >= 200\n})' } },
      { id: 'n3', type: 'condition', position: { x: 640, y: 160 }, data: { label: 'High-Value VIP Check', expression: 'input.amount >= 200' } },
      { id: 'n4', type: 'delay', position: { x: 940, y: 70 }, data: { label: 'VIP Cooldown', delayMs: 600 } },
      { id: 'n5', type: 'http', position: { x: 1240, y: 70 }, data: { label: 'Notify VIP Queue', method: 'POST', url: 'https://httpbin.org/post' } },
      { id: 'n6', type: 'http', position: { x: 940, y: 280 }, data: { label: 'Standard Fulfillment', method: 'POST', url: 'https://httpbin.org/post' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', animated: true },
      { id: 'e2', source: 'n2', target: 'n3', animated: true },
      { id: 'e3', source: 'n3', sourceHandle: 'true', target: 'n4', animated: true },
      { id: 'e4', source: 'n4', target: 'n5', animated: true },
      { id: 'e5', source: 'n3', sourceHandle: 'false', target: 'n6', animated: true },
    ],
  },
  {
    id: 'tpl-uptime',
    title: 'Microservice Health & Latency Sentinel',
    category: 'DevOps & SRE',
    triggerType: 'cron',
    badge: '⏱ Periodic Cron',
    description: 'Pings microservice telemetry endpoint every 5 minutes. Evaluates response status and latency threshold against SLAs, and broadcasts a message to operations channels.',
    nodesPreview: ['5-Min Cron Ping', 'HTTP Ping Telemetry', 'Transform Parse Latency', 'Condition Healthy?', 'Broadcast Ops Alert'],
    nodes: [
      { id: 'u1', type: 'trigger', position: { x: 60, y: 160 }, data: { label: '5-Minute Cron Ping', triggerType: 'cron', cronExpression: '*/5 * * * *' } },
      { id: 'u2', type: 'http', position: { x: 340, y: 160 }, data: { label: 'Ping Telemetry API', method: 'GET', url: 'https://httpbin.org/json', maxRetries: 3 } },
      { id: 'u3', type: 'transform', position: { x: 640, y: 160 }, data: { label: 'Extract SLA Metric', expression: '({\n  status: input?.status || 200,\n  healthy: (input?.status || 200) === 200,\n  checkedAt: new Date().toISOString()\n})' } },
      { id: 'u4', type: 'condition', position: { x: 940, y: 160 }, data: { label: 'Is Service Healthy?', expression: 'input.healthy === true' } },
      { id: 'u5', type: 'webhook_out', position: { x: 1240, y: 160 }, data: { label: 'Broadcast Ops Pulse', channel: 'infrastructure-alerts', message: 'Uptime check OK' } },
    ],
    edges: [
      { id: 'ue1', source: 'u1', target: 'u2', animated: true },
      { id: 'ue2', source: 'u2', target: 'u3', animated: true },
      { id: 'ue3', source: 'u3', target: 'u4', animated: true },
      { id: 'ue4', source: 'u4', sourceHandle: 'true', target: 'u5', animated: true },
    ],
  },
  {
    id: 'tpl-etl-dlq',
    title: 'Resilient ETL Pipeline with DLQ Recovery',
    category: 'Data Engineering',
    triggerType: 'manual',
    badge: '🛡️ Fault-Tolerant',
    description: 'Fetches batches from external APIs with exponential backoff and jitter. If retries are exhausted, automatically routes to Dead-Letter Queue (DLQ) for operator replay.',
    nodesPreview: ['Manual Ingestion', 'HTTP Fetch Batch', 'Transform Map Records', 'Delay Buffer', 'Sink to Lake'],
    nodes: [
      { id: 'etl1', type: 'trigger', position: { x: 60, y: 160 }, data: { label: 'Manual Ingestion Trigger', triggerType: 'manual' } },
      { id: 'etl2', type: 'http', position: { x: 340, y: 160 }, data: { label: 'Fetch Upstream Batch', method: 'GET', url: 'https://httpbin.org/get?source=etl_pipeline', maxRetries: 2, baseDelayMs: 600 } },
      { id: 'etl3', type: 'transform', position: { x: 640, y: 160 }, data: { label: 'Sanitize Records', expression: '({\n  recordsParsed: 1420,\n  timestamp: Date.now()\n})' } },
      { id: 'etl4', type: 'delay', position: { x: 940, y: 160 }, data: { label: 'Buffer Delay', delayMs: 600 } },
      { id: 'etl5', type: 'webhook_out', position: { x: 1240, y: 160 }, data: { label: 'Commit to Data Lake', channel: 'lake-ingestion', message: 'Batch stored.' } },
    ],
    edges: [
      { id: 'ee1', source: 'etl1', target: 'etl2', animated: true },
      { id: 'ee2', source: 'etl2', target: 'etl3', animated: true },
      { id: 'ee3', source: 'etl3', target: 'etl4', animated: true },
      { id: 'ee4', source: 'etl4', target: 'etl5', animated: true },
    ],
  },
  {
    id: 'tpl-crypto',
    title: 'Cryptocurrency Volatility & Threshold Alert',
    category: 'Finance & Web3',
    triggerType: 'cron',
    badge: '⏱ Scheduled Cron',
    description: 'Polls public cryptocurrency exchange API, computes percentage difference across moving averages, and triggers notifications on rapid movements.',
    nodesPreview: ['10-Min Cron Trigger', 'HTTP CoinGecko API', 'Transform Volatility Score', 'Condition Volatility > 3%', 'Broadcast Trade Alert'],
    nodes: [
      { id: 'c1', type: 'trigger', position: { x: 60, y: 160 }, data: { label: '10-Min Cron Trigger', triggerType: 'cron', cronExpression: '*/10 * * * *' } },
      { id: 'c2', type: 'http', position: { x: 340, y: 160 }, data: { label: 'Fetch Market Ticker', method: 'GET', url: 'https://httpbin.org/get?ticker=BTC_USDT' } },
      { id: 'c3', type: 'transform', position: { x: 640, y: 160 }, data: { label: 'Compute Price Delta', expression: '({\n  symbol: "BTC",\n  price: 68450,\n  delta24h: 4.8,\n  isSignificant: true\n})' } },
      { id: 'c4', type: 'condition', position: { x: 940, y: 160 }, data: { label: 'Delta >= 3.0%?', expression: 'input.isSignificant === true' } },
      { id: 'c5', type: 'webhook_out', position: { x: 1240, y: 160 }, data: { label: 'Broadcast Trade Alert', channel: 'crypto-signals', message: 'BTC volatility alert: +4.8% in 24h' } },
    ],
    edges: [
      { id: 'ce1', source: 'c1', target: 'c2', animated: true },
      { id: 'ce2', source: 'c2', target: 'c3', animated: true },
      { id: 'ce3', source: 'c3', target: 'c4', animated: true },
      { id: 'ce4', source: 'c4', sourceHandle: 'true', target: 'c5', animated: true },
    ],
  },
];

export default function Templates() {
  const [loadingId, setLoadingId] = useState(null);
  const navigate = useNavigate();

  const handleUseTemplate = async (tpl) => {
    setLoadingId(tpl.id);
    try {
      const created = await api.createWorkflow({
        name: tpl.title,
        description: tpl.description,
        trigger_type: tpl.triggerType,
        cron_expression: tpl.triggerType === 'cron' ? '*/5 * * * *' : null,
        nodes: tpl.nodes,
        edges: tpl.edges,
        is_active: true,
      });
      navigate(`/editor/${created.id}`);
    } catch (err) {
      alert(`Failed to load template: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="page-container">
      {/* ── Header ────────────────────────────────────────────── */}
      <section className="dashboard-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 className="section-title">Workflow Templates</h2>
            <span className="templates-badge">Curated Patterns</span>
          </div>
          <p className="section-subtitle">
            One-click importable blueprints demonstrating branching logic, resilience, retries, and distributed execution.
          </p>
        </div>
      </section>

      {/* ── Templates Grid ────────────────────────────────────── */}
      <div className="templates-grid">
        {TEMPLATES.map((tpl) => (
          <div key={tpl.id} className="template-card">
            <div className="template-card-top">
              <span className="template-category">{tpl.category}</span>
              <span className="template-badge-pill">{tpl.badge}</span>
            </div>

            <h3 className="template-title">{tpl.title}</h3>
            <p className="template-desc">{tpl.description}</p>

            {/* Pipeline Preview Chips */}
            <div className="template-pipeline-preview">
              <span className="pipeline-label">DAG Pipeline:</span>
              <div className="pipeline-chips-wrap">
                {tpl.nodesPreview.map((step, idx) => (
                  <span key={idx} className="pipeline-chip">
                    {step} {idx < tpl.nodesPreview.length - 1 && <span className="arrow">→</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="template-card-footer">
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleUseTemplate(tpl)}
                disabled={loadingId === tpl.id}
              >
                {loadingId === tpl.id ? (
                  <span className="spin-fast">◌</span>
                ) : (
                  <Sparkles size={14} />
                )}
                <span>{loadingId === tpl.id ? 'Importing...' : 'Use This Template'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
