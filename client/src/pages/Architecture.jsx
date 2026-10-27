import {
  Layers,
  Cpu,
  GitBranch,
  ShieldCheck,
  Zap,
  Activity,
  Database,
  Server,
  RefreshCw,
  Terminal,
} from 'lucide-react';

export default function Architecture() {
  return (
    <div className="page-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Abstract Banner ───────────────────────────────────── */}
      <div className="abstract-banner">
        <div className="abstract-team-tag">WEBSTER 2026 • PROJECT ABSTRACT • TEAM ID: 390</div>
        <h1 className="abstract-title">ORCHANOVA | NODEVERSE</h1>
        <p className="abstract-lead">
          DISTRIBUTED DAG WORKFLOW & AUTOMATION ENGINE — THE DORMAMMU LOOP
        </p>
        <div className="team-members-row">
          <div className="team-member-pill">
            <span className="member-name">Shreyansh Maurya</span>
            <span className="member-reg">20253278 • CSE • @shadow.duskk</span>
          </div>
          <div className="team-member-pill">
            <span className="member-name">Darsheel Singh</span>
            <span className="member-reg">20253085 • CSE • @darsheel0404</span>
          </div>
          <div className="team-member-pill">
            <span className="member-name">Shravan Kumar Jaiswal</span>
            <span className="member-reg">20253275 • CSE • @shravanjaiswal0483</span>
          </div>
        </div>
      </div>

      {/* ── Problem Description ───────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 10 }}>Description of the Problem</h3>
        <p style={{ color: 'var(--txt-s)', lineHeight: 1.7, fontSize: '0.95rem' }}>
          <strong>The Dormammu Loop (NODEVERSE)</strong> is a visual workflow automation platform that lets users design and run dependency-based tasks as a Directed Acyclic Graph (DAG). Users connect triggers, HTTP requests, data transformations, delays and conditions on a visual canvas.
          Before execution, the application validates the graph and rejects cycles. The engine runs a node only when its dependencies have succeeded, passes outputs to downstream nodes, and records execution history for traceability. Manual, webhook and scheduled triggers support different automation patterns. The distributed worker design adds bounded retries, failure handling, dead-letter recovery, and live execution updates.
        </p>
      </div>

      {/* ── 6-Step Process Flow ───────────────────────────────── */}
      <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 14 }}>Process Flow of the Platform</h3>
      <div className="process-flow-grid">
        <div className="process-card">
          <div className="process-step-num">01 DESIGN</div>
          <h4>Visual Canvas</h4>
          <p>Build the workflow on the visual canvas by adding nodes, configuring parameters, and connecting dependencies.</p>
        </div>
        <div className="process-card">
          <div className="process-step-num">02 VALIDATE</div>
          <h4>DAG Cycle Detection</h4>
          <p>Check required node settings and detect cycles using topological order analysis before a workflow is saved or executed.</p>
        </div>
        <div className="process-card">
          <div className="process-step-num">03 TRIGGER</div>
          <h4>Multi-Pattern Ingestion</h4>
          <p>Start a run manually, through an incoming HTTP webhook POST endpoint, or from a configured cron schedule.</p>
        </div>
        <div className="process-card">
          <div className="process-step-num">04 EXECUTE</div>
          <h4>Topological Scheduler</h4>
          <p>Calculate a valid topological order and run each node only after its parent prerequisite nodes succeed.</p>
        </div>
        <div className="process-card">
          <div className="process-step-num">05 OBSERVE</div>
          <h4>Live Telemetry & SSE</h4>
          <p>Store run and node status, inputs, outputs, timestamps, and errors; stream real-time SSE updates to the canvas.</p>
        </div>
        <div className="process-card">
          <div className="process-step-num">06 RECOVER</div>
          <h4>Retries & Dead-Letter Queue</h4>
          <p>Retry eligible failures using exponential backoff with jitter; send exhausted failures to a dead-letter queue for replay.</p>
        </div>
      </div>

      {/* ── Architecture Comparison ───────────────────────────── */}
      <div className="card" style={{ marginTop: 24, marginBottom: 24 }}>
        <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 12 }}>Engineering Trade-offs & Justification</h3>
        <div className="comparison-grid">
          <div className="comparison-box naive">
            <h4>❌ Naive / Basic Way</h4>
            <p>Execute all nodes sequentially inside one API request and keep progress only in memory. A slow HTTP call ties up the request; server restarts lose transient status, and simultaneous runs become hard to coordinate.</p>
          </div>
          <div className="comparison-box proposed">
            <h4>✅ Proposed Engineering Way</h4>
            <p>Validate the DAG before execution, persist run and node state in PostgreSQL, queue jobs through BullMQ/Redis, and use guarded state transitions, idempotency checks, bounded retries, and dead-letter isolation.</p>
          </div>
        </div>
        <div className="why-it-wins" style={{ marginTop: 14 }}>
          <strong>Why it wins:</strong> API and workers scale independently; durable records make runs auditable; topological scheduling protects dependency order; and retries plus dead-letter records make repeat failures visible instead of silently looping.
        </div>
      </div>

      {/* ── Technology Stack ──────────────────────────────────── */}
      <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 14 }}>Core Technology Stack</h3>
      <div className="tech-stack-table-wrap">
        <table className="tech-table">
          <thead>
            <tr>
              <th>Library / API</th>
              <th>Why It Is Selected</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>React + Vite</strong></td>
              <td>Component-based frontend and fast build tooling for modular interface development.</td>
            </tr>
            <tr>
              <td><strong>React Flow</strong></td>
              <td>Provides canvas interactions such as custom nodes, edges, pan, and zoom for DAG authoring.</td>
            </tr>
            <tr>
              <td><strong>Node.js + Express</strong></td>
              <td>Lightweight REST API and webhook layer matching the language ecosystem of the frontend.</td>
            </tr>
            <tr>
              <td><strong>PostgreSQL</strong></td>
              <td>Durable relational storage for workflow definitions, runs, node results, and dead-letter records.</td>
            </tr>
            <tr>
              <td><strong>Redis + BullMQ</strong></td>
              <td>Redis-backed queue for asynchronous jobs, concurrency, retries, and worker separation.</td>
            </tr>
            <tr>
              <td><strong>Cron Scheduling</strong></td>
              <td>Validates schedules and determines time-based due runs for recurring workflows.</td>
            </tr>
            <tr>
              <td><strong>Server-Sent Events (SSE)</strong></td>
              <td>Simple one-way server-to-browser stream for real-time node state and log updates on the canvas.</td>
            </tr>
            <tr>
              <td><strong>Docker Compose</strong></td>
              <td>Coordinates API, database, Redis, and client services in a repeatable local environment.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
