import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AppConsole from './pages/AppConsole.jsx';
import Dashboard from './pages/Dashboard.jsx';
import WorkflowEditor from './pages/WorkflowEditor.jsx';
import RunHistory from './pages/RunHistory.jsx';
import DeadLetterQueue from './pages/DeadLetterQueue.jsx';
import WebhookHub from './pages/WebhookHub.jsx';
import Templates from './pages/Templates.jsx';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Landing Page */}
          <Route path="/"               element={<LandingPage />} />

          {/* App Console & All Operational Workspaces */}
          <Route path="/app"            element={<AppConsole />} />
          <Route path="/workflows"      element={<Dashboard />} />
          <Route path="/editor/:id"     element={<WorkflowEditor />} />
          <Route path="/editor/new"     element={<WorkflowEditor />} />
          <Route path="/runs"           element={<RunHistory />} />
          <Route path="/runs/:id"       element={<RunHistory />} />
          <Route path="/dead-letters"   element={<DeadLetterQueue />} />
          <Route path="/webhooks"       element={<WebhookHub />} />
          <Route path="/templates"      element={<Templates />} />

          {/* Redirect deprecated architecture route to App Console */}
          <Route path="/architecture"   element={<Navigate to="/app" replace />} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
