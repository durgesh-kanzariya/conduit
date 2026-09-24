import React from 'react';
import { Zap, Layers, BarChart2, Home, Sun, Moon, Activity, Download } from 'lucide-react';
import { useEngine } from '../context/EngineContext';

const TABS = [
  { id: 'home',   label: 'Home',         Icon: Home },
  { id: 'triage', label: 'Triage',       Icon: Zap },
  { id: 'batch',  label: 'Batch Runner', Icon: Layers },
  { id: 'eval',   label: 'Evaluation',   Icon: BarChart2 },
];

export default function TopNav({ activeTab, onSelectTab, theme, onToggleTheme }) {
  const { layaAvailable, openDownloadModal } = useEngine();
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      height: '52px',
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      transition: 'background 0.2s, border-color 0.2s',
      userSelect: 'none',
    }}>
      {/* ── Brand / Logo ── */}
      <button
        onClick={() => onSelectTab('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: 'var(--radius)',
          marginRight: '8px',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        title="Go to Home"
      >
        <div style={{
          width: '22px',
          height: '22px',
          background: 'var(--text-1)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Zap size={12} color="var(--bg-panel)" strokeWidth={2.6} />
        </div>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-1)',
          letterSpacing: '-0.3px',
          fontFamily: 'Inter, sans-serif',
        }}>
          Conduit
        </span>
      </button>

      {/* Subtle version badge */}
      <span style={{
        fontSize: '10.5px',
        fontWeight: 500,
        color: 'var(--text-3)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '1px 5px',
        background: 'var(--bg)',
        letterSpacing: '0.02em',
        marginRight: '16px',
      }}>
        v2.4
      </span>

      {/* Vertical separator */}
      <div style={{
        width: '1px',
        height: '18px',
        background: 'var(--border)',
        marginRight: '12px',
      }} />

      {/* ── Main Navigation Tabs ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onSelectTab(id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 11px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: isActive ? 'var(--bg-active)' : 'transparent',
                color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                cursor: 'pointer',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-1)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-2)';
                }
              }}
            >
              <Icon
                size={13.5}
                color={isActive ? 'var(--text-1)' : 'var(--text-3)'}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              {label}
            </button>
          );
        })}
      </nav>

      {/* ── Right Telemetry & Controls ── */}
      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        {/* Engine status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {layaAvailable ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '4px 10px',
              borderRadius: 'var(--radius)',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              fontSize: '12px',
              color: 'var(--text-2)',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 0 2px var(--accent-bg)',
              }} />
              <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>ModernBERT</span>
              <span style={{ color: 'var(--text-4)' }}>/</span>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-3)' }}>&lt;50ms (PC)</span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                color: 'var(--text-2)',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--purple)',
                  boxShadow: '0 0 0 2px rgba(124, 58, 237, 0.2)',
                }} />
                <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>Groq Cloud</span>
              </div>

              <button
                onClick={openDownloadModal}
                title="Laya (ModernBERT) runs locally on PC. Click for download & run guide."
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--amber-bg)',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--amber-text)',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                <Download size={11} />
                <span>Run Laya Locally</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '30px',
            height: '30px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'transparent',
            color: 'var(--text-2)',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-2)';
          }}
        >
          {theme === 'light' ? <Moon size={13.5} /> : <Sun size={13.5} />}
        </button>
      </div>
    </header>
  );
}
