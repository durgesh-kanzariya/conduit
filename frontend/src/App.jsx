import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TriageView from './components/TriageView';
import BatchView from './components/BatchView';
import EvalView from './components/EvalView';

const VIEWS = {
  triage: TriageView,
  batch: BatchView,
  eval: EvalView,
};

const VIEW_LABELS = {
  triage: 'Triage',
  batch: 'Batch Runner',
  eval: 'Evaluation',
};

export default function App() {
  const [view, setView] = useState('triage');
  const ActiveView = VIEWS[view] || TriageView;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar activeView={view} onNavigate={setView} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: '48px',
          borderBottom: '1px solid #E2E8F0',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '6px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>Workspace</span>
          <span style={{ fontSize: '12px', color: '#CBD5E1' }}>/</span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#0F172A' }}>{VIEW_LABELS[view]}</span>
        </header>

        {/* View content */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <ActiveView />
        </main>
      </div>
    </div>
  );
}
