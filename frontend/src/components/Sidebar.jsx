import React from 'react';
import { MessageSquare, Layers, BarChart2, Circle } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'triage', label: 'Triage', icon: MessageSquare },
  { id: 'batch', label: 'Batch Runner', icon: Layers },
  { id: 'eval', label: 'Evaluation', icon: BarChart2 },
];

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: '#111827',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '24px', height: '24px',
            background: '#1E40AF',
            borderRadius: '5px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageSquare size={13} color="#fff" />
          </div>
          <span style={{
            color: '#F1F5F9',
            fontWeight: 600,
            fontSize: '14.5px',
            letterSpacing: '-0.2px',
          }}>
            Frontline
          </span>
        </div>
        <div style={{
          marginTop: '4px',
          paddingLeft: '33px',
          fontSize: '11px',
          color: '#475569',
          fontWeight: 400,
        }}>
          AI Triage System
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#374151', letterSpacing: '0.08em', textTransform: 'uppercase', paddingLeft: '10px', marginBottom: '6px' }}>
          Workspace
        </div>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '7px 10px',
                marginBottom: '2px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: active ? 'rgba(30,64,175,0.18)' : 'transparent',
                color: active ? '#93C5FD' : '#9CA3AF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13.5px',
                fontWeight: active ? 500 : 400,
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = '#D1D5DB';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#9CA3AF';
                }
              }}
            >
              <Icon size={14} />
              <span>{label}</span>
              {active && (
                <div style={{
                  marginLeft: 'auto',
                  width: '5px', height: '5px',
                  borderRadius: '50%',
                  background: '#3B82F6',
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer status */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
      }}>
        <div style={{
          width: '7px', height: '7px',
          borderRadius: '50%',
          background: '#22C55E',
          boxShadow: '0 0 0 2px rgba(34,197,94,0.2)',
        }} />
        <span style={{ fontSize: '12px', color: '#6B7280' }}>System Online</span>
      </div>
    </aside>
  );
}
