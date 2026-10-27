import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Zap,
  Layers,
  ShieldCheck,
  RotateCw,
  GitBranch,
  Clock,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Server,
  Database,
  ExternalLink,
  ChevronRight,
  Code2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/index.js';

export default function LandingPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [simStep, setSimStep] = useState(4); // 1 = Trigger, 2 = Transform, 3 = Condition, 4 = HTTP Finished
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => null);
  }, []);

  const handleSimulateRun = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(0);

    setTimeout(() => setSimStep(1), 350);  // Trigger
    setTimeout(() => setSimStep(2), 900);  // Transform
    setTimeout(() => setSimStep(3), 1500); // Condition
    setTimeout(() => setSimStep(4), 2100); // HTTP Finished
    setTimeout(() => setIsSimulating(false), 2400);
  };

  return (
    <div className="landing-page-root">
      {/* ── 1. HERO SECTION (MongoDB / Supabase Style) ────────── */}
      <section className="landing-hero-section">
        {/* Glow orbs */}
        <div className="hero-glow-orb orb-purple" />
        <div className="hero-glow-orb orb-cyan" />

        <div className="landing-container hero-inner">
          {/* Announcement Pill */}
          <div className="hero-pill-badge" onClick={() => navigate('/app')}>
            <span className="pill-dot" />
            <span className="pill-text">NEXT-GEN DISTRIBUTED DAG WORKFLOW ENGINE</span>
            <ChevronRight size={13} />
          </div>

          {/* Main Headline */}
          <h1 className="hero-headline">
            Orchestrate, Validate & Execute<br />
            <span className="gradient-text">Intelligent DAG Workflows</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subheadline">
            <strong>NodeVerse</strong> is an enterprise visual automation platform that runs dependency-based tasks as a Directed Acyclic Graph (DAG). Experience cycle-safe execution, distributed BullMQ task processing, bounded retries with jitter, and dead-letter recovery.
          </p>

          {/* Dual Action Buttons */}
          <div className="hero-cta-group">
            <button
              className="btn btn-primary btn-large"
              onClick={() => navigate('/app')}
            >
              <span>Get Started Free</span>
              <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-ghost btn-large"
              onClick={() => navigate('/editor/new')}
            >
              <Layers size={16} />
              <span>Launch Studio</span>
            </button>
            <button
              className="btn btn-ghost btn-large"
              onClick={() => navigate('/templates')}
            >
              <Sparkles size={16} />
              <span>View Templates</span>
            </button>
          </div>

          {/* Interactive DAG Interactive Preview Graphic */}
          <div className="hero-interactive-preview">
            <div className="preview-top-bar">
              <div className="window-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="preview-title">
                NODEVERSE STUDIO — E-Commerce Order Verification Pipeline
              </div>
              <div className="preview-top-right">
                <button
                  className="preview-sim-btn"
                  onClick={handleSimulateRun}
                  disabled={isSimulating}
                  title="Click to simulate live DAG execution"
                >
                  <RefreshCw size={12} className={isSimulating ? 'spin-fast' : ''} />
                  <span>{isSimulating ? 'Simulating Run...' : 'Simulate Run'}</span>
                </button>
                <div className="preview-status-badge">
                  <span className="ping-dot" />
                  <span>Deterministic Active</span>
                </div>
              </div>
            </div>

            <div className="preview-canvas-mock">
              {/* Node 1: Webhook */}
              <div className={`mock-node node-trigger ${simStep === 1 ? 'node-running' : ''} ${simStep >= 1 ? 'node-done' : ''}`}>
                <div className="mock-node-header">
                  <div className="mock-icon" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                    <Zap size={14} />
                  </div>
                  <div>
                    <div className="mock-category">TRIGGER</div>
                    <div className="mock-title">Order Webhook</div>
                  </div>
                </div>
                <div className="mock-body">
                  <span className="mock-chip chip-webhook">POST /webhooks/:id</span>
                </div>
                <span className={`mock-status-pill ${simStep >= 1 ? 'done' : 'idle'}`}>
                  {simStep >= 1 ? '✔ Received (0ms)' : 'Waiting'}
                </span>
              </div>

              <div className={`mock-connector-line ${simStep >= 1 ? 'animated-line' : ''}`} />

              {/* Node 2: Transform */}
              <div className={`mock-node node-transform ${simStep === 2 ? 'node-running' : ''} ${simStep >= 2 ? 'node-done' : ''}`}>
                <div className="mock-node-header">
                  <div className="mock-icon" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                    <Code2 size={14} />
                  </div>
                  <div>
                    <div className="mock-category">TRANSFORM</div>
                    <div className="mock-title">Normalize Cart</div>
                  </div>
                </div>
                <div className="mock-body">
                  <code>{'{ amount: 250, isVip: true }'}</code>
                </div>
                <span className={`mock-status-pill ${simStep >= 2 ? 'done' : simStep === 2 ? 'running' : 'idle'}`}>
                  {simStep >= 2 ? '✔ 12ms Done' : simStep === 2 ? '● Executing' : 'Queued'}
                </span>
              </div>

              <div className={`mock-connector-line ${simStep >= 2 ? 'animated-line' : ''}`} />

              {/* Node 3: Condition */}
              <div className={`mock-node node-condition ${simStep === 3 ? 'node-running' : ''} ${simStep >= 3 ? 'node-done' : ''}`}>
                <div className="mock-node-header">
                  <div className="mock-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                    <GitBranch size={14} />
                  </div>
                  <div>
                    <div className="mock-category">CONDITION</div>
                    <div className="mock-title">VIP Order &ge; $200?</div>
                  </div>
                </div>
                <div className="mock-body">
                  <span className="mock-chip chip-condition">Branch: TRUE</span>
                </div>
                <span className={`mock-status-pill ${simStep >= 3 ? 'done' : simStep === 3 ? 'running' : 'idle'}`}>
                  {simStep >= 3 ? '✔ Evaluated' : simStep === 3 ? '● Branching' : 'Queued'}
                </span>
              </div>

              <div className={`mock-connector-line ${simStep >= 3 ? 'animated-line' : ''}`} />

              {/* Node 4: VIP Queue */}
              <div className={`mock-node node-http ${simStep === 4 && isSimulating ? 'node-running' : ''} ${simStep >= 4 ? 'node-done' : ''}`}>
                <div className="mock-node-header">
                  <div className="mock-icon" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>
                    <RotateCw size={14} className={isSimulating && simStep === 4 ? 'spin-fast' : ''} />
                  </div>
                  <div>
                    <div className="mock-category">HTTP REQUEST</div>
                    <div className="mock-title">Dispatch Priority</div>
                  </div>
                </div>
                <div className="mock-body">
                  <code>POST https://api.fulfillment...</code>
                </div>
                <span className={`mock-status-pill ${simStep >= 4 && !isSimulating ? 'done' : simStep === 4 ? 'running' : 'idle'}`}>
                  {simStep >= 4 && !isSimulating ? '✔ 200 OK (42ms)' : simStep === 4 ? '● Dispatching' : 'Queued'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. METRIC TELEMETRY COUNTER ───────────────────────── */}
      <section className="landing-metrics-banner">
        <div className="landing-container metrics-inner">
          <div className="metric-col">
            <span className="metric-val">100%</span>
            <span className="metric-lbl">Deterministic DAG Order</span>
            <span className="metric-sub">Kahn's Topological Algorithm</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-col">
            <span className="metric-val">0 Cycles</span>
            <span className="metric-lbl">Pre-Execution Validation</span>
            <span className="metric-sub">Strict Graph Integrity Rejection</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-col">
            <span className="metric-val">{stats?.totalWorkflows ?? 3} Active</span>
            <span className="metric-lbl">Engine Blueprints</span>
            <span className="metric-sub">Distributed BullMQ & Redis Ready</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-col">
            <span className="metric-val">DLQ Recovery</span>
            <span className="metric-lbl">Section 06 Fault Handling</span>
            <span className="metric-sub">Bounded Retries + Jitter</span>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES SHOWCASE GRID (MongoDB Style Cards) ───── */}
      <section className="landing-features-section" id="features">
        <div className="landing-container">
          <div className="section-head text-center">
            <span className="section-badge-pill">ENGINEERING ARCHITECTURE</span>
            <h2 className="section-heading">
              Built for Resilient Distributed Orchestration
            </h2>
            <p className="section-desc">
              Every feature requested in the project abstract engineered with production rigor.
            </p>
          </div>

          <div className="features-card-grid">
            {/* Feature 1 */}
            <div className="feature-glow-card">
              <div className="feature-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                <Layers size={22} />
              </div>
              <h3 className="feature-card-title">Visual Directed Acyclic Graph (DAG)</h3>
              <p className="feature-card-text">
                Connect triggers, HTTP requests, data transformations, delays, and branch conditions on a visual canvas with glowing connection edges and live execution states.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-glow-card">
              <div className="feature-card-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 className="feature-card-title">Custom Cycle Detection</h3>
              <p className="feature-card-text">
                The engine evaluates graph connectivity using Kahn's topological sort before saving or running. Circular dependencies are rejected with detailed cycle trace paths.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-glow-card">
              <div className="feature-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <GitBranch size={22} />
              </div>
              <h3 className="feature-card-title">Conditional TRUE / FALSE Branching</h3>
              <p className="feature-card-text">
                Condition nodes evaluate JavaScript expressions and route outputs to dedicated TRUE or FALSE branch ports, automatically pruning inactive downstream tasks.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-glow-card">
              <div className="feature-card-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
                <RotateCw size={22} />
              </div>
              <h3 className="feature-card-title">Bounded Retries with Exponential Jitter</h3>
              <p className="feature-card-text">
                Transient HTTP failures trigger automatic retries with exponential backoff and randomized jitter to protect against cascading failure and API throttling.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="feature-glow-card">
              <div className="feature-card-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fcd34d' }}>
                <Activity size={22} />
              </div>
              <h3 className="feature-card-title">Dead-Letter Queue (DLQ) Recovery</h3>
              <p className="feature-card-text">
                Tasks that exhaust configured retry caps are safely isolated into the Dead-Letter Queue with full context, payload history, and 1-click deterministic replay.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="feature-glow-card">
              <div className="feature-card-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <Terminal size={22} />
              </div>
              <h3 className="feature-card-title">Live Execution Streaming (SSE)</h3>
              <p className="feature-card-text">
                Server-Sent Events stream live per-node execution telemetry, duration timestamps, and log output directly to the browser canvas while runs are in progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. 6-STEP PROCESS FLOW (Abstract Section) ─────────── */}
      <section className="landing-process-section" id="how-it-works">
        <div className="landing-container">
          <div className="section-head text-center">
            <span className="section-badge-pill">PROCESS FLOW OF THE WEBSITE</span>
            <h2 className="section-heading">How NodeVerse Orchestrates Workflows</h2>
            <p className="section-desc">
              From visual design to failure recovery in 6 deterministic stages.
            </p>
          </div>

          <div className="process-timeline-grid">
            <div className="timeline-step-card">
              <div className="step-tag">01 DESIGN</div>
              <h4 className="step-title">Visual Canvas</h4>
              <p className="step-text">Build the workflow by dragging nodes, configuring parameters, and connecting dependencies.</p>
            </div>
            <div className="timeline-step-card">
              <div className="step-tag">02 VALIDATE</div>
              <h4 className="step-title">Cycle Detection</h4>
              <p className="step-text">Verify settings and analyze topological ordering to detect and reject cycles before saving.</p>
            </div>
            <div className="timeline-step-card">
              <div className="step-tag">03 TRIGGER</div>
              <h4 className="step-title">Multi-Pattern Run</h4>
              <p className="step-text">Start a run manually, through an inbound HTTP POST webhook, or from a cron schedule.</p>
            </div>
            <div className="timeline-step-card">
              <div className="step-tag">04 EXECUTE</div>
              <h4 className="step-title">Topological Dispatch</h4>
              <p className="step-text">Calculate deterministic order and execute each node only after prerequisite parents succeed.</p>
            </div>
            <div className="timeline-step-card">
              <div className="step-tag">05 OBSERVE</div>
              <h4 className="step-title">Live Telemetry</h4>
              <p className="step-text">Persist inputs, outputs, timestamps and error logs; stream live updates to canvas via SSE.</p>
            </div>
            <div className="timeline-step-card">
              <div className="step-tag">06 RECOVER</div>
              <h4 className="step-title">DLQ & Replay</h4>
              <p className="step-text">Retry with backoff; route exhausted failures to a dead-letter queue for review and replay.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. IMPORTANT REMARKS (Decoupled vs Sequential) ──── */}
      <section className="landing-comparison-section" id="why-nodeverse">
        <div className="landing-container">
          <div className="comparison-banner-card">
            <div className="banner-left">
              <span className="section-badge-pill" style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                WHY NODEVERSE ARCHITECTURE WINS
              </span>
              <h2 className="banner-heading">Decoupled Workers & Durable State Execution</h2>
              <p className="banner-desc">
                In naive workflow tools, all nodes execute sequentially inside a single HTTP request thread. A slow network call locks the server, and a crash loses in-flight execution state.
              </p>
              <div className="why-wins-box">
                <strong>Why NodeVerse Wins:</strong>
                <span> State is persisted durably, tasks are dispatched through background worker queues, topological dependencies guarantee execution order, and transient network errors are isolated into Dead-Letter queues instead of crashing downstream runs.</span>
              </div>
            </div>

            <div className="banner-right-table" style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div className="arch-table-row">
                <span className="arch-label">Execution Model</span>
                <span className="arch-val" style={{ color: '#c084fc' }}>Topological Kahn's DAG</span>
              </div>
              <div className="arch-table-row">
                <span className="arch-label">Task Queue</span>
                <span className="arch-val" style={{ color: '#22d3ee' }}>Decoupled Async Workers</span>
              </div>
              <div className="arch-table-row">
                <span className="arch-label">Cycle Safety</span>
                <span className="arch-val" style={{ color: '#34d399' }}>Pre-Flight Verification</span>
              </div>
              <div className="arch-table-row">
                <span className="arch-label">Failure Recovery</span>
                <span className="arch-val" style={{ color: '#fb7185' }}>Dead-Letter Queue (DLQ)</span>
              </div>
              <div className="arch-table-row">
                <span className="arch-label">Telemetry</span>
                <span className="arch-val" style={{ color: '#fcd34d' }}>Live Server-Sent Events</span>
              </div>
              <div className="arch-table-row">
                <span className="arch-label">Trigger Modes</span>
                <span className="arch-val" style={{ color: '#818cf8' }}>Webhooks, Cron & Manual</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FINAL GET STARTED BANNER (MongoDB / Supabase Style) ── */}
      <section className="landing-cta-banner-section" id="get-started">
        <div className="landing-container">
          <div className="final-cta-card">
            <div className="final-cta-glow" />
            <div className="final-cta-content">
              <span className="section-badge-pill" style={{ color: '#22d3ee' }}>READY TO AUTOMATE?</span>
              <h2 className="final-cta-title">
                Build your first workflow graph in seconds.
              </h2>
              <p className="final-cta-desc">
                Connect triggers, call APIs, transform payloads, and execute dependency-safe DAGs with live visual telemetry in the NodeVerse Console.
              </p>
              <div className="final-cta-buttons">
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => navigate('/app')}
                >
                  <span>Launch NodeVerse Console</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  className="btn btn-ghost btn-large"
                  onClick={() => navigate('/editor/new')}
                >
                  <Layers size={16} />
                  <span>Open Studio Canvas</span>
                </button>
                <button
                  className="btn btn-ghost btn-large"
                  onClick={() => navigate('/templates')}
                >
                  <Sparkles size={16} />
                  <span>Explore Templates</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. SAAS FOOTER (MongoDB / Linear Style) ────────────── */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div className="footer-top-grid">
            <div className="footer-brand-col">
              <div className="footer-logo">
                <span className="nav-logo-text">
                  NODE<span className="nav-logo-accent">VERSE</span>
                </span>
              </div>
              <p className="footer-tagline">
                The visual directed acyclic graph (DAG) workflow automation and distributed execution engine.
              </p>
              <div className="footer-status-indicator">
                <span className="footer-status-ping" />
                <span>All Systems Operational • Engine Online</span>
              </div>
            </div>

            <div className="footer-links-col">
              <h5 className="footer-col-title">Product</h5>
              <ul className="footer-links-list">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">Process Flow</a></li>
                <li><a href="#why-nodeverse">Architecture</a></li>
                <li><button onClick={() => navigate('/templates')} className="footer-link-btn">Template Library</button></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h5 className="footer-col-title">Platform</h5>
              <ul className="footer-links-list">
                <li><button onClick={() => navigate('/app')} className="footer-link-btn">Console Hub</button></li>
                <li><button onClick={() => navigate('/workflows')} className="footer-link-btn">Workflow Catalog</button></li>
                <li><button onClick={() => navigate('/editor/new')} className="footer-link-btn">Studio Canvas</button></li>
                <li><button onClick={() => navigate('/webhooks')} className="footer-link-btn">Webhook Hub</button></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h5 className="footer-col-title">Reliability</h5>
              <ul className="footer-links-list">
                <li><button onClick={() => navigate('/runs')} className="footer-link-btn">Execution Telemetry</button></li>
                <li><button onClick={() => navigate('/dead-letters')} className="footer-link-btn">Dead-Letter Queue</button></li>
                <li><span>Kahn's Cycle Detection</span></li>
                <li><span>Bounded Jitter Retries</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <div className="footer-copyright">
              © {new Date().getFullYear()} NodeVerse Automation Engine. Distributed DAG Task Processing.
            </div>
            <div className="footer-bottom-links">
              <button onClick={() => navigate('/app')} className="footer-bottom-btn">Launch Console →</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
