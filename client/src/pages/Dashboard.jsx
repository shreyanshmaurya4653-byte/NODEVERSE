import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Play,
  Trash2,
  Edit3,
  Copy,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../api/index.js';

/* ── Toast Helper ────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  return {
    toasts,
    success: m => add(m, 'success'),
    error:   m => add(m, 'error'),
    info:    m => add(m, 'info'),
  };
}

/* ── Create Workflow Modal ────────────────────────────────────── */
function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger_type: 'manual',
    cron_expression: '*/5 * * * *',
    template: 'blank',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await onCreate(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-container">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Create Workflow</h3>
            <p className="modal-subtitle">Design a directed acyclic automation graph</p>
          </div>
          <button className="btn-icon-ghost" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label>Workflow Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Order Processing & SLA Alert"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What business process or automation does this handle?"
            />
          </div>

          <div className="form-group">
            <label>Trigger Pattern</label>
            <select
              value={form.trigger_type}
              onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}
            >
              <option value="manual">Manual Trigger (Trigger via Studio / API)</option>
              <option value="webhook">Inbound Webhook (Event-Driven HTTP POST)</option>
              <option value="cron">Cron Schedule (Periodic Scheduled Timer)</option>
            </select>
          </div>

          {form.trigger_type === 'cron' && (
            <div className="form-group">
              <label>Cron Expression (5-Part)</label>
              <input
                value={form.cron_expression}
                onChange={e => setForm(f => ({ ...f, cron_expression: e.target.value }))}
                placeholder="*/5 * * * *"
                className="mono-input"
              />
              <span className="field-hint">e.g. */5 * * * * (Every 5 minutes)</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !form.name.trim()}
            >
              {loading ? <span className="spin-fast">◌</span> : <Plus size={14} />}
              <span>{loading ? 'Creating...' : 'Create & Open Canvas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Trigger Chip ─────────────────────────────────────────────── */
function TriggerChip({ type, cron }) {
  if (type === 'webhook') {
    return (
      <span className="trigger-chip trigger-chip-webhook">
        <Zap size={11} /> Webhook
      </span>
    );
  }
  if (type === 'cron') {
    return (
      <span className="trigger-chip trigger-chip-cron" title={cron || ''}>
        <Clock size={11} /> Cron {cron ? `(${cron})` : ''}
      </span>
    );
  }
  return (
    <span className="trigger-chip trigger-chip-manual">
      <Play size={11} /> Manual
    </span>
  );
}

/* ── Dashboard Page ───────────────────────────────────────────── */
export default function Dashboard() {
  const [workflows,   setWorkflows]   = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filterType,  setFilterType]  = useState('all');
  const [showModal,   setShowModal]   = useState(false);
  const [triggering,  setTriggering]  = useState(null);

  const navigate = useNavigate();
  const { toasts, ...toast } = useToast();

  const loadData = async () => {
    try {
      const [wfs, st] = await Promise.all([
        api.listWorkflows().catch(() => []),
        api.getStats().catch(() => null),
      ]);
      setWorkflows(Array.isArray(wfs) ? wfs : []);
      setStats(st);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (formData) => {
    const triggerNode = {
      id: 'node_trigger_1',
      type: 'trigger',
      position: { x: 100, y: 180 },
      data: {
        label: `${formData.trigger_type.toUpperCase()} Trigger`,
        triggerType: formData.trigger_type,
        cronExpression: formData.cron_expression,
      },
    };

    const transformNode = {
      id: 'node_transform_1',
      type: 'transform',
      position: { x: 420, y: 180 },
      data: {
        label: 'Transform & Prepare',
        expression: '({\n  received: input,\n  timestamp: Date.now()\n})',
      },
    };

    const edges = [
      { id: 'e1', source: 'node_trigger_1', target: 'node_transform_1', animated: true },
    ];

    const wf = await api.createWorkflow({
      name: formData.name,
      description: formData.description,
      trigger_type: formData.trigger_type,
      cron_expression: formData.trigger_type === 'cron' ? formData.cron_expression : null,
      nodes: [triggerNode, transformNode],
      edges,
    });

    setShowModal(false);
    navigate(`/editor/${wf.id}`);
  };

  const handleTrigger = async (wf) => {
    setTriggering(wf.id);
    try {
      const run = await api.triggerWorkflow(wf.id, { triggeredFrom: 'Dashboard', timestamp: Date.now() });
      toast.success(`Workflow triggered (Run ID: ${run.id.slice(0, 8)})`);
      navigate(`/runs/${run.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTriggering(null);
    }
  };

  const handleToggle = async (wf) => {
    try {
      const updated = await api.toggleWorkflow(wf.id);
      setWorkflows(prev => prev.map(w => w.id === wf.id ? updated : w));
      toast.info(`Workflow is now ${updated.is_active ? 'Active' : 'Paused'}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDuplicate = async (wf) => {
    try {
      const copy = await api.duplicateWorkflow(wf.id);
      setWorkflows(prev => [copy, ...prev]);
      toast.success('Workflow duplicated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (wf) => {
    if (!window.confirm(`Delete workflow "${wf.name}"?`)) return;
    try {
      await api.deleteWorkflow(wf.id);
      setWorkflows(prev => prev.filter(w => w.id !== wf.id));
      toast.success('Workflow deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredWorkflows = (Array.isArray(workflows) ? workflows : []).filter(wf => {
    const matchSearch =
      wf.name.toLowerCase().includes(search.toLowerCase()) ||
      (wf.description || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || wf.trigger_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="page-container">
      {/* ── Metric Cards Overview ─────────────────────────────── */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Workflows</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="stat-number">{stats?.totalWorkflows ?? workflows.length}</div>
          <div className="stat-sub">{stats?.activeWorkflows ?? workflows.filter(w => w.is_active).length} active in production</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Executions</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-number">{stats?.totalRuns ?? 0}</div>
          <div className="stat-sub">{stats?.runningRuns ?? 0} currently processing</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Engine Success Rate</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-number">{stats?.successRate ?? 100}%</div>
          <div className="stat-sub">Deterministic DAG execution</div>
        </div>

        <div
          className="stat-card stat-card-interactive"
          onClick={() => navigate('/dead-letters')}
          title="Click to view Dead-Letter Queue"
        >
          <div className="stat-header">
            <span className="stat-label">Dead-Letter Queue (DLQ)</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="stat-number">{stats?.dlqPending ?? 0}</div>
          <div className="stat-sub" style={{ color: '#f43f5e' }}>Exhausted retries pending replay →</div>
        </div>
      </section>

      {/* ── Workflows Header & Controls ───────────────────────── */}
      <section className="dashboard-section-header">
        <div>
          <h2 className="section-title">Automations & DAGs</h2>
          <p className="section-subtitle">Visual dependency graphs executed by the distributed worker engine</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/templates')}>
            <Sparkles size={14} /> Templates
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> New Workflow
          </button>
        </div>
      </section>

      {/* ── Filters & Search ──────────────────────────────────── */}
      <div className="controls-bar">
        <div className="search-input-wrap">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search workflows by name or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-chips-row">
          <button
            className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Workflows
          </button>
          <button
            className={`filter-chip ${filterType === 'webhook' ? 'active' : ''}`}
            onClick={() => setFilterType('webhook')}
          >
            ⚡ Webhook
          </button>
          <button
            className={`filter-chip ${filterType === 'cron' ? 'active' : ''}`}
            onClick={() => setFilterType('cron')}
          >
            ⏱ Scheduled
          </button>
          <button
            className={`filter-chip ${filterType === 'manual' ? 'active' : ''}`}
            onClick={() => setFilterType('manual')}
          >
            ▶ Manual
          </button>
        </div>
      </div>

      {/* ── Workflows Grid ────────────────────────────────────── */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading automation DAGs...</span>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="empty-state">
          <Layers size={40} style={{ color: 'var(--txt-m)', marginBottom: 12 }} />
          <h3>No workflows found</h3>
          <p>Create your first workflow or explore pre-built templates to get started.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setShowModal(true)}>
            <Plus size={14} /> Create Workflow
          </button>
        </div>
      ) : (
        <div className="workflows-grid">
          {filteredWorkflows.map((wf) => {
            const nodes = Array.isArray(wf.nodes) ? wf.nodes : JSON.parse(wf.nodes || '[]');
            const edges = Array.isArray(wf.edges) ? wf.edges : JSON.parse(wf.edges || '[]');
            const isTriggering = triggering === wf.id;

            return (
              <div key={wf.id} className="workflow-card">
                {/* Header */}
                <div className="workflow-card-top">
                  <TriggerChip type={wf.trigger_type} cron={wf.cron_expression} />
                  <div className="workflow-card-toggle">
                    <button
                      className={`active-toggle-btn ${wf.is_active ? 'is-active' : 'is-inactive'}`}
                      onClick={() => handleToggle(wf)}
                      title={wf.is_active ? 'Click to Pause' : 'Click to Activate'}
                    >
                      {wf.is_active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>

                {/* Title & Desc */}
                <h3 className="workflow-card-title" onClick={() => navigate(`/editor/${wf.id}`)}>
                  {wf.name}
                </h3>
                <p className="workflow-card-desc">
                  {wf.description || 'No description provided.'}
                </p>

                {/* DAG Topology Metrics */}
                <div className="workflow-card-meta">
                  <span className="meta-pill">
                    <strong>{nodes.length}</strong> Nodes
                  </span>
                  <span className="meta-pill">
                    <strong>{edges.length}</strong> Dependencies
                  </span>
                  {wf.trigger_type === 'webhook' && (
                    <span className="meta-pill" style={{ color: '#a855f7' }}>
                      POST Webhook
                    </span>
                  )}
                </div>

                {/* Card Actions */}
                <div className="workflow-card-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/editor/${wf.id}`)}
                    title="Open in Visual Canvas"
                  >
                    <Edit3 size={13} /> Canvas
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleTrigger(wf)}
                    disabled={isTriggering}
                    title="Trigger Run"
                  >
                    {isTriggering ? <span className="spin-fast">◌</span> : <Play size={13} />}
                    <span>Run</span>
                  </button>
                  <button
                    className="btn-icon-ghost"
                    onClick={() => handleDuplicate(wf)}
                    title="Duplicate Workflow"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    className="btn-icon-ghost danger-icon"
                    onClick={() => handleDelete(wf)}
                    title="Delete Workflow"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────────── */}
      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Toast */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
