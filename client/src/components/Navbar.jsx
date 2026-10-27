import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  History,
  Plus,
  Zap,
  ShieldAlert,
  Layers,
  ArrowRight,
  Home,
  LayoutGrid,
  Sparkles,
  Activity,
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we are on the public marketing landing page
  const isLandingPage = location.pathname === '/';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Clean Logo */}
        <a
          href="/"
          className="nav-logo"
          onClick={e => {
            e.preventDefault();
            navigate(isLandingPage ? '/' : '/app');
          }}
        >
          <div className="nav-logo-icon">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="none" stroke="url(#navGrad)" strokeWidth="2.5" />
              <circle cx="16" cy="16" r="4.5" fill="url(#navGrad)" />
              <line x1="16" y1="2" x2="16" y2="11.5" stroke="url(#navGrad)" strokeWidth="2" />
              <line x1="16" y1="20.5" x2="16" y2="30" stroke="url(#navGrad)" strokeWidth="2" />
              <line x1="30" y1="10" x2="20.5" y2="14" stroke="url(#navGrad)" strokeWidth="2" />
              <line x1="2" y1="10" x2="11.5" y2="14" stroke="url(#navGrad)" strokeWidth="2" />
              <defs>
                <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="nav-logo-text-group">
            <span className="nav-logo-text">
              NODE<span className="nav-logo-accent">VERSE</span>
            </span>
            {!isLandingPage && (
              <span className="nav-logo-badge" style={{ color: '#22d3ee', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                CONSOLE
              </span>
            )}
          </div>
        </a>

        {/* ── MODE 1: PUBLIC LANDING PAGE NAVBAR ────────────────── */}
        {isLandingPage ? (
          <>
            <nav className="nav-links">
              <a href="#features" className="nav-link">
                <Sparkles size={14} />
                <span>Features</span>
              </a>
              <a href="#how-it-works" className="nav-link">
                <Layers size={14} />
                <span>How It Works</span>
              </a>
              <a href="#why-nodeverse" className="nav-link">
                <Activity size={14} />
                <span>Why NodeVerse</span>
              </a>
            </nav>

            <div className="nav-actions">
              <button
                className="btn btn-primary btn-sm nav-get-started-btn"
                onClick={() => navigate('/app')}
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        ) : (
          /* ── MODE 2: APP CONSOLE WORKSPACE (Streamlined Core Tabs) ──── */
          <>
            <nav className="nav-links">
              <NavLink
                to="/app"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end
              >
                <LayoutGrid size={14} />
                <span>Console</span>
              </NavLink>
              <NavLink
                to="/editor/new"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Layers size={14} />
                <span>Studio</span>
              </NavLink>
              <NavLink
                to="/runs"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <History size={14} />
                <span>Executions</span>
              </NavLink>
              <NavLink
                to="/webhooks"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Zap size={14} />
                <span>Webhooks</span>
              </NavLink>
              <NavLink
                to="/dead-letters"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <ShieldAlert size={14} />
                <span>DLQ</span>
              </NavLink>
            </nav>

            <div className="nav-actions">
              <div className="engine-status-pill compact" title="DAG Engine & Worker Queue Active">
                <span className="status-ping" />
                <span>Online</span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/editor/new')}
                title="Create a new workflow"
              >
                <Plus size={14} />
                <span>New Workflow</span>
              </button>
              <button
                className="btn btn-ghost btn-sm nav-website-btn"
                title="Return to Public Website"
                onClick={() => navigate('/')}
              >
                <Home size={14} />
                <span>Website</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
