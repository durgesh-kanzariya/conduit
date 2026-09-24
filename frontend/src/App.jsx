import React, { useState, useEffect } from 'react';
import TopNav from './components/TopNav';
import LandingPage from './components/LandingPage';
import TriageView from './components/TriageView';
import BatchView from './components/BatchView';
import EvalView from './components/EvalView';
import { EngineProvider } from './context/EngineContext';

const DASHBOARD_VIEWS = {
  triage: TriageView,
  batch:  BatchView,
  eval:   EvalView,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'triage' | 'batch' | 'eval'
  const [theme, setTheme] = useState(() => localStorage.getItem('conduit-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('conduit-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <EngineProvider>
      <AppContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </EngineProvider>
  );
}

function AppContent({ activeTab, setActiveTab, theme, toggleTheme }) {
  /* ── Landing / Home view ── */
  if (activeTab === 'home') {
    return (
      <LandingPage
        onSelectTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  /* ── Workspace / Tool views (Triage, Batch, Eval) ── */
  const ActiveView = DASHBOARD_VIEWS[activeTab] || TriageView;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      transition: 'background 0.2s',
    }}>
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '32px 24px 64px',
        boxSizing: 'border-box',
      }}>
        <div key={activeTab} className="fade-in">
          <ActiveView />
        </div>
      </main>
    </div>
  );
}
