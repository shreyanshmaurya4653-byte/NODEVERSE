import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Workflow,
  History,
  ShieldAlert,
  Zap,
  Sparkles,
  ArrowRight,
  Play,
  Plus,
  Activity,
  CheckCircle2,
  Clock,
  Terminal,
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
  Trash2,
  Edit3,
  Copy,
  RotateCw,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { api } from '../api/index.js';

/* ── Toast Notification Helper ───────────────────────────────── */
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
              placeholder="Brief description of the pipeline..."
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Trigger Type</label>
              <select
                value={form.trigger_type}
                onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}
              >
                <option value="manual">⚡ Manual (On-demand)</option>
                <option value="webhook">🌐 Webhook (HTTP POST)</option>
                <option value="cron">⏱ Cron Schedule (Periodic)</option>
              </select>
            </div>

            {form.trigger_type === 'cron' && (
              <div className="form-group flex-1">
                <label>Cron Expression</label>
                <input
                  value={form.cron_expression}
                  onChange={e => setForm(f => ({ ...f, cron_expression: e.target.value }))}
                  placeholder="*/5 * * * *"
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Starting Blueprint</label>
            <div className="template-picker-grid">
              <label className={`tpl-option ${form.template === 'blank' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="template"
                  value="blank"
                  checked={form.template === 'blank'}
                  onChange={() => setForm(f => ({ ...f, template: 'blank' }))}
                />
                <div className="tpl-opt-title">Blank Canvas</div>
                <div className="tpl-opt-desc">Trigger + HTTP + Transform starter</div>
              </label>
              <label className={`tpl-option ${form.template === 'webhook_etl' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="template"
                  value="webhook_etl"
                  checked={form.template === 'webhook_etl'}
                  onChange={() => setForm(f => ({ ...f, template: 'webhook_etl' }))}
                />
                <div className="tpl-opt-title">Webhook ETL</div>
                <div className="tpl-opt-desc">Ingest, normalize, and forward</div>
              </label>
              <label className={`tpl-option ${form.template === 'cron_monitor' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="template"
                  value="cron_monitor"
                  checked={form.template === 'cron_monitor'}
                  onChange={() => setForm(f => ({ ...f, template: 'cron_monitor' }))}
                />
                <div className="tpl-opt-title">Cron Monitor</div>
                <div className="tpl-opt-desc">Ping API & alert on failure</div>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create & Open Studio →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ── MAIN WORKABLE CONSOLE COMPONENT ───────────────────────────
   ═══════════════════════════════════════════════════════════════ */
export default function AppConsole() {
  const navigate = useNavigate();
  const { toasts, ...toast } = useToast();

  const [stats, setStats] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [runningIds, setRunningIds] = useState(new Set());

  const fetchData = async () => {
    try {
      const [s, w, r] = await Promise.all([
        api.getStats().catch(() => null),
        api.listWorkflows().catch(() => []),
        api.listRuns(null, 50).catch(() => []),
      ]);
      setStats(s);
      setWorkflows(Array.isArray(w) ? w : []);
      setRecentRuns(Array.isArray(r) ? r.slice(0, 6) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  /* ── 1-Click Run Workflow ──────────────────────────────────── */
  const handleRunWorkflow = async (workflow) => {
    if (runningIds.has(workflow.id)) return;
    setRunningIds(prev => new Set(prev).add(workflow.id));
    toast.info(`Executing "${workflow.name}"...`);

    try {
      const run = await api.triggerWorkflow(workflow.id, {
        triggeredBy: 'console',
        timestamp: new Date().toISOString(),
      });
      toast.success(`Workflow triggered successfully!`);
      fetchData();
      navigate(`/runs/${run.id}`);
    } catch (err) {
      toast.error(`Run failed: ${err.message}`);
    } finally {
      setRunningIds(prev => {
        const next = new Set(prev);
        next.delete(workflow.id);
        return next;
      });
    }
  };

  /* ── Toggle Active State ───────────────────────────────────── */
  const handleToggleActive = async (workflow) => {
    const newActive = !workflow.is_active;
    try {
      await api.updateWorkflow(workflow.id, { is_active: newActive });
      setWorkflows(list =>
        list.map(w => (w.id === workflow.id ? { ...w, is_active: newActive } : w))
      );
      toast.success(`Workflow ${newActive ? 'activated' : 'paused'}`);
    } catch (err) {
      toast.error(`Toggle failed: ${err.message}`);
    }
  };

  /* ── Delete Workflow ───────────────────────────────────────── */
  const handleDeleteWorkflow = async (id, name) => {
    if (!window.confirm(`Delete workflow "${name}"?`)) return;
    try {
      await api.deleteWorkflow(id);
      setWorkflows(list => list.filter(w => w.id !== id));
      toast.success('Workflow deleted');
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  /* ── Create New Workflow ───────────────────────────────────── */
  const handleCreateWorkflow = async (formData) => {
    try {
      let initialNodes = [
        { id: 'start', type: 'trigger', position: { x: 80, y: 160 }, data: { label: 'Start Trigger', triggerType: formData.trigger_type, cronExpression: formData.cron_expression } },
        { id: 'http1', type: 'http', position: { x: 400, y: 160 }, data: { label: 'HTTP Request', method: 'GET', url: 'https://httpbin.org/get' } },
        { id: 'tf1',   type: 'transform', position: { x: 720, y: 160 }, data: { label: 'Transform Payload', expression: '({\n  ...input,\n  receivedAt: Date.now()\n})' } },
      ];
      let initialEdges = [
        { id: 'e1', source: 'start', target: 'http1', animated: true },
        { id: 'e2', source: 'http1', target: 'tf1', animated: true },
      ];

      const created = await api.createWorkflow({
        name: formData.name,
        description: formData.description,
        trigger_type: formData.trigger_type,
        cron_expression: formData.cron_expression,
        nodes: initialNodes,
        edges: initialEdges,
      });

      setShowCreateModal(false);
      toast.success('Workflow created!');
      navigate(`/editor/${created.id}`);
    } catch (err) {
      toast.error(`Create failed: ${err.message}`);
    }
  };

  /* ── Filtered Workflows ────────────────────────────────────── */
  const filteredWorkflows = workflows.filter(w => {
    const matchesSearch = (w.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (w.description || '').toLowerCase().includes(search.toLowerCase());
    if (filterType === 'active') return matchesSearch && w.is_active;
    if (filterType === 'inactive') return matchesSearch && !w.is_active;
    if (filterType === 'webhook') return matchesSearch && w.trigger_type === 'webhook';
    if (filterType === 'cron') return matchesSearch && w.trigger_type === 'cron';
    if (filterType === 'manual') return matchesSearch && w.trigger_type === 'manual';
    return matchesSearch;
  });

  return (
    <div className="console-hub-root">
      {/* ── Console Header Banner ─────────────────────────────── */}
      <section className="console-hero-banner">
        <div className="console-container">
          <div className="console-header-flex">
            <div>
              <div className="console-badge-pill">
                <span className="pulse-dot" />
                <span>NODEVERSE ORCHESTRATION CONSOLE</span>
              </div>
              <h1 className="console-title">Workspace Command Center</h1>
              <p className="console-subtitle">
                Manage automated DAG workflows, trigger deterministic executions, inspect real-time telemetry, and recover failed jobs.
              </p>
            </div>
            <div className="console-header-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                <span>New Workflow</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="console-metrics-row">
            <div className="console-stat-box" onClick={() => setFilterType('all')}>
              <div className="stat-box-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                <Workflow size={20} />
              </div>
              <div>
                <div className="stat-box-val">{stats?.totalWorkflows ?? workflows.length}</div>
                <div className="stat-box-lbl">Workflows Registered</div>
              </div>
            </div>

            <div className="console-stat-box" onClick={() => navigate('/runs')}>
              <div className="stat-box-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
                <History size={20} />
              </div>
              <div>
                <div className="stat-box-val">{stats?.totalRuns ?? recentRuns.length}</div>
                <div className="stat-box-lbl">Total Executions</div>
              </div>
            </div>

            <div className="console-stat-box" onClick={() => navigate('/dead-letters')}>
              <div className="stat-box-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <div className="stat-box-val">{stats?.dlqPending ?? 0}</div>
                <div className="stat-box-lbl">DLQ Pending</div>
              </div>
            </div>

            <div className="console-stat-box" onClick={() => navigate('/webhooks')}>
              <div className="stat-box-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <Zap size={20} />
              </div>
              <div>
                <div className="stat-box-val">Online</div>
                <div className="stat-box-lbl">Inbound Webhooks</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WORKABLE WORKFLOWS MANAGEMENT SECTION ─────────────── */}
      <section className="console-workflows-section">
        <div className="console-container">
          <div className="console-section-header">
            <div>
              <h2 className="section-title">Workflow Automations</h2>
              <p className="section-subtitle">
                Trigger 1-click runs, toggle active schedules, or edit in Studio Canvas
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="console-controls-bar">
              <div className="search-input-wrap">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="filter-chips-wrap">
                {['all', 'active', 'webhook', 'cron', 'manual'].map(t => (
                  <button
                    key={t}
                    className={`chip-filter ${filterType === t ? 'active' : ''}`}
                    onClick={() => setFilterType(t)}
                  >
                    {t === 'all' && 'All'}
                    {t === 'active' && 'Active Only'}
                    {t === 'webhook' && 'Webhooks'}
                    {t === 'cron' && 'Cron Schedulers'}
                    {t === 'manual' && 'Manual'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Workflows Cards Grid */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>Loading workflows...</span>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="empty-state">
              <p>No workflows match your search.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)} style={{ marginTop: 12 }}>
                <Plus size={14} /> Create Workflow
              </button>
            </div>
          ) : (
            <div className="workable-cards-grid">
              {filteredWorkflows.map(wf => {
                const isRunning = runningIds.has(wf.id);
                return (
                  <div key={wf.id} className="workable-card">
                    <div className="workable-card-header">
                      <div className="trigger-badge-wrap">
                        {wf.trigger_type === 'webhook' && (
                          <span className="trigger-pill webhook">
                            <Zap size={11} /> Webhook
                          </span>
                        )}
                        {wf.trigger_type === 'cron' && (
                          <span className="trigger-pill cron">
                            <Clock size={11} /> {wf.cron_expression || 'Cron'}
                          </span>
                        )}
                        {wf.trigger_type === 'manual' && (
                          <span className="trigger-pill manual">
                            <Play size={11} /> Manual
                          </span>
                        )}
                        <span className="nodes-count-chip">
                          {(wf.nodes || []).length} nodes
                        </span>
                      </div>

                      {/* Active toggle switch */}
                      <button
                        className={`toggle-switch-btn ${wf.is_active ? 'active' : ''}`}
                        onClick={() => handleToggleActive(wf)}
                        title={wf.is_active ? 'Click to pause' : 'Click to activate'}
                      >
                        <span className="switch-dot" />
                        <span className="switch-text">{wf.is_active ? 'ACTIVE' : 'PAUSED'}</span>
                      </button>
                    </div>

                    <div className="workable-card-body">
                      <h3 className="wf-card-title">{wf.name}</h3>
                      <p className="wf-card-desc">
                        {wf.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="workable-card-actions">
                      <button
                        className="btn btn-primary btn-sm run-btn"
                        onClick={() => handleRunWorkflow(wf)}
                        disabled={isRunning}
                        title="Execute this DAG workflow now"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>{isRunning ? 'Running...' : 'Run Now'}</span>
                      </button>

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/editor/${wf.id}`)}
                        title="Open in Studio Canvas"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        className="btn btn-icon-ghost"
                        onClick={() => handleDeleteWorkflow(wf.id, wf.name)}
                        title="Delete workflow"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── RECENT EXECUTIONS & SYSTEM ACTIVITY ─────────────────── */}
      <section className="console-recent-section">
        <div className="console-container">
          <div className="recent-runs-card">
            <div className="recent-card-header">
              <div className="recent-header-left">
                <Activity size={18} className="text-purple" />
                <h3 className="recent-title">Recent DAG Executions</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/runs')}>
                View All Runs <ChevronRight size={14} />
              </button>
            </div>

            {recentRuns.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <p>No executions recorded yet. Click "Run Now" on any workflow above to test!</p>
              </div>
            ) : (
              <div className="recent-runs-table-wrap">
                <table className="recent-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Workflow</th>
                      <th>Trigger Type</th>
                      <th>Started</th>
                      <th>Duration</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRuns.map(run => {
                      const workflowId = run.workflow_id || run.workflowId;
                      const workflowName = run.workflowName ||
                        workflows.find(workflow => workflow.id === workflowId)?.name ||
                        workflowId ||
                        'Unknown workflow';
                      const startedAt = run.started_at || run.startedAt;
                      const completedAt = run.completed_at || run.completedAt;
                      const startedDate = startedAt ? new Date(startedAt) : null;
                      const completedDate = completedAt ? new Date(completedAt) : null;
                      const hasValidStart = startedDate && !Number.isNaN(startedDate.getTime());
                      const hasValidCompletion = completedDate && !Number.isNaN(completedDate.getTime());

                      return (
                        <tr key={run.id} onClick={() => navigate(`/runs/${run.id}`)} className="clickable-row">
                          <td>
                            <span className={`status-pill ${run.status}`}>
                              {run.status === 'completed' && '✔ Completed'}
                              {run.status === 'failed' && '✖ Failed'}
                              {run.status === 'running' && '● Running'}
                            </span>
                          </td>
                          <td className="font-semibold text-white">{workflowName}</td>
                          <td>
                            <span className="chip chip-mono">{run.trigger_type || run.triggerType || 'manual'}</span>
                          </td>
                          <td className="text-muted text-xs">
                            {hasValidStart ? startedDate.toLocaleTimeString() : '—'}
                          </td>
                          <td className="text-muted text-xs font-mono">
                            {hasValidCompletion && hasValidStart
                              ? `${completedDate - startedDate}ms`
                              : completedAt ? '—' : 'in progress'}
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/runs/${run.id}`);
                              }}
                            >
                              Inspect <ExternalLink size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Create Modal ───────────────────────────────────────── */}
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWorkflow}
        />
      )}

      {/* ── Toast Notifications ─────────────────────────────────── */}
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
