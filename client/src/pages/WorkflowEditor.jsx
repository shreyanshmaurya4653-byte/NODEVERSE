import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Save,
  Play,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Trash2,
  X,
  Zap,
  Globe,
  Code2,
  GitBranch,
  Clock,
  Send,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Layers,
  Sparkles,
  Terminal,
  Activity,
  Maximize2,
  LayoutGrid,
  ExternalLink,
  Compass,
  Bot,
  Share2,
  MessageSquare,
  Database,
  Mail,
  CreditCard,
  FileSpreadsheet,
  ShoppingBag,
} from 'lucide-react';
import { api } from '../api/index.js';
import { nodeTypes } from '../components/nodes/index.jsx';

/* ── Platform Preset Configurations for Any Website/Platform ─ */
const PLATFORM_PRESETS = {
  custom: {
    label: 'Custom REST API / Any Website',
    url: 'https://api.example.com/v1/resource',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: '',
  },
  openai: {
    label: 'OpenAI (ChatGPT / GPT-4)',
    url: 'https://api.openai.com/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
    },
    body: '{\n  "model": "gpt-4o-mini",\n  "messages": [\n    {"role": "user", "content": "Analyze data: {{input.data}}"}\n  ]\n}',
  },
  discord: {
    label: 'Discord Channel Webhook',
    url: 'https://discord.com/api/webhooks/YOUR_WEBHOOK_URL',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{\n  "content": "🚀 **NodeVerse Alert**: Pipeline completed for {{input.orderId}}",\n  "username": "NodeVerse Bot"\n}',
  },
  slack: {
    label: 'Slack Incoming Webhook',
    url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{\n  "text": "Notification: New automated event received -> {{input.status}}"\n}',
  },
  github: {
    label: 'GitHub REST API (Issues / Actions)',
    url: 'https://api.github.com/repos/OWNER/REPO/issues',
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token YOUR_GITHUB_TOKEN',
      'User-Agent': 'NodeVerse-Automation',
    },
    body: '{\n  "title": "Automated Alert: {{input.title}}",\n  "body": "Triggered automatically from NodeVerse DAG pipeline."\n}',
  },
  stripe: {
    label: 'Stripe Payments & Invoicing',
    url: 'https://api.stripe.com/v1/payment_intents',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_test_YOUR_STRIPE_KEY',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'amount={{input.amount}}&currency=usd',
  },
  sheets: {
    label: 'Google Sheets API',
    url: 'https://sheets.googleapis.com/v4/spreadsheets/SPREADSHEET_ID/values/Sheet1!A1:append?valueInputOption=USER_ENTERED',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json',
    },
    body: '{\n  "values": [["{{input.orderId}}", "{{input.amount}}", "processed"]]\n}',
  },
  shopify: {
    label: 'Shopify Store Admin API',
    url: 'https://YOUR_STORE.myshopify.com/admin/api/2024-01/orders.json',
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': 'YOUR_SHOPIFY_ACCESS_TOKEN',
      'Content-Type': 'application/json',
    },
    body: '',
  },
  telegram: {
    label: 'Telegram Bot Broadcast',
    url: 'https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{\n  "chat_id": "YOUR_CHAT_ID",\n  "text": "🚨 NodeVerse Pipeline Alert: {{input.message}}"\n}',
  },
  email: {
    label: 'SendGrid / Resend Email API',
    url: 'https://api.resend.com/emails',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer re_YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: '{\n  "from": "alerts@yourdomain.com",\n  "to": ["user@example.com"],\n  "subject": "Automated NodeVerse Alert",\n  "html": "<strong>Status:</strong> Execution finished successfully."\n}',
  },
  supabase: {
    label: 'Supabase / PostgreSQL REST',
    url: 'https://YOUR_PROJECT.supabase.co/rest/v1/records',
    method: 'POST',
    headers: {
      'apikey': 'YOUR_ANON_KEY',
      'Authorization': 'Bearer YOUR_ANON_KEY',
      'Content-Type': 'application/json',
    },
    body: '{\n  "payload": "{{input}}",\n  "source": "NodeVerse"\n}',
  },
};

