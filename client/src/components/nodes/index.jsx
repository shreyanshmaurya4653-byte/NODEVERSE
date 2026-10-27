import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Zap,
  Globe,
  Code2,
  GitBranch,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  MinusCircle,
  Compass,
  Bot,
  Share2,
  Sparkles,
} from 'lucide-react';

const STATUS_CONFIG = {
  running: {
    color: '#22d3ee',
    bg: 'rgba(34, 211, 238, 0.15)',
    border: '#22d3ee',
    icon: <RotateCw size={12} className="spin-fast" />,
    label: 'Running',
  },
  completed: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: '#10b981',
    icon: <CheckCircle2 size={12} />,
    label: 'Done',
  },
  failed: {
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.15)',
    border: '#f43f5e',
    icon: <AlertTriangle size={12} />,
    label: 'Failed',
  },
  skipped: {
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.15)',
    border: '#475569',
    icon: <MinusCircle size={12} />,
    label: 'Skipped',
  },
  pending: {
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.3)',
    icon: <Clock size={12} />,
    label: 'Queued',
  },
};

function NodeShell({
  type,
  icon: Icon,
  accentColor,
  label,
  subtitle,
  status,
  durationMs,
  selected,
  children,
  handles = 'both',
}) {
  const statusInfo = status ? STATUS_CONFIG[status] : null;

  return (
    <div
      className={`flow-node-card ${status ? `status-${status}` : ''} ${selected ? 'is-selected' : ''}`}
      style={{
        '--node-accent': accentColor,
      }}
    >
      {/* Top Target Handle */}
      {(handles === 'both' || handles === 'target') && (
        <Handle
          type="target"
          position={Position.Top}
          className="flow-handle flow-handle-target"
        />
      )}

      {/* Node Header */}
      <div className="flow-node-card-header">
        <div className="flow-node-icon-box" style={{ background: `${accentColor}22`, color: accentColor }}>
          <Icon size={16} />
        </div>
        <div className="flow-node-meta">
          <div className="flow-node-category">{type.toUpperCase()}</div>
          <div className="flow-node-title" title={label}>{label || 'Untitled Node'}</div>
        </div>
        {statusInfo && (
          <div
            className="flow-node-status-pill"
            style={{
              color: statusInfo.color,
              background: statusInfo.bg,
              borderColor: statusInfo.border,
            }}
          >
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        )}
      </div>

      {/* Subtitle / Description */}
      {subtitle && <div className="flow-node-subtitle">{subtitle}</div>}

      {/* Node Content / Preview */}
      {children && <div className="flow-node-content">{children}</div>}

      {/* Execution elapsed time badge */}
      {durationMs !== undefined && durationMs !== null && (
        <div className="flow-node-elapsed">
          ⏱ {durationMs}ms
        </div>
      )}

      {/* Bottom Source Handle */}
      {(handles === 'both' || handles === 'source') && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="flow-handle flow-handle-source"
        />
      )}
    </div>
  );
}

/* ── 1. Trigger Node ─────────────────────────────────────────── */
export const TriggerNode = memo(({ data, selected }) => {
  const triggerType = data.triggerType || 'manual';
  return (
    <NodeShell
      type="trigger"
      icon={Zap}
      accentColor="#a855f7"
      label={data.label || 'Workflow Trigger'}
      status={data.status}
      durationMs={data.durationMs}
      selected={selected}
      handles="source"
    >
      <div className="node-badge-row">
        <span className={`trigger-chip trigger-chip-${triggerType}`}>
          {triggerType === 'webhook' ? '⚡ Webhook' : triggerType === 'cron' ? '⏱ Cron Schedule' : '▶ Manual Trigger'}
        </span>
      </div>
      {triggerType === 'cron' && (
        <div className="node-code-preview" style={{ color: '#c084fc' }}>
          {data.cronExpression || '*/5 * * * *'}
        </div>
      )}
      {triggerType === 'webhook' && (
        <div className="node-code-preview" style={{ color: '#a855f7' }}>
          POST /webhooks/:id
        </div>
      )}
    </NodeShell>
  );
});

