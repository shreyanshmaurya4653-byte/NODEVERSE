import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RotateCw,
  ExternalLink,
  Clock,
  Play,
  Zap,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  StopCircle,
  ChevronDown,
  ChevronRight,
  Terminal,
  Search,
  Filter,
} from 'lucide-react';
import { api } from '../api/index.js';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function calcDuration(start, end) {
  if (!start) return '—';
  const ms = new Date(end || Date.now()) - new Date(start);
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function StatusBadge({ status }) {
  const map = {
    completed: { cls: 'badge-completed', label: 'Completed', icon: <CheckCircle2 size={11} /> },
    running:   { cls: 'badge-running',   label: 'Running',   icon: <RotateCw size={11} className="spin-fast" /> },
    failed:    { cls: 'badge-failed',    label: 'Failed',    icon: <AlertTriangle size={11} /> },
    cancelled: { cls: 'badge-skipped',   label: 'Cancelled', icon: <StopCircle size={11} /> },
    pending:   { cls: 'badge-pending',   label: 'Pending',   icon: <Clock size={11} /> },
    skipped:   { cls: 'badge-skipped',   label: 'Skipped',   icon: <MinusCircle size={11} /> },
  };
  const item = map[status] || map.pending;
  return (
    <span className={`badge ${item.cls}`}>
      {item.icon} {item.label}
    </span>
  );
}

/* ── Node Run Row (with Expandable Telemetry Drawer) ─────────── */
function NodeRunRow({ nodeRun }) {
  const [expanded, setExpanded] = useState(false);
  const start = nodeRun.started_at ? new Date(nodeRun.started_at).getTime() : 0;
  const end = nodeRun.completed_at ? new Date(nodeRun.completed_at).getTime() : 0;
  const dur = start && end ? `${Math.max(1, end - start)}ms` : (nodeRun.status === 'running' ? 'Active' : '—');

  return (
    <>
      <tr className={`node-run-row ${expanded ? 'is-expanded' : ''}`} onClick={() => setExpanded(!expanded)}>
        <td style={{ width: 32 }}>
          <button className="btn-icon-ghost" style={{ padding: 2 }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td>
          <div className="table-node-name">
            <strong>{nodeRun.node_id}</strong>
            <span className="table-node-type">{nodeRun.node_type}</span>
          </div>
        </td>
        <td>
          <StatusBadge status={nodeRun.status} />
        </td>
        <td>
          <span className="mono-text">{nodeRun.attempt || 1}</span>
        </td>
        <td>
          <span className="mono-text">{dur}</span>
        </td>
        <td style={{ color: 'var(--txt-s)', fontSize: '0.8rem' }}>
          {fmtDate(nodeRun.started_at)}
        </td>
      </tr>

      {/* Expanded I/O and Log Details */}
      {expanded && (
        <tr className="node-run-detail-row">
          <td colSpan={6}>
            <div className="node-detail-drawer">
              {nodeRun.error && (
                <div className="node-error-callout">
                  <AlertTriangle size={15} />
                  <span><strong>Error:</strong> {nodeRun.error}</span>
                </div>
              )}

              <div className="drawer-columns">
                {/* Input Payload */}
                <div className="drawer-col">
                  <div className="drawer-col-title">Input Payload</div>
                  <pre className="drawer-json">
                    {nodeRun.input ? JSON.stringify(nodeRun.input, null, 2) : '{}'}
                  </pre>
                </div>

                {/* Output Payload */}
                <div className="drawer-col">
                  <div className="drawer-col-title">Output Result</div>
                  <pre className="drawer-json">
                    {nodeRun.output ? JSON.stringify(nodeRun.output, null, 2) : 'null'}
                  </pre>
                </div>
              </div>

              {/* Actionable Node Logs */}
              {nodeRun.logs && nodeRun.logs.length > 0 && (
                <div className="drawer-logs-section">
                  <div className="drawer-col-title">
                    <Terminal size={12} /> Execution Logs
                  </div>
                  <div className="drawer-logs-list">
                    {nodeRun.logs.map((log, idx) => (
                      <div key={idx} className="drawer-log-line">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Run Detail View ─────────────────────────────────────────── */
function RunDetail({ runId, onCancelled }) {
  const [run,      setRun]      = useState(null);
  const [nodeRuns, setNodeRuns] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const navigate = useNavigate();

  const loadRunData = async () => {
    try {
      const data = await api.getRun(runId);
      const nodesData = await api.getNodeRuns(runId);
      setRun(data);
      setNodeRuns(nodesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!runId) return;
    loadRunData();

    // Listen to real-time execution stream
    const es = api.streamRun(runId);

    es.addEventListener('node_update', e => {
      const nr = JSON.parse(e.data);
      setNodeRuns(prev => {
        const idx = prev.findIndex(x => x.id === nr.id);
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = nr;
          return cp;
        }
        return [...prev, nr];
      });
    });

    es.addEventListener('run_update', e => {
      const r = JSON.parse(e.data);
      setRun(r);
      if (['completed', 'failed', 'cancelled'].includes(r.status)) {
        es.close();
      }
    });

    return () => es.close();
  }, [runId]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this in-progress execution?')) return;
    try {
      const cancelled = await api.cancelRun(runId);
      setRun(cancelled);
      if (onCancelled) onCancelled(cancelled);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading execution telemetry...</span>
      </div>
    );
  }

  if (!run) {
    return <div className="empty-state">Select an execution from the list to inspect telemetry.</div>;
  }

  return (
    <div className="run-detail-container">
      {/* Detail Header */}
      <div className="run-detail-header">
        <div className="run-detail-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={run.status} />
            <span className="run-id-pill" title={run.id}>
              Run #{run.id.slice(0, 8)}
            </span>
            <span className="run-trigger-badge">
              {run.trigger_type === 'webhook' ? '⚡ Webhook' : run.trigger_type === 'cron' ? '⏱ Cron' : '▶ Manual'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {run.status === 'running' && (
              <button className="btn btn-danger btn-sm" onClick={handleCancel}>
                <StopCircle size={14} /> Cancel Execution
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/editor/${run.workflow_id}`)}
            >
              <ExternalLink size={14} /> Open Canvas
            </button>
          </div>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="telemetry-bar">
          <div className="telemetry-item">
            <span className="telemetry-label">Started At</span>
            <span className="telemetry-val">{fmtDate(run.started_at)}</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">Completed At</span>
            <span className="telemetry-val">{fmtDate(run.completed_at)}</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">Total Duration</span>
            <span className="telemetry-val">{calcDuration(run.started_at, run.completed_at)}</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">Executed Nodes</span>
            <span className="telemetry-val">{nodeRuns.length}</span>
          </div>
        </div>

        {/* Error Alert Box */}
        {run.error && (
          <div className="run-error-banner">
            <AlertTriangle size={18} />
            <div>
              <strong>Execution Error:</strong> {run.error}
            </div>
          </div>
        )}
      </div>

      {/* Node Runs Telemetry Table */}
      <div className="node-runs-section">
        <div className="section-subheading">
          <span>DAG Node Execution Telemetry ({nodeRuns.length} Nodes)</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--txt-m)' }}>Click any row to inspect inputs, outputs, and log events</span>
        </div>

        <table className="telemetry-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Node Identifier</th>
              <th>Execution Status</th>
              <th>Attempts</th>
              <th>Duration</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {nodeRuns.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--txt-m)' }}>
                  No node tasks recorded.
                </td>
              </tr>
            ) : (
              nodeRuns.map((nr) => (
                <NodeRunRow key={nr.id || nr.node_id} nodeRun={nr} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Main Run History Page ────────────────────────────────────── */
export default function RunHistory() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [runs,       setRuns]       = useState([]);
  const [workflows,  setWorkflows]  = useState({});
  const [selectedId, setSelectedId] = useState(id || null);
  const [filter,     setFilter]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);

  const fetchRuns = async () => {
    try {
      const [runsData, wfsData] = await Promise.all([
        api.listRuns(null, 100),
        api.listWorkflows().catch(() => []),
      ]);
      setRuns(runsData);

      const wfMap = {};
      for (const w of wfsData) wfMap[w.id] = w.name;
      setWorkflows(wfMap);

      if (!selectedId && runsData.length > 0) {
        setSelectedId(runsData[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (id) setSelectedId(id);
  }, [id]);

  const filteredRuns = runs.filter(r => {
    const matchStatus = filter === 'all' || r.status === filter;
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (workflows[r.workflow_id] || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="page-container">
      <div className="runs-master-detail-layout">
        {/* ── Left Runs Master Column ─────────────────────────── */}
        <aside className="runs-sidebar">
          <div className="runs-sidebar-header">
            <h3>Executions</h3>
            <button className="btn-icon-ghost" onClick={fetchRuns} title="Refresh">
              <RotateCw size={14} />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="runs-sidebar-filter">
            <div className="search-input-wrap">
              <Search size={14} />
              <input
                type="text"
                placeholder="Filter runs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-pill-row">
              {['all', 'completed', 'running', 'failed'].map(s => (
                <button
                  key={s}
                  className={`filter-pill ${filter === s ? 'active' : ''}`}
                  onClick={() => setFilter(s)}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Runs List */}
          <div className="runs-list-scroll">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
              </div>
            ) : filteredRuns.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                No execution records found.
              </div>
            ) : (
              filteredRuns.map((r) => {
                const isSelected = r.id === selectedId;
                const wfName = workflows[r.workflow_id] || 'Workflow';
                return (
                  <div
                    key={r.id}
                    className={`run-list-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedId(r.id);
                      navigate(`/runs/${r.id}`);
                    }}
                  >
                    <div className="run-item-top">
                      <span className="run-item-wf">{wfName}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="run-item-bottom">
                      <span className="run-item-id">#{r.id.slice(0, 8)}</span>
                      <span className="run-item-dur">{calcDuration(r.started_at, r.completed_at)}</span>
                      <span className="run-item-time">{fmtDate(r.started_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Right Run Telemetry Detail Column ───────────────── */}
        <main className="runs-detail-view">
          {selectedId ? (
            <RunDetail runId={selectedId} onCancelled={() => fetchRuns()} />
          ) : (
            <div className="empty-state">
              <Terminal size={40} style={{ color: 'var(--txt-m)', marginBottom: 12 }} />
              <h3>Select an Execution</h3>
              <p>Choose any run from the left pane to view step-by-step telemetry, timing, and error logs.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
