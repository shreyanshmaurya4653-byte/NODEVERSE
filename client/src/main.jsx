import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#090915',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{
            maxWidth: 600,
            background: '#12122b',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
          }}>
            <h2 style={{ color: '#f43f5e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ Application Interface Error
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 16 }}>
              A rendering error occurred while loading this view:
            </p>
            <pre style={{
              background: 'rgba(0,0,0,0.5)',
              padding: 14,
              borderRadius: 6,
              color: '#fda4af',
              fontSize: '0.8rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              style={{
                marginTop: 20,
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Return to Workflows Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