/* ── Node Palette Definitions (Automate Any Website or Platform) */
const PALETTE_CATEGORIES = [
  {
    category: 'Triggers & Inbound',
    items: [
      {
        type: 'trigger',
        label: 'Webhook Trigger',
        desc: 'Inbound HTTP POST from any website/app',
        icon: Zap,
        color: '#a855f7',
        defaultData: { triggerType: 'webhook', label: 'Webhook Trigger' },
      },
      {
        type: 'trigger',
        label: 'Cron Schedule',
        desc: 'Time-based periodic execution',
        icon: Clock,
        color: '#a855f7',
        defaultData: { triggerType: 'cron', cronExpression: '*/5 * * * *', label: 'Cron Trigger' },
      },
      {
        type: 'trigger',
        label: 'Manual Trigger',
        desc: 'Run on-demand from Studio',
        icon: Zap,
        color: '#a855f7',
        defaultData: { triggerType: 'manual', label: 'Manual Trigger' },
      },
    ],
  },
  {
    category: 'Web & Website Automations',
    items: [
      {
        type: 'scraper',
        label: 'Universal Web Scraper',
        desc: 'Scrape & extract content from ANY website',
        icon: Compass,
        color: '#06b6d4',
        defaultData: {
          url: 'https://news.ycombinator.com',
          label: 'Scrape Website',
          extractMode: 'all',
          maxRetries: 2,
        },
      },
      {
        type: 'http',
        label: 'Universal HTTP / REST',
        desc: 'Connect to any API or web endpoint',
        icon: Globe,
        color: '#06b6d4',
        defaultData: {
          method: 'GET',
          url: 'https://httpbin.org/get',
          label: 'HTTP Request',
          maxRetries: 2,
          baseDelayMs: 500,
        },
      },
    ],
  },
  {
    category: 'Platform & App Connectors',
    items: [
      {
        type: 'app_connector',
        label: 'OpenAI / ChatGPT',
        desc: 'AI text analysis, summary & agents',
        icon: Bot,
        color: '#10b981',
        defaultData: {
          platform: 'openai',
          label: 'OpenAI Completion',
          ...PLATFORM_PRESETS.openai,
        },
      },
      {
        type: 'app_connector',
        label: 'Discord Webhook',
        desc: 'Post alerts & embeds to Discord channels',
        icon: Share2,
        color: '#5865f2',
        defaultData: {
          platform: 'discord',
          label: 'Discord Alert',
          ...PLATFORM_PRESETS.discord,
        },
      },
      {
        type: 'app_connector',
        label: 'Slack Message',
        desc: 'Send messages to Slack channels or users',
        icon: MessageSquare,
        color: '#4a154b',
        defaultData: {
          platform: 'slack',
          label: 'Slack Notification',
          ...PLATFORM_PRESETS.slack,
        },
      },
      {
        type: 'app_connector',
        label: 'GitHub Integration',
        desc: 'Automate issues, PRs & repo workflows',
        icon: Bot,
        color: '#f43f5e',
        defaultData: {
          platform: 'github',
          label: 'GitHub Action',
          ...PLATFORM_PRESETS.github,
        },
      },
      {
        type: 'app_connector',
        label: 'Stripe Payments',
        desc: 'Process payments & customer data',
        icon: CreditCard,
        color: '#6366f1',
        defaultData: {
          platform: 'stripe',
          label: 'Stripe Payment',
          ...PLATFORM_PRESETS.stripe,
        },
      },
      {
        type: 'app_connector',
        label: 'Google Sheets',
        desc: 'Append, read & sync spreadsheet rows',
        icon: FileSpreadsheet,
        color: '#10b981',
        defaultData: {
          platform: 'sheets',
          label: 'Google Sheets Append',
          ...PLATFORM_PRESETS.sheets,
        },
      },
      {
        type: 'app_connector',
        label: 'Shopify Store',
        desc: 'Sync orders, inventory & customers',
        icon: ShoppingBag,
        color: '#95bf47',
        defaultData: {
          platform: 'shopify',
          label: 'Shopify Sync',
          ...PLATFORM_PRESETS.shopify,
        },
      },
      {
        type: 'app_connector',
        label: 'Telegram Bot',
        desc: 'Broadcast alerts to Telegram channels',
        icon: Send,
        color: '#229ed9',
        defaultData: {
          platform: 'telegram',
          label: 'Telegram Alert',
          ...PLATFORM_PRESETS.telegram,
        },
      },
      {
        type: 'app_connector',
        label: 'Email (SMTP / Resend)',
        desc: 'Send automated transactional emails',
        icon: Mail,
        color: '#f59e0b',
        defaultData: {
          platform: 'email',
          label: 'Send Email',
          ...PLATFORM_PRESETS.email,
        },
      },
      {
        type: 'app_connector',
        label: 'Supabase / PostgreSQL',
        desc: 'Query & insert database records',
        icon: Database,
        color: '#3ecf8e',
        defaultData: {
          platform: 'supabase',
          label: 'Supabase Sync',
          ...PLATFORM_PRESETS.supabase,
        },
      },
    ],
  },
  {
    category: 'Logic & Flow Control',
    items: [
      {
        type: 'transform',
        label: 'Transform (JS)',
        desc: 'Reshape, map, or compute values',
        icon: Code2,
        color: '#fbbf24',
        defaultData: {
          expression: '({\n  ...input,\n  timestamp: Date.now(),\n  processed: true\n})',
          label: 'Transform Data',
        },
      },
      {
        type: 'condition',
        label: 'Condition (If/Else)',
        desc: 'Branch into TRUE or FALSE paths',
        icon: GitBranch,
        color: '#10b981',
        defaultData: {
          expression: 'input.status === 200 || input.amount >= 100',
          label: 'Branch Condition',
        },
      },
      {
        type: 'delay',
        label: 'Delay / Sleep',
        desc: 'Pause execution for N ms',
        icon: Clock,
        color: '#ec4899',
        defaultData: {
          delayMs: 1000,
          label: 'Delay Timer',
        },
      },
      {
        type: 'webhook_out',
        label: 'Notification / Outbound',
        desc: 'Broadcast message to any webhook',
        icon: Send,
        color: '#6366f1',
        defaultData: {
          channel: 'general-alerts',
          message: 'Notification from workflow: {{input.orderId}}',
          label: 'Broadcast Notification',
        },
      },
    ],
  },
];

let nodeIdCounter = 1;
function newNodeId(type) {
  return `node_${type}_${Date.now().toString().slice(-4)}_${nodeIdCounter++}`;
}

/* ── Pre-packaged Workflow Templates with Generous Spacing ───── */
const QUICK_TEMPLATES = [
  {
    name: 'E-Commerce Order Verification',
    nodes: [
      { id: 't_trig', type: 'trigger', position: { x: 60, y: 160 }, data: { label: 'Order Webhook', triggerType: 'webhook' } },
      { id: 't_trans', type: 'transform', position: { x: 400, y: 160 }, data: { label: 'Normalize Order', expression: '({\n  orderId: input?.orderId || "ORD-5541",\n  amount: Number(input?.amount || 250),\n  isVip: (input?.amount || 250) >= 200\n})' } },
      { id: 't_cond', type: 'condition', position: { x: 740, y: 160 }, data: { label: 'VIP Amount >= 200?', expression: 'input.amount >= 200' } },
      { id: 't_delay', type: 'delay', position: { x: 1080, y: 60 }, data: { label: 'Priority Delay', delayMs: 600 } },
      { id: 't_http_vip', type: 'http', position: { x: 1420, y: 60 }, data: { label: 'Notify VIP Queue', method: 'POST', url: 'https://httpbin.org/post' } },
      { id: 't_http_std', type: 'http', position: { x: 1080, y: 320 }, data: { label: 'Standard Fulfillment', method: 'POST', url: 'https://httpbin.org/post' } },
    ],
    edges: [
      { id: 'e1', source: 't_trig', target: 't_trans', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } },
      { id: 'e2', source: 't_trans', target: 't_cond', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } },
      { id: 'e3', source: 't_cond', sourceHandle: 'true', target: 't_delay', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
      { id: 'e4', source: 't_delay', target: 't_http_vip', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } },
      { id: 'e5', source: 't_cond', sourceHandle: 'false', target: 't_http_std', animated: true, style: { stroke: '#f43f5e', strokeWidth: 2 } },
    ],
  },
  {
    name: 'Uptime Sentinel & SLA Monitor',
    nodes: [
      { id: 'u_cron', type: 'trigger', position: { x: 60, y: 160 }, data: { label: 'Every 5 Mins', triggerType: 'cron', cronExpression: '*/5 * * * *' } },
      { id: 'u_http', type: 'http', position: { x: 400, y: 160 }, data: { label: 'Ping Telemetry Endpoint', method: 'GET', url: 'https://httpbin.org/json', maxRetries: 3 } },
      { id: 'u_trans', type: 'transform', position: { x: 740, y: 160 }, data: { label: 'Analyze Latency', expression: '({\n  status: input?.status || 200,\n  healthy: (input?.status || 200) === 200,\n  checkedAt: new Date().toISOString()\n})' } },
      { id: 'u_alert', type: 'webhook_out', position: { x: 1080, y: 160 }, data: { label: 'Dispatch Heartbeat', channel: 'infra-monitoring', message: 'Uptime check OK' } },
    ],
    edges: [
      { id: 'ue1', source: 'u_cron', target: 'u_http', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } },
      { id: 'ue2', source: 'u_http', target: 'u_trans', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } },
      { id: 'ue3', source: 'u_trans', target: 'u_alert', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } },
    ],
  },
];

