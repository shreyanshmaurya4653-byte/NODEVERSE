import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  RotateCw,
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
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

export default function DeadLetterQueue() {
  const [items,      setItems]      = useState([]);
  const [workflows,  setWorkflows]  = useState({});
  const [filter,     setFilter]     = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [actioning,  setActioning]  = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [message,    setMessage]    = useState(null);

  const navigate = useNavigate();

  const loadDLQ = async () => {
    setLoading(true);
    try {
      const [dlqData, wfs] = await Promise.all([
        api.listDeadLetters(),
        api.listWorkflows().catch(() => []),
      ]);
      setItems(dlqData);

      const map = {};
      for (const w of wfs) map[w.id] = w.name;
      setWorkflows(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDLQ();
  }, []);

  const handleReplay = async (item) => {
    setActioning(item.id);
    try {
      const res = await api.replayDeadLetter(item.id);
      setMessage({ type: 'success', text: `Replay initiated (New Run #${res.newRunId.slice(0, 8)})` });
      loadDLQ();
      setTimeout(() => {
        navigate(`/runs/${res.newRunId}`);
      }, 1200);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActioning(null);
    }
  };

  const handleDiscard = async (item) => {
    if (!window.confirm('Discard this failure from the dead-letter queue?')) return;
    setActioning(item.id);
    try {
      await api.discardDeadLetter(item.id);
      setMessage({ type: 'info', text: 'Dead letter marked as discarded' });
      loadDLQ();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActioning(null);
    }
  };

  const filteredItems = items.filter(it => {
    if (filter === 'all') return true;
    return it.replay_state === filter;
  });

  const pendingCount  = items.filter(i => i.replay_state === 'pending').length;
  const replayedCount = items.filter(i => i.replay_state === 'replayed').length;
  const discardedCount= items.filter(i => i.replay_state === 'discarded').length;

  return (
    <div className="page-container">
      {/* ── DLQ Header ────────────────────────────────────────── */}
      <section className="dashboard-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 className="section-title">Dead-Letter Queue (DLQ)</h2>
            <span className="dlq-badge">Section 06 • Fault Recovery</span>
          </div>
          <p className="section-subtitle">
            Isolates tasks that exhausted all retry policies with exponential backoff for human review and 1-click deterministic replay.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadDLQ}>
          <RotateCw size={14} /> Refresh
        </button>
      </section>

      {/* ── Summary Counters ──────────────────────────────────── */}
      <section className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Pending Review</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="stat-number" style={{ color: pendingCount > 0 ? '#f43f5e' : 'inherit' }}>
            {pendingCount}
          </div>
          <div className="stat-sub">Failed after maximum attempts</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Replayed & Recovered</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-number">{replayedCount}</div>
          <div className="stat-sub">Successfully re-queued to worker engine</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Discarded Failures</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div className="stat-number">{discardedCount}</div>
          <div className="stat-sub">Dismissed by operator</div>
        </div>
      </section>

      {/* Message Banner */}
      {message && (
        <div className={`toast toast-${message.type}`} style={{ marginBottom: 16 }}>
          {message.text}
        </div>
      )}

      {/* ── Filter Tabs ───────────────────────────────────────── */}
      <div className="controls-bar">
        <div className="filter-chips-row">
          <button
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Items ({items.length})
          </button>
          <button
            className={`filter-chip ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            className={`filter-chip ${filter === 'replayed' ? 'active' : ''}`}
            onClick={() => setFilter('replayed')}
          >
            Replayed ({replayedCount})
          </button>
          <button
            className={`filter-chip ${filter === 'discarded' ? 'active' : ''}`}
            onClick={() => setFilter('discarded')}
          >
            Discarded ({discardedCount})
          </button>
        </div>
      </div>

      {/* ── DLQ List ──────────────────────────────────────────── */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Scanning dead-letter records...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={40} style={{ color: '#10b981', marginBottom: 12 }} />
          <h3>No Dead-Letter Records</h3>
          <p>All workflow nodes executed successfully or were recovered without exhausting retry caps.</p>
        </div>
      ) : (
        <div className="dlq-items-list">
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const wfName = workflows[item.workflow_id] || 'Workflow';
            const isActioning = actioning === item.id;

            return (
              <div key={item.id} className="dlq-card">
                <div className="dlq-card-header" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                  <div className="dlq-card-left">
                    <button className="btn-icon-ghost" style={{ padding: 2 }}>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div>
                      <div className="dlq-node-title">
                        <strong>{item.node_name || item.node_id}</strong>
                        <span className="dlq-wf-label">in {wfName}</span>
                      </div>
                      <div className="dlq-failure-snippet">{item.failure}</div>
                    </div>
                  </div>

                  <div className="dlq-card-right">
                    <span className={`dlq-status-chip status-${item.replay_state}`}>
                      {item.replay_state.toUpperCase()}
                    </span>
                    <span className="dlq-attempts-tag">
                      {item.attempts} Attempts
                    </span>
                    <span className="dlq-time-tag">
                      {fmtDate(item.created_at)}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="dlq-card-body">
                    <div className="dlq-full-error">
                      <strong>Root Cause Failure:</strong>
                      <div className="error-box">{item.failure}</div>
                    </div>

                    <div className="drawer-columns" style={{ marginTop: 14 }}>
                      <div className="drawer-col">
                        <div className="drawer-col-title">Failed Payload Input</div>
                        <pre className="drawer-json">
                          {JSON.stringify(item.payload, null, 2)}
                        </pre>
                      </div>
                      <div className="drawer-col">
                        <div className="drawer-col-title">Execution Context</div>
                        <div className="meta-key-value">
                          <div><span>Dead Letter ID:</span> <code>{item.id}</code></div>
                          <div><span>Original Run ID:</span> <code>{item.run_id}</code></div>
                          <div><span>Workflow ID:</span> <code>{item.workflow_id}</code></div>
                          <div><span>Recorded At:</span> {fmtDate(item.created_at)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="dlq-card-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleReplay(item)}
                        disabled={isActioning}
                      >
                        {isActioning ? <span className="spin-fast">◌</span> : <Play size={13} />}
                        <span>Replay Task</span>
                      </button>

                      {item.replay_state !== 'discarded' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDiscard(item)}
                          disabled={isActioning}
                        >
                          <Trash2 size={13} /> Discard Record
                        </button>
                      )}

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/runs/${item.run_id}`)}
                      >
                        <ExternalLink size={13} /> View Failed Run
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
