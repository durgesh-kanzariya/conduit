import React from 'react';
import { Zap } from 'lucide-react';

export default function FooterSection({ onSelectTab }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      paddingTop: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '18px',
            height: '18px',
            background: 'var(--text-1)',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Zap size={11} color="var(--bg-panel)" strokeWidth={2.6} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
            Conduit AI
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            — Frontline Decision Routing Engine
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--text-2)' }}>
          <button
            onClick={() => onSelectTab('triage')}
            style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
          >
            Triage Console
          </button>
          <button
            onClick={() => onSelectTab('batch')}
            style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
          >
            Batch Processor
          </button>
          <button
            onClick={() => onSelectTab('eval')}
            style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
          >
            Benchmark Eval
          </button>
        </div>
      </div>

      <div style={{
        fontSize: '11.5px',
        color: 'var(--text-3)',
        lineHeight: 1.6,
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span>FastAPI + ORJSON backend • ModernBERT (convaiinnovations/laya) • Groq LLaMA-3.3-70B • React + Vite</span>
        <span>Deterministic JSON schema • Calibrated confidence</span>
      </div>
    </footer>
  );
}