/* ── Node Inspector / Config Drawer (Slide-Over) ─────────────── */
function NodeConfigDrawer({ node, onUpdate, onDelete, onClose, lastNodeRun }) {
  const [data, setData] = useState(node.data || {});
  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    setData(node.data || {});
  }, [node.id, node.data]);

  const setField = (key, value) => {
    const updated = { ...data, [key]: value };
    setData(updated);
    onUpdate(node.id, updated);
  };

  return (
    <aside className="editor-inspector-slideover">
      {/* Header */}
      <div className="inspector-header">
        <div className="inspector-title-wrap">
          <span className="inspector-badge">{node.type.toUpperCase()}</span>
          <h3>{data.label || 'Node Properties'}</h3>
        </div>
        <button className="btn-icon-ghost" onClick={onClose} title="Close Inspector">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="inspector-tabs">
        <button
          className={`inspector-tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          Parameters
        </button>
        <button
          className={`inspector-tab ${activeTab === 'resilience' ? 'active' : ''}`}
          onClick={() => setActiveTab('resilience')}
        >
          Retries
        </button>
        <button
          className={`inspector-tab ${activeTab === 'io' ? 'active' : ''}`}
          onClick={() => setActiveTab('io')}
        >
          I/O Preview
        </button>
        <button
          className={`inspector-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Logs {lastNodeRun?.logs?.length ? `(${lastNodeRun.logs.length})` : ''}
        </button>
      </div>

      {/* Tab Content */}
      <div className="inspector-body">
        {activeTab === 'config' && (
          <div className="form-stack">
            <div className="form-group">
              <label>Node Name / Label</label>
              <input
                value={data.label || ''}
                onChange={e => setField('label', e.target.value)}
                placeholder="Descriptive label"
              />
            </div>

            {node.type === 'trigger' && (
              <>
                <div className="form-group">
                  <label>Trigger Mode</label>
                  <select
                    value={data.triggerType || 'manual'}
                    onChange={e => setField('triggerType', e.target.value)}
                  >
                    <option value="manual">Manual Trigger (On-Demand)</option>
                    <option value="webhook">Inbound HTTP Webhook</option>
                    <option value="cron">Cron Schedule</option>
                  </select>
                </div>

                {data.triggerType === 'cron' && (
                  <div className="form-group">
                    <label>Cron Expression (5-part)</label>
                    <input
                      value={data.cronExpression || ''}
                      onChange={e => setField('cronExpression', e.target.value)}
                      placeholder="*/5 * * * *"
                      className="mono-input"
                    />
                    <span className="field-hint">e.g. */5 * * * * (Every 5 mins)</span>
                  </div>
                )}

                {data.triggerType === 'webhook' && (
                  <div className="info-callout">
                    <Zap size={14} />
                    <span>Inbound webhook URL: <code>/webhooks/:workflowId</code></span>
                  </div>
                )}

                {/* ── Configurable Inbound / Test Payload ────────── */}
                <div className="form-group" style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ margin: 0 }}>Trigger Inbound Payload (JSON)</label>
                    <button
                      type="button"
                      className="btn-ghost btn-xs"
                      onClick={() => setField('payload', '{\n  "websiteUrl": "https://news.ycombinator.com",\n  "project": "Website Monitor",\n  "checkTime": "' + new Date().toLocaleTimeString() + '"\n}')}
                      style={{ fontSize: '0.72rem', color: '#c084fc', padding: '2px 8px', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                    >
                      + Fill Sample Website URL
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={typeof data.payload === 'object' ? JSON.stringify(data.payload, null, 2) : (data.payload || '')}
                    onChange={e => setField('payload', e.target.value)}
                    placeholder='{\n  "websiteUrl": "https://example.com",\n  "project": "Demo"\n}'
                    className="mono-input"
                  />
                  <span className="field-hint">
                    Write your test or default payload here. Downstream nodes can dynamically read <code>{'{{input.websiteUrl}}'}</code>.
                  </span>
                </div>
              </>
            )}

            {/* ── Universal Web Scraper Configuration ──────── */}
            {node.type === 'scraper' && (
              <>
                <div className="form-group">
                  <label>Target Website URL to Scrape</label>
                  <input
                    value={data.url || ''}
                    onChange={e => setField('url', e.target.value)}
                    placeholder="https://example.com or {{input.targetUrl}}"
                  />
                  <span className="field-hint">Automate ANY website. Extracts HTML title, meta tags, headings & links.</span>
                </div>
                <div className="form-group">
                  <label>Content Extraction Target</label>
                  <select
                    value={data.extractMode || 'all'}
                    onChange={e => setField('extractMode', e.target.value)}
                  >
                    <option value="all">Full Extraction (Title, Meta, Headings, Links)</option>
                    <option value="headings">Headings & Text (h1-h3 tags)</option>
                    <option value="links">Hyperlinks & URLs</option>
                  </select>
                </div>
                <div className="info-callout" style={{ borderColor: 'rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.08)' }}>
                  <Compass size={14} style={{ color: '#22d3ee' }} />
                  <span>Output is forwarded as JSON to downstream Transform & Condition nodes.</span>
                </div>
              </>
            )}

            {/* ── HTTP & Platform Connector Configuration ────── */}
            {(node.type === 'http' || node.type === 'app_connector') && (
              <>
                <div className="form-group">
                  <label>Platform Preset (Automate Any Platform)</label>
                  <select
                    value={data.platform || 'custom'}
                    onChange={e => {
                      const p = e.target.value;
                      const preset = PLATFORM_PRESETS[p] || PLATFORM_PRESETS.custom;
                      setField('platform', p);
                      setField('url', preset.url);
                      setField('method', preset.method);
                      setField('headers', preset.headers);
                      if (preset.body) setField('body', preset.body);
                    }}
                  >
                    <option value="custom">🌐 Custom REST API / Any Website</option>
                    <option value="openai">🤖 OpenAI (ChatGPT / GPT-4)</option>
                    <option value="discord">💬 Discord Channel Webhook</option>
                    <option value="slack">💼 Slack Incoming Webhook</option>
                    <option value="github">🐙 GitHub REST API (Issues/PRs)</option>
                    <option value="stripe">💳 Stripe Payments & Checkout</option>
                    <option value="sheets">📊 Google Sheets API</option>
                    <option value="shopify">🛍️ Shopify Admin API</option>
                    <option value="telegram">📱 Telegram Bot Broadcast</option>
                    <option value="email">📬 SendGrid / Resend Email API</option>
                    <option value="supabase">⚡ Supabase / PostgreSQL REST</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>HTTP Method</label>
                  <select
                    value={data.method || 'GET'}
                    onChange={e => setField('method', e.target.value)}
                  >
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Endpoint / Webhook URL</label>
                  <input
                    value={data.url || ''}
                    onChange={e => setField('url', e.target.value)}
                    placeholder="https://api.example.com/items/{{input.id}}"
                  />
                  <span className="field-hint">Supports dynamic variables: <code>{'{{input.orderId}}'}</code></span>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ margin: 0 }}>Request Headers (JSON / Cookies)</label>
                    <button
                      type="button"
                      className="btn-ghost btn-xs"
                      onClick={() => setField('headers', '{\n  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",\n  "Cookie": "YOUR_FLIPKART_COOKIE_HERE"\n}')}
                      style={{ fontSize: '0.72rem', color: '#c084fc', padding: '2px 8px', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                    >
                      + Fill Sample Cookie Header
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={typeof data.headers === 'object' ? JSON.stringify(data.headers, null, 2) : (data.headers || '')}
                    onChange={e => setField('headers', e.target.value)}
                    placeholder='{\n  "Cookie": "YOUR_COOKIE",\n  "Authorization": "Bearer TOKEN"\n}'
                    className="mono-input"
                  />
                  <span className="field-hint">Paste your session cookies or auth tokens here (sent with both GET & POST).</span>
                </div>

                {['POST', 'PUT', 'PATCH'].includes((data.method || 'GET').toUpperCase()) && (
                  <div className="form-group">
                    <label>Request Body (JSON / Payload)</label>
                    <textarea
                      rows={5}
                      value={typeof data.body === 'object' ? JSON.stringify(data.body, null, 2) : (data.body || '')}
                      onChange={e => setField('body', e.target.value)}
                      placeholder='{\n  "orderId": "{{input.orderId}}"\n}'
                      className="mono-input"
                    />
                  </div>
                )}
              </>
            )}

            {node.type === 'transform' && (
              <div className="form-group">
                <label>JavaScript Expression (input = upstream data)</label>
                <textarea
                  rows={6}
                  value={data.expression || ''}
                  onChange={e => setField('expression', e.target.value)}
                  placeholder="({ ...input, processed: true })"
                  className="mono-input"
                />
                <span className="field-hint">Returns an object or array. Standard ES6 supported.</span>
              </div>
            )}

            {node.type === 'condition' && (
              <div className="form-group">
                <label>Branch Condition (Returns Boolean)</label>
                <textarea
                  rows={4}
                  value={data.expression || ''}
                  onChange={e => setField('expression', e.target.value)}
                  placeholder="input.amount >= 200 && input.status === 'valid'"
                  className="mono-input"
                />
                <div className="branch-legend">
                  <span className="branch-tag branch-tag-true">✔ TRUE branch: Left handle</span>
                  <span className="branch-tag branch-tag-false">✖ FALSE branch: Right handle</span>
                </div>
              </div>
            )}

            {node.type === 'delay' && (
              <div className="form-group">
                <label>Delay Duration (Milliseconds)</label>
                <input
                  type="number"
                  min={50}
                  max={30000}
                  step={100}
                  value={data.delayMs || 1000}
                  onChange={e => setField('delayMs', Number(e.target.value))}
                />
                <span className="field-hint">Sleeps for specified duration before next node runs.</span>
              </div>
            )}

            {node.type === 'webhook_out' && (
              <>
                <div className="form-group">
                  <label>Channel / Target Name</label>
                  <input
                    value={data.channel || ''}
                    onChange={e => setField('channel', e.target.value)}
                    placeholder="slack-alerts or discord-ops"
                  />
                </div>
                <div className="form-group">
                  <label>Message Payload Template</label>
                  <textarea
                    rows={3}
                    value={data.message || ''}
                    onChange={e => setField('message', e.target.value)}
                    placeholder="Alert: Status is {{input.status}}"
                    className="mono-input"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'resilience' && (
          <div className="form-stack">
            <div className="form-group">
              <label>Max Retry Attempts</label>
              <input
                type="number"
                min={0}
                max={5}
                value={data.maxRetries || 0}
                onChange={e => setField('maxRetries', Number(e.target.value))}
              />
              <span className="field-hint">Exhausted retries route directly into Dead-Letter Queue (DLQ).</span>
            </div>
            <div className="form-group">
              <label>Base Delay (ms)</label>
              <input
                type="number"
                min={100}
                max={5000}
                step={100}
                value={data.baseDelayMs || 500}
                onChange={e => setField('baseDelayMs', Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Max Backoff Delay (ms)</label>
              <input
                type="number"
                min={500}
                max={30000}
                step={500}
                value={data.maxDelayMs || 8000}
                onChange={e => setField('maxDelayMs', Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {activeTab === 'io' && (
          <div className="form-stack">
            <div className="form-group">
              <label>Node Input (Upstream Payload)</label>
              <pre className="json-preview-box">
                {lastNodeRun?.input
                  ? JSON.stringify(lastNodeRun.input, null, 2)
                  : '// No execution input recorded yet'}
              </pre>
            </div>
            <div className="form-group">
              <label>Node Output</label>
              <pre className="json-preview-box">
                {lastNodeRun?.output
                  ? JSON.stringify(lastNodeRun.output, null, 2)
                  : '// No execution output recorded yet'}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="form-stack">
            <label>Timestamped Node Logs</label>
            <div className="node-log-stream">
              {lastNodeRun?.logs && lastNodeRun.logs.length > 0 ? (
                lastNodeRun.logs.map((log, i) => (
                  <div key={i} className="log-line">{log}</div>
                ))
              ) : (
                <div className="log-empty">Run the workflow to view real-time execution logs.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="inspector-footer">
        <button
          className="btn btn-danger btn-sm"
          style={{ width: '100%' }}
          onClick={() => onDelete(node.id)}
        >
          <Trash2 size={14} /> Delete Node
        </button>
      </div>
    </aside>
  );
}

/* ── Inner Canvas Component with ReactFlow Instance ──────────── */
function WorkflowEditorInner() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isNew    = id === 'new' || !id;

  const { fitView } = useReactFlow();

  const [workflow,      setWorkflow]      = useState(null);
  const [workflowName,  setWorkflowName]  = useState('New Automation DAG');
  const [nodes,         setNodes, onNodesChange] = useNodesState([]);
  const [edges,         setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode,  setSelectedNode]  = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [running,       setRunning]       = useState(false);
  const [activeRunId,   setActiveRunId]   = useState(null);
  const [runSnapshot,   setRunSnapshot]   = useState(null);
  const [toast,         setToast]         = useState(null);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [paletteOpen,   setPaletteOpen]   = useState(true);
  const [bottomOpen,    setBottomOpen]    = useState(false);
  const [liveLogs,      setLiveLogs]      = useState([]);
  const [dagValidation, setDagValidation] = useState({ valid: true, message: 'Valid DAG' });

  const canvasRef = useRef(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* Validate Graph whenever nodes or edges mutate */
  useEffect(() => {
    if (nodes.length === 0) {
      setDagValidation({ valid: true, message: 'Empty canvas' });
      return;
    }
    const cleanNodes = nodes.map(n => ({ id: n.id, type: n.type }));
    const cleanEdges = edges.map(e => ({ source: e.source, target: e.target }));

    api.validateGraph(cleanNodes, cleanEdges)
      .then(res => setDagValidation(res))
      .catch(() => setDagValidation({ valid: false, message: 'Validation error' }));
  }, [nodes, edges]);

  /* Load existing workflow */
  useEffect(() => {
    if (isNew) return;
    api.getWorkflow(id)
      .then(wf => {
        setWorkflow(wf);
        setWorkflowName(wf.name);
        const ns = (Array.isArray(wf.nodes) ? wf.nodes : JSON.parse(wf.nodes || '[]'))
          .map(n => ({ ...n, data: { ...n.data, status: undefined, durationMs: undefined } }));
        const es = (Array.isArray(wf.edges) ? wf.edges : JSON.parse(wf.edges || '[]'))
          .map(e => {
            const isTrue = e.sourceHandle === 'true';
            const isFalse = e.sourceHandle === 'false';
            const color = isTrue ? '#10b981' : isFalse ? '#f43f5e' : (e.style?.stroke || '#a855f7');
            return {
              ...e,
              animated: true,
              label: e.label || (isTrue ? 'True' : isFalse ? 'False' : undefined),
              labelStyle: { fill: color, fontWeight: 700, fontSize: 11 },
              style: { stroke: color, strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color },
            };
          });
        setNodes(ns);
        setEdges(es);
        setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 150);
      })
      .catch(err => showToast(err.message, 'error'));
  }, [id, isNew, fitView]);

  /* Edge connection */
  const onConnect = useCallback(params => {
    const isTrue = params.sourceHandle === 'true';
    const isFalse = params.sourceHandle === 'false';
    const color = isTrue ? '#10b981' : isFalse ? '#f43f5e' : '#a855f7';

    setEdges(eds =>
      addEdge(
        {
          ...params,
          animated: true,
          label: isTrue ? 'True' : isFalse ? 'False' : undefined,
          labelStyle: { fill: color, fontWeight: 700, fontSize: 11 },
          style: { stroke: color, strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        },
        eds
      )
    );
  }, [setEdges]);

  /* 1-Click / Double-Click to Delete Connection Line */
  const onEdgeDoubleClick = useCallback((_, edge) => {
    setEdges(eds => eds.filter(e => e.id !== edge.id));
    showToast('Connection line deleted', 'info');
  }, [setEdges]);

  /* Drag & Drop Node Creation */
  const onDragOver = useCallback(e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(e => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('application/nodeverse-node');
    if (!rawData || !canvasRef.current) return;

    try {
      const { type, defaultData } = JSON.parse(rawData);
      const bounds = canvasRef.current.getBoundingClientRect();
      const position = {
        x: Math.max(40, e.clientX - bounds.left - 120),
        y: Math.max(40, e.clientY - bounds.top - 50),
      };

      const newNode = {
        id: newNodeId(type),
        type,
        position,
        data: { ...defaultData },
      };

      setNodes(ns => [...ns, newNode]);
      setSelectedNode(newNode);
    } catch { /* ignore */ }
  }, [setNodes]);

  /* Click to Add node */
  const handleAddNodeFromPalette = (item) => {
    const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x), 60);
    const newNode = {
      id: newNodeId(item.type),
      type: item.type,
      position: { x: maxX + 320, y: 160 + (nodes.length % 3) * 60 },
      data: { ...item.defaultData },
    };
    setNodes(ns => [...ns, newNode]);
    setSelectedNode(newNode);
  };

  /* Auto-Layout / Tidy Nodes Function */
  const handleAutoLayout = () => {
    if (nodes.length === 0) return;
    const inDegree = new Map(nodes.map(n => [n.id, 0]));
    const adj = new Map(nodes.map(n => [n.id, []]));

    for (const e of edges) {
      if (adj.has(e.source)) adj.get(e.source).push(e.target);
      if (inDegree.has(e.target)) inDegree.set(e.target, inDegree.get(e.target) + 1);
    }

    const levels = new Map();
    const queue = [];

    nodes.forEach(n => {
      if (inDegree.get(n.id) === 0) {
        queue.push(n.id);
        levels.set(n.id, 0);
      }
    });

    while (queue.length) {
      const curr = queue.shift();
      const currLevel = levels.get(curr) || 0;
      for (const next of (adj.get(curr) || [])) {
        const nextLevel = Math.max(levels.get(next) || 0, currLevel + 1);
        levels.set(next, nextLevel);
        const nd = inDegree.get(next) - 1;
        inDegree.set(next, nd);
        if (nd === 0) queue.push(next);
      }
    }

    const levelGroups = new Map();
    nodes.forEach(n => {
      const lvl = levels.get(n.id) || 0;
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
      levelGroups.get(lvl).push(n);
    });

    setNodes(ns =>
      ns.map(n => {
        const lvl = levels.get(n.id) || 0;
        const group = levelGroups.get(lvl) || [n];
        const idx = group.findIndex(x => x.id === n.id);
        return {
          ...n,
          position: {
            x: 80 + lvl * 340,
            y: 120 + idx * 160,
          },
        };
      })
    );

    setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 100);
    showToast('Canvas nodes neatly aligned', 'info');
  };

  /* Selection Handlers */
  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const onUpdateNodeData = useCallback((nodeId, newData) => {
    setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data: newData } : n));
    setSelectedNode(sel => sel?.id === nodeId ? { ...sel, data: newData } : sel);
  }, [setNodes]);

  const onDeleteNode = useCallback((nodeId) => {
    setNodes(ns => ns.filter(n => n.id !== nodeId));
    setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  /* Save Workflow */
  const handleSave = async () => {
    if (!dagValidation.valid) {
      showToast('Cannot save: graph contains a cycle!', 'error');
      return;
    }
    setSaving(true);
    try {
      const cleanNodes = nodes.map(n => ({
        ...n,
        data: { ...n.data, status: undefined, durationMs: undefined },
      }));

      const triggerNode = nodes.find(n => n.type === 'trigger');
      const trigger_type = triggerNode?.data?.triggerType || 'manual';
      const cron_expression = triggerNode?.data?.cronExpression || null;

      const payload = {
        name: workflowName,
        nodes: cleanNodes,
        edges,
        trigger_type,
        cron_expression,
        is_active: true,
      };

      if (isNew) {
        const created = await api.createWorkflow(payload);
        setWorkflow(created);
        navigate(`/editor/${created.id}`, { replace: true });
        showToast('Workflow created successfully!', 'success');
      } else {
        const updated = await api.updateWorkflow(id, payload);
        setWorkflow(updated);
        showToast('Workflow saved!', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* Run Workflow + SSE Streaming */
  const handleRun = async () => {
    if (!workflow) {
      showToast('Please save workflow before executing', 'error');
      return;
    }
    if (!dagValidation.valid) {
      showToast('Cannot execute: Graph contains a cycle!', 'error');
      return;
    }

    setRunning(true);
    setBottomOpen(true);
    setLiveLogs([`[00:00.000] Initiating run for workflow: ${workflow.name}`]);

    setNodes(ns => ns.map(n => ({
      ...n,
      data: { ...n.data, status: 'pending', durationMs: undefined },
    })));

    try {
      // Auto-save current canvas before execution so newly connected edges are immediately executed
      const cleanNodes = nodes.map(n => ({
        ...n,
        data: { ...n.data, status: undefined, durationMs: undefined },
      }));
      const triggerNode = nodes.find(n => n.type === 'trigger');
      const trigger_type = triggerNode?.data?.triggerType || 'manual';
      const cron_expression = triggerNode?.data?.cronExpression || null;

      await api.updateWorkflow(workflow.id, {
        name: workflowName,
        nodes: cleanNodes,
        edges,
        trigger_type,
        cron_expression,
      });

      // Collect payload from trigger node if specified
      let triggerPayload = { initiatedVia: 'Studio UI', timestamp: Date.now() };
      if (triggerNode?.data?.payload) {
        try {
          const parsed = typeof triggerNode.data.payload === 'string'
            ? JSON.parse(triggerNode.data.payload)
            : triggerNode.data.payload;
          triggerPayload = { ...triggerPayload, ...parsed };
        } catch {
          triggerPayload.raw = triggerNode.data.payload;
        }
      }

      const run = await api.triggerWorkflow(workflow.id, triggerPayload);
      setActiveRunId(run.id);
      showToast(`Execution started: ${run.id.slice(0, 8)}`, 'info');

      const es = api.streamRun(run.id);

      es.addEventListener('snapshot', e => {
        const { run: snapRun, nodeRuns } = JSON.parse(e.data);
        setRunSnapshot({ run: snapRun, nodeRuns });
        if (nodeRuns) applyNodeRuns(nodeRuns);
      });

      es.addEventListener('node_update', e => {
        const nr = JSON.parse(e.data);
        setLiveLogs(prev => [
          ...prev,
          `[${nr.node_type?.toUpperCase()}] ${nr.node_id} -> ${nr.status.toUpperCase()}`,
          ...(nr.logs || []).slice(-1),
        ]);

        setNodes(ns => ns.map(n => {
          if (n.id === nr.node_id) {
            const start = nr.started_at ? new Date(nr.started_at).getTime() : 0;
            const end   = nr.completed_at ? new Date(nr.completed_at).getTime() : 0;
            const durationMs = start && end ? Math.max(1, end - start) : undefined;
            return {
              ...n,
              data: { ...n.data, status: nr.status, durationMs },
            };
          }
          return n;
        }));

        // Dynamic Edge Color Transitions (Green for active completed, dashed grey for skipped)
        setEdges(es => es.map(edge => {
          if (edge.target === nr.node_id) {
            if (nr.status === 'completed') {
              return {
                ...edge,
                animated: false,
                style: { ...edge.style, stroke: '#10b981', strokeWidth: 3, filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
              };
            }
            if (nr.status === 'skipped') {
              return {
                ...edge,
                animated: false,
                style: { ...edge.style, stroke: '#475569', strokeWidth: 1.5, opacity: 0.35, strokeDasharray: '4 4' },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
              };
            }
          }
          return edge;
        }));

        setRunSnapshot(prev => {
          if (!prev) return prev;
          const updatedRuns = prev.nodeRuns ? [...prev.nodeRuns] : [];
          const idx = updatedRuns.findIndex(x => x.id === nr.id);
          if (idx >= 0) updatedRuns[idx] = nr;
          else updatedRuns.push(nr);
          return { ...prev, nodeRuns: updatedRuns };
        });
      });

      es.addEventListener('run_update', e => {
        const r = JSON.parse(e.data);
        setRunSnapshot(prev => ({ ...prev, run: r }));
        if (['completed', 'failed', 'cancelled'].includes(r.status)) {
          showToast(
            `Execution ${r.status.toUpperCase()}`,
            r.status === 'completed' ? 'success' : 'error'
          );
          setLiveLogs(prev => [
            ...prev,
            `[FINISHED] Execution marked ${r.status.toUpperCase()}${r.error ? ` (${r.error})` : ''}`,
          ]);
          es.close();
          setRunning(false);
        }
      });

      es.onerror = () => {
        es.close();
        setRunning(false);
      };
    } catch (err) {
      showToast(err.message, 'error');
      setRunning(false);
    }
  };

  const applyNodeRuns = (nodeRuns) => {
    const map = {};
    for (const nr of nodeRuns) {
      const start = nr.started_at ? new Date(nr.started_at).getTime() : 0;
      const end   = nr.completed_at ? new Date(nr.completed_at).getTime() : 0;
      map[nr.node_id] = {
        status: nr.status,
        durationMs: start && end ? Math.max(1, end - start) : undefined,
      };
    }
    setNodes(ns => ns.map(n => ({
      ...n,
      data: {
        ...n.data,
        status: map[n.id]?.status,
        durationMs: map[n.id]?.durationMs,
      },
    })));
  };

  /* Load Quick Template */
  const handleLoadTemplate = (tpl) => {
    setWorkflowName(tpl.name);
    const ns = tpl.nodes.map(n => ({ ...n, data: { ...n.data } }));
    const es = tpl.edges.map(e => ({
      ...e,
      animated: true,
      style: { stroke: '#a855f7', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
    }));
    setNodes(ns);
    setEdges(es);
    setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 150);
    showToast(`Loaded "${tpl.name}" template`, 'info');
  };

  /* Export Workflow JSON */
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      name: workflowName,
      nodes,
      edges,
    }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${workflowName.toLowerCase().replace(/\s+/g, '_')}.json`);
    dlAnchor.click();
    showToast('Workflow JSON exported', 'success');
  };

  /* Import Workflow JSON */
  const handleImportJson = (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges) || parsed.nodes.length === 0) {
          throw new Error('The file must contain at least one node and an edges array');
        }

        const importedIds = new Set();
        for (const node of parsed.nodes) {
          if (
            !node ||
            typeof node.id !== 'string' ||
            !node.id ||
            typeof node.type !== 'string' ||
            !node.type ||
            !Number.isFinite(node.position?.x) ||
            !Number.isFinite(node.position?.y) ||
            importedIds.has(node.id)
          ) {
            throw new Error('The file contains an invalid or duplicate node');
          }
          importedIds.add(node.id);
        }

        for (const edge of parsed.edges) {
          if (
            !edge ||
            typeof edge.source !== 'string' ||
            typeof edge.target !== 'string' ||
            !importedIds.has(edge.source) ||
            !importedIds.has(edge.target)
          ) {
            throw new Error('The file contains an edge connected to a missing node');
          }
        }

        const existingIds = new Set(nodes.map(node => node.id));
        const existingEdgeIds = new Set(edges.map(edge => edge.id).filter(Boolean));
        const idMap = new Map();
        const importedNodes = parsed.nodes.map(node => {
          let id = node.id;
          while (existingIds.has(id)) id = newNodeId(node.type);
          existingIds.add(id);
          idMap.set(node.id, id);
          return {
            ...node,
            id,
            data: { ...node.data, status: undefined, durationMs: undefined },
          };
        });

        const importedEdges = parsed.edges.map(edge => {
          let id = edge.id;
          if (id) {
            while (existingEdgeIds.has(id)) id = `${edge.id}_${newNodeId('edge')}`;
            existingEdgeIds.add(id);
          }
          return {
            ...edge,
            ...(id ? { id } : {}),
            source: idMap.get(edge.source),
            target: idMap.get(edge.target),
          };
        });

        const minX = Math.min(...importedNodes.map(node => node.position.x));
        const maxExistingX = nodes.reduce(
          (max, node) => Math.max(max, node.position?.x ?? 0),
          0
        );
        const offsetX = nodes.length ? maxExistingX + 340 - minX : 0;
        const appendedNodes = importedNodes.map(node => ({
          ...node,
          position: { ...node.position, x: node.position.x + offsetX },
        }));

        setNodes(current => [...current, ...appendedNodes]);
        setEdges(current => [...current, ...importedEdges]);
        if (nodes.length === 0 && parsed.name) setWorkflowName(parsed.name);
        setSelectedNode(null);
        setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 150);
        showToast(`Imported ${appendedNodes.length} node(s) into the studio`, 'success');
      } catch (error) {
        showToast(error.message || 'Invalid JSON file format', 'error');
      }
    };
    reader.onerror = () => showToast('Could not read the selected JSON file', 'error');
    reader.readAsText(file);
  };

  /* Filter palette items */
  const filteredPalette = useMemo(() => {
    if (!paletteSearch.trim()) return PALETTE_CATEGORIES;
    const term = paletteSearch.toLowerCase();
    return PALETTE_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(i =>
        i.label.toLowerCase().includes(term) || i.desc.toLowerCase().includes(term)
      ),
    })).filter(cat => cat.items.length > 0);
  }, [paletteSearch]);

  const lastSelectedNodeRun = runSnapshot?.nodeRuns?.find(
    nr => nr.node_id === selectedNode?.id
  );

  return (
    <div className="studio-root">
      {/* ── Top Studio Header Bar (Full-Width, Never Overflows) ── */}
      <header className="studio-topbar-integrated">
        {/* Left: Navigation & Title */}
        <div className="topbar-left-zone">
          <button className="topbar-icon-button" onClick={() => navigate('/')} title="Back to Workflows">
            <ArrowLeft size={16} />
            <span className="button-text">Workflows</span>
          </button>
          <div className="topbar-divider" />
          <input
            className="topbar-workflow-title-input"
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
            placeholder="Workflow Name"
            title="Click to edit workflow name"
          />
          {/* DAG Validation Badge */}
          <div
            className={`topbar-dag-pill ${dagValidation.valid ? 'is-valid' : 'is-invalid'}`}
            title={dagValidation.message}
          >
            {dagValidation.valid ? (
              <>
                <CheckCircle size={13} />
                <span>Valid DAG</span>
              </>
            ) : (
              <>
                <AlertCircle size={13} />
                <span>Cycle Detected</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Canvas Utilities */}
        <div className="topbar-center-zone">
          <button className="topbar-icon-button" onClick={handleAutoLayout} title="Auto-Align Nodes">
            <LayoutGrid size={15} />
            <span>Tidy Layout</span>
          </button>
          <button className="topbar-icon-button" onClick={() => fitView({ padding: 0.25, duration: 300 })} title="Fit View to Screen">
            <Maximize2 size={15} />
            <span>Fit View</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="topbar-right-zone">
          {/* Quick Template Switcher */}
          <div className="dropdown-wrap">
            <button
              className="topbar-icon-button"
              onClick={() => handleLoadTemplate(QUICK_TEMPLATES[0])}
              title="Load E-Commerce Template"
            >
              <Sparkles size={14} />
              <span>Templates</span>
            </button>
          </div>

          <button className="topbar-icon-button" onClick={handleExportJson} title="Export JSON">
            <Download size={15} />
          </button>

          <label className="topbar-icon-button" title="Import JSON" style={{ cursor: 'pointer', margin: 0 }}>
            <Upload size={15} />
            <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
          </label>

          <button
            className="btn btn-ghost btn-sm"
            onClick={handleSave}
            disabled={saving || !dagValidation.valid}
          >
            {saving ? <span className="spin-fast">◌</span> : <Save size={14} />}
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleRun}
            disabled={running || isNew || !dagValidation.valid}
          >
            {running ? <span className="spin-fast">◌</span> : <Play size={14} />}
            <span>{running ? 'Running...' : 'Execute'}</span>
          </button>
        </div>
      </header>

      {/* ── Studio Canvas & Drawers ───────────────────────────── */}
      <div className="studio-canvas-container">
        {/* Left Palette Sidebar */}
        <aside className={`studio-palette-dock ${paletteOpen ? 'open' : 'collapsed'}`}>
          <div className="palette-dock-header">
            {paletteOpen && (
              <div className="palette-dock-title">
                <Layers size={15} />
                <span>Node Palette</span>
              </div>
            )}
            <button
              className="palette-toggle-button"
              onClick={() => setPaletteOpen(!paletteOpen)}
              title={paletteOpen ? 'Collapse Palette' : 'Expand Palette'}
            >
              {paletteOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          {paletteOpen && (
            <>
              <div className="palette-search-container">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter nodes..."
                  value={paletteSearch}
                  onChange={e => setPaletteSearch(e.target.value)}
                />
              </div>

              <div className="palette-scroll-content">
                {filteredPalette.map((category) => (
                  <div key={category.category} className="palette-group">
                    <div className="palette-group-heading">{category.category}</div>
                    <div className="palette-group-items">
                      {category.items.map((item, idx) => {
                        const ItemIcon = item.icon;
                        return (
                          <div
                            key={idx}
                            className="palette-item-chip"
                            draggable
                            onDragStart={e => {
                              e.dataTransfer.setData(
                                'application/nodeverse-node',
                                JSON.stringify(item)
                              );
                            }}
                            onClick={() => handleAddNodeFromPalette(item)}
                            title="Drag onto canvas or click to add"
                          >
                            <div className="palette-chip-icon" style={{ background: `${item.color}22`, color: item.color }}>
                              <ItemIcon size={15} />
                            </div>
                            <div className="palette-chip-info">
                              <span className="palette-chip-name">{item.label}</span>
                              <span className="palette-chip-desc">{item.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* Central Canvas */}
        <main className="studio-main-canvas" ref={canvasRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background variant="dots" gap={22} size={1} color="rgba(255, 255, 255, 0.08)" />
            <Controls showInteractive={false} position="bottom-left" />
            <MiniMap
              nodeColor={n => {
                const map = {
                  trigger: '#a855f7',
                  http: '#06b6d4',
                  transform: '#fbbf24',
                  condition: '#10b981',
                  delay: '#ec4899',
                  webhook_out: '#6366f1',
                };
                return map[n.type] || '#5a5a7a';
              }}
              position="bottom-right"
              maskColor="rgba(8, 8, 17, 0.85)"
            />
          </ReactFlow>

          {/* Bottom Execution Log Drawer */}
          <div className={`studio-bottom-dock ${bottomOpen ? 'open' : 'closed'}`}>
            <div className="bottom-dock-header" onClick={() => setBottomOpen(!bottomOpen)}>
              <div className="dock-header-left">
                <Terminal size={14} />
                <span>Execution Logs</span>
                {activeRunId && (
                  <span className="console-run-id">Run #{activeRunId.slice(0, 8)}</span>
                )}
                {runSnapshot?.run?.status && (
                  <span className={`badge badge-${runSnapshot.run.status}`}>
                    {runSnapshot.run.status.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="dock-header-right">
                {activeRunId && (
                  <button
                    className="btn-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/runs/${activeRunId}`);
                    }}
                  >
                    <ExternalLink size={12} /> View Full Telemetry
                  </button>
                )}
                <button className="btn-icon-ghost">
                  {bottomOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              </div>
            </div>

            {bottomOpen && (
              <div className="bottom-dock-content">
                <div className="console-log-scroll">
                  {liveLogs.length > 0 ? (
                    liveLogs.map((line, i) => (
                      <div key={i} className="console-log-line">{line}</div>
                    ))
                  ) : (
                    <div className="console-empty">Click "Execute" to observe live node state transitions and streaming telemetry.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Inspector Drawer (Slides over ONLY when a node is selected!) */}
        {selectedNode && (
          <NodeConfigDrawer
            node={selectedNode}
            onUpdate={onUpdateNodeData}
            onDelete={onDeleteNode}
            onClose={() => setSelectedNode(null)}
            lastNodeRun={lastSelectedNodeRun}
          />
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner />
    </ReactFlowProvider>
  );
}
