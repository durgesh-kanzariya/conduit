import React from 'react';
import { Zap, Layers, BarChart2 } from 'lucide-react';

const NAV = [
  { id: 'triage', label: 'Triage',       Icon: Zap },
  { id: 'batch',  label: 'Batch Runner', Icon: Layers },
  { id: 'eval',   label: 'Evaluation',   Icon: BarChart2 },
];

export default function Sidebar({ activeView, onNavigate, onHome }) {
  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      transition: 'background 0.2s, border-color 0.2s',
    }}>

      {/* Logo */}
      <button
        onClick={onHome}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '16px 16px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'transparent', border: 'none',
          cursor: 'pointer', width: '100%', textAlign: 'left',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        title="Back to home"
      >
          <div style={{
            width: '22px', height: '22px',
            background: 'var(--text-1)',
            borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Zap size={12} color="var(--bg-sidebar)" strokeWidth={2.5} />
          </div>
          <span style={{
            fontSize: '14px', fontWeight: 600,
            color: 'var(--text-1)', letterSpacing: '-0.2px',
          }}>
            Conduit
          </span>
      </button>

      {/* Nav */}
      <nav style={{ padding: '8px 8px', flex: 1 }}>
        <div style={{
          fontSize: '10.5px', fontWeight: 600,
          color: 'var(--text-4)', letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '8px 8px 4px',
        }}>
          Workspace
        </div>

        {NAV.map(({ id, label, Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 8px',
                marginBottom: '1px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: active ? 'var(--bg-active)' : 'transparent',
                color: active ? 'var(--text-1)' : 'var(--text-2)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13.5px',
                fontWeight: active ? 500 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.1s, color 0.1s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-1)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-2)';
                }
              }}
            >
              {/* Active indicator */}
              {active && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: '2px', borderRadius: '0 2px 2px 0',
                  background: 'var(--text-1)',
                }} />
              )}
              <Icon size={14} strokeWidth={active ? 2 : 1.7} style={{ flexShrink: 0 }} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Status */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <div style={{
          width: '6px', height: '6px',
          borderRadius: '50%',
          background: 'var(--accent)',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 400 }}>
          Connected
        </span>
      </div>
    </aside>
  );
}