/* ── 2. HTTP Request Node ─────────────────────────────────────── */
export const HttpNode = memo(({ data, selected }) => {
  const method = (data.method || 'GET').toUpperCase();
  const methodColors = {
    GET: '#10b981',
    POST: '#06b6d4',
    PUT: '#f59e0b',
    PATCH: '#a855f7',
    DELETE: '#f43f5e',
  };
  const color = methodColors[method] || '#06b6d4';

  return (
    <NodeShell
      type="http request"
      icon={Globe}
      accentColor="#06b6d4"
      label={data.label || 'HTTP Request'}
      status={data.status}
      durationMs={data.durationMs}
      selected={selected}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="http-method-badge" style={{ color, background: `${color}20`, borderColor: `${color}40` }}>
          {method}
        </span>
        <span className="node-code-preview" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.url ? data.url.replace(/^https?:\/\//, '') : 'https://api.example.com'}
        </span>
      </div>
      {data.maxRetries > 0 && (
        <div className="node-meta-tag">
          🔁 Max Retries: {data.maxRetries}
        </div>
      )}
    </NodeShell>
  );
});

/* ── 3. Transform Node ────────────────────────────────────────── */
export const TransformNode = memo(({ data, selected }) => {
  const expr = data.expression || 'input';
  return (
    <NodeShell
      type="transform"
      icon={Code2}
      accentColor="#fbbf24"
      label={data.label || 'Transform Data'}
      status={data.status}
      durationMs={data.durationMs}
      selected={selected}
    >
      <div className="node-code-block" title={expr}>
        {expr.length > 55 ? expr.slice(0, 55) + '…' : expr}
      </div>
    </NodeShell>
  );
});

/* ── 4. Condition Node (Branching True / False) ────────────────── */
export const ConditionNode = memo(({ data, selected }) => {
  const statusInfo = data.status ? STATUS_CONFIG[data.status] : null;
  const expr = data.expression || 'input.status === 200';

  return (
    <div
      className={`flow-node-card condition-card ${data.status ? `status-${data.status}` : ''} ${selected ? 'is-selected' : ''}`}
      style={{ '--node-accent': '#10b981' }}
    >
      {/* Target Handle */}
      <Handle type="target" position={Position.Top} className="flow-handle flow-handle-target" />

      {/* Header */}
      <div className="flow-node-card-header">
        <div className="flow-node-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
          <GitBranch size={16} />
        </div>
        <div className="flow-node-meta">
          <div className="flow-node-category">LOGIC & BRANCH</div>
          <div className="flow-node-title" title={data.label}>{data.label || 'Condition Check'}</div>
        </div>
        {statusInfo && (
          <div
            className="flow-node-status-pill"
            style={{
              color: statusInfo.color,
              background: statusInfo.bg,
              borderColor: statusInfo.border,
            }}
          >
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        )}
      </div>

      {/* Expression */}
      <div className="flow-node-content">
        <div className="node-code-block" style={{ color: '#34d399' }} title={expr}>
          if ({expr.length > 40 ? expr.slice(0, 40) + '…' : expr})
        </div>
      </div>

      {/* Branch Port Handles */}
      <div className="condition-branch-bar">
        <div className="condition-branch branch-true">
          <span>TRUE</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="flow-handle branch-handle branch-handle-true"
          />
        </div>
        <div className="condition-branch branch-false">
          <span>FALSE</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="flow-handle branch-handle branch-handle-false"
          />
        </div>
      </div>
    </div>
  );
});

/* ── 5. Delay Node ────────────────────────────────────────────── */
export const DelayNode = memo(({ data, selected }) => {
  const ms = data.delayMs || 1000;
  return (
    <NodeShell
      type="delay / sleep"
      icon={Clock}
      accentColor="#ec4899"
      label={data.label || 'Delay Timer'}
      status={data.status}
      durationMs={data.durationMs}
      selected={selected}
    >
      <div className="node-badge-row">
        <span className="delay-badge">
          ⏱ Wait {ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`}
        </span>
      </div>
    </NodeShell>
  );
});

/* ── 6. Outbound Webhook / Alert Node ─────────────────────────── */
export const WebhookOutNode = memo(({ data, selected }) => {
  return (
    <NodeShell
      type="outbound notification"
      icon={Send}
      accentColor="#6366f1"
      label={data.label || 'Broadcast Notification'}
      status={data.status}
      durationMs={data.durationMs}
      selected={selected}
    >
      <div className="node-meta-tag">
        📢 #{data.channel || 'general-alerts'}
      </div>
      {data.message && (
        <div className="node-code-preview" style={{ color: '#a5b4fc', marginTop: 4 }}>
          {data.message.length > 45 ? data.message.slice(0, 45) + '…' : data.message}
        </div>
      )}
    </NodeShell>
  );
});

/* ── 7. Universal Web Scraper & Website Automator Node ────────── */
export const ScraperNode = memo(({ data, selected }) => {
  const url = data.url || 'https://example.com';
  return (
    <NodeShell
      type="web scraper"
      icon={Compass}
      accentColor="#06b6d4"
      label={data.label || 'Scrape Website'}
      status={data.status}
      durationMs={data.durationMs}
      selected={selected}
    >
      <div className="node-badge-row">
        <span className="method-badge method-get">SCRAPE</span>
        <span className="url-preview" title={url}>
          {url.replace(/^https?:\/\//, '')}
        </span>
      </div>
      <div className="node-meta-tag" style={{ marginTop: 4, color: '#67e8f9' }}>
        🌐 Extract Headings, Meta & Links
      </div>
    </NodeShell>
  );
});

/* ── 8. Universal Platform & App Connector Node ───────────────── */
export const AppConnectorNode = memo(({ data, selected }) => {
  const platform = data.platform || 'app';
  return (
    <NodeShell
      type={platform}
      icon={Bot}
      accentColor="#c084fc"
      label={data.label || `${platform.toUpperCase()} Connector`}
      status={data.status}
      durationMs={data.durationMs}
      selected={selected}
    >
      <div className="node-badge-row">
        <span className="method-badge method-post">CONNECT</span>
        <span className="url-preview">
          {data.action || data.url || `${platform} API`}
        </span>
      </div>
      {data.channel && (
        <div className="node-meta-tag" style={{ marginTop: 4 }}>
          #{data.channel}
        </div>
      )}
    </NodeShell>
  );
});

export const nodeTypes = {
  trigger:       TriggerNode,
  http:          HttpNode,
  transform:     TransformNode,
  condition:     ConditionNode,
  delay:         DelayNode,
  webhook_out:   WebhookOutNode,
  scraper:       ScraperNode,
  app_connector: AppConnectorNode,
};
