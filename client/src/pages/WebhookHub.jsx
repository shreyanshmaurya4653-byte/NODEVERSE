import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Copy,
  Check,
  Send,
  ExternalLink,
  Terminal,
  Code,
  RotateCw,
  Play,
} from 'lucide-react';
import { api } from '../api/index.js';

const SAMPLE_PAYLOADS = {
  ecommerce: {
    orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    customer: 'Sarah Connor',
    email: 'sarah@cyberdyne.io',
    amount: 349.99,
    items: ['Neural Net Processor v2', 'Titanium Armature Kit'],
    currency: 'USD',
  },
  monitoring: {
    service: 'payment-gateway-us-east',
    status: 500,
    latencyMs: 1420,
    errorCount: 12,
    timestamp: new Date().toISOString(),
  },
  sensor: {
    deviceId: 'IOT-TEMP-084',
    readingC: 78.4,
    threshold: 65.0,
    location: 'Server Room B',
    alertLevel: 'CRITICAL',
  },
};

export default function WebhookHub() {
  const [workflows,      setWorkflows]      = useState([]);
  const [selectedWfId,   setSelectedWfId]   = useState('');
  const [payloadJson,    setPayloadJson]    = useState(JSON.stringify(SAMPLE_PAYLOADS.ecommerce, null, 2));
  const [copiedId,       setCopiedId]       = useState(null);
  const [sending,        setSending]        = useState(false);
  const [responseResult, setResponseResult] = useState(null);
  const [loading,        setLoading]        = useState(true);

  const navigate = useNavigate();

  const loadWorkflows = async () => {
    try {
      const data = await api.listWorkflows();
      const webhookWfs = data.filter(w => w.trigger_type === 'webhook');
      setWorkflows(webhookWfs);
      if (webhookWfs.length > 0 && !selectedWfId) {
        setSelectedWfId(webhookWfs[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const getWebhookUrl = (id) => `${window.location.origin}/webhooks/${id}`;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendTestWebhook = async () => {
    if (!selectedWfId) return;
    setSending(true);
    setResponseResult(null);

    let parsed;
    try {
      parsed = JSON.parse(payloadJson);
    } catch {
      setResponseResult({ ok: false, error: 'Invalid JSON payload. Check syntax.' });
      setSending(false);
      return;
    }

    try {
      const res = await api.sendWebhook(selectedWfId, parsed);
      setResponseResult({
        ok: true,
        status: 202,
        data: res,
        runId: res.runId,
      });
    } catch (err) {
      setResponseResult({ ok: false, error: err.message });
    } finally {
      setSending(false);
    }
  };

  const selectedWorkflow = workflows.find(w => w.id === selectedWfId);

  return (
    <div className="page-container">
      {/* ── Page Header ───────────────────────────────────────── */}
      <section className="dashboard-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 className="section-title">Webhook Hub & Simulator</h2>
            <span className="trigger-chip trigger-chip-webhook">Event-Driven Ingestion</span>
          </div>
          <p className="section-subtitle">
            External applications can trigger your DAGs by sending HTTP POST requests to these live endpoints.
          </p>
        </div>
      </section>

      <div className="webhook-hub-layout">
        {/* ── Left Column: Configured Endpoints ────────────────── */}
        <div className="webhook-endpoints-card">
          <h3 className="card-subheading">Configured Inbound Endpoints</h3>
          <p style={{ color: 'var(--txt-s)', fontSize: '0.85rem', marginBottom: 16 }}>
            Workflows listening for inbound HTTP POST triggers:
          </p>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="empty-state">
              <Zap size={32} style={{ color: 'var(--txt-m)', marginBottom: 8 }} />
              <h4>No Webhook Workflows Configured</h4>
              <p>Create a workflow with a Webhook Trigger to expose an endpoint here.</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => navigate('/editor/new')}
              >
                Create Webhook Workflow
              </button>
            </div>
          ) : (
            <div className="webhook-list">
              {workflows.map((wf) => {
                const url = getWebhookUrl(wf.id);
                const isSelected = selectedWfId === wf.id;
                const curlCmd = `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event":"checkout","amount":250}'`;

                return (
                  <div
                    key={wf.id}
                    className={`webhook-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedWfId(wf.id)}
                  >
                    <div className="webhook-item-header">
                      <strong>{wf.name}</strong>
                      <span className={`active-pill ${wf.is_active ? 'active' : 'inactive'}`}>
                        {wf.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <div className="webhook-url-bar">
                      <span className="method-tag">POST</span>
                      <code className="url-code">{url}</code>
                      <button
                        className="btn-icon-ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(url, `url_${wf.id}`);
                        }}
                        title="Copy Webhook URL"
                      >
                        {copiedId === `url_${wf.id}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div className="curl-sample">
                      <div className="curl-sample-top">
                        <span>cURL Command</span>
                        <button
                          className="btn-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(curlCmd, `curl_${wf.id}`);
                          }}
                        >
                          {copiedId === `curl_${wf.id}` ? 'Copied!' : 'Copy cURL'}
                        </button>
                      </div>
                      <pre>{curlCmd}</pre>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right Column: Interactive Simulator ─────────────── */}
        <div className="webhook-tester-card">
          <h3 className="card-subheading">Interactive Webhook Simulator</h3>
          <p style={{ color: 'var(--txt-s)', fontSize: '0.85rem', marginBottom: 16 }}>
            Send real HTTP test payloads directly into the distributed DAG engine and watch the execution:
          </p>

          <div className="form-stack">
            <div className="form-group">
              <label>Target Workflow</label>
              <select
                value={selectedWfId}
                onChange={e => setSelectedWfId(e.target.value)}
                disabled={workflows.length === 0}
              >
                {workflows.map(wf => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name} ({wf.id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Sample Presets */}
            <div className="form-group">
              <label>Load Sample Payload Preset</label>
              <div className="preset-buttons-row">
                <button
                  type="button"
                  className="preset-btn"
                  onClick={() => setPayloadJson(JSON.stringify(SAMPLE_PAYLOADS.ecommerce, null, 2))}
                >
                  🛒 E-Commerce Order
                </button>
                <button
                  type="button"
                  className="preset-btn"
                  onClick={() => setPayloadJson(JSON.stringify(SAMPLE_PAYLOADS.monitoring, null, 2))}
                >
                  📈 System Alert
                </button>
                <button
                  type="button"
                  className="preset-btn"
                  onClick={() => setPayloadJson(JSON.stringify(SAMPLE_PAYLOADS.sensor, null, 2))}
                >
                  🌡️ IoT Sensor
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>JSON Request Body</label>
              <textarea
                rows={9}
                value={payloadJson}
                onChange={e => setPayloadJson(e.target.value)}
                className="mono-input"
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleSendTestWebhook}
              disabled={sending || !selectedWfId}
            >
              {sending ? <span className="spin-fast">◌</span> : <Send size={15} />}
              <span>{sending ? 'Dispatching Webhook...' : 'Dispatch Webhook Event'}</span>
            </button>

            {/* Test Result Callout */}
            {responseResult && (
              <div className={`simulator-result-box ${responseResult.ok ? 'success' : 'error'}`}>
                {responseResult.ok ? (
                  <>
                    <div className="result-top">
                      <span className="result-status">HTTP 202 Accepted</span>
                      <span className="result-msg">Run successfully enqueued!</span>
                    </div>
                    <div className="result-run">
                      <span>Run ID:</span> <code>{responseResult.runId}</code>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: 10 }}
                      onClick={() => navigate(`/runs/${responseResult.runId}`)}
                    >
                      <ExternalLink size={13} /> View Live Execution Telemetry →
                    </button>
                  </>
                ) : (
                  <div className="result-error">
                    <strong>Error:</strong> {responseResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
