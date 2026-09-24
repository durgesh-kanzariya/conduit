import React from 'react';
import { Zap, Layers, BarChart2, Home, Sun, Moon, Github } from 'lucide-react';

const TABS = [
  { id: 'home',   label: 'Home',         Icon: Home },
  { id: 'triage', label: 'Triage',       Icon: Zap },
  { id: 'batch',  label: 'Batch Runner', Icon: Layers },
  { id: 'eval',   label: 'Evaluation',   Icon: BarChart2 },
];

export default function TopNav({ activeTab, onSelectTab, theme, onToggleTheme }) {
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
          marginRight: '12px',
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

      {/* ── Right Controls ── */}
      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        {/* GitHub link */}
        <a
          href="https://github.com/durgesh-kanzariya/frontline-ai-triage"
          target="_blank"
          rel="noreferrer"
          title="GitHub Repository"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-2)',
            fontSize: '12.5px',
            fontFamily: 'Inter, sans-serif',
            textDecoration: 'none',
            transition: 'background 0.12s, color 0.12s, border-color 0.12s',
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
          <Github size={13.5} />
          <span>GitHub</span>
        </a>

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
