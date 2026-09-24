import React from 'react';

/* ── Category Badge ── */
const CAT_CLASS = {
  billing:         'cat-billing',
  auth:            'cat-auth',
  outage:          'cat-outage',
  bug_report:      'cat-bug_report',
  feature_request: 'cat-feature_request',
  feedback:        'cat-feedback',
  security_flag:   'cat-security_flag',
  out_of_scope:    'cat-out_of_scope',
  unclassifiable:  'cat-unclassifiable',
};

export function CategoryBadge({ category }) {
  const cls = CAT_CLASS[category] || 'cat-unclassifiable';
  return (
    <span className={`badge ${cls}`} style={{ textTransform: 'capitalize' }}>
      {(category || 'unknown').replace(/_/g, ' ')}
    </span>
  );
}

/* ── Priority Badge ── */
export function PriorityBadge({ priority }) {
  const cls = `prio-${priority}` in {'prio-P0':1,'prio-P1':1,'prio-P2':1,'prio-P3':1}
    ? `prio-${priority}` : 'prio-P3';
  return <span className={`badge ${cls}`}>{priority || 'P3'}</span>;
}

/* ── Tier Badge ── */
export function TierBadge({ tier }) {
  const s = String(tier || '').toLowerCase();
  const isLaya     = s.includes('laya');
  const isFallback = s.includes('fallback');
  return (
    <span className="badge" style={{
      background: 'var(--bg-hover)',
      color: 'var(--text-2)',
      border: '1px solid var(--border)',
      fontFamily: 'monospace',
      fontSize: '11px',
    }}>
      {isLaya ? 'Laya' : 'Groq'}{isFallback ? ' ↩' : ''}
    </span>
  );
}

/* ── Confidence Bar ── */
export function ConfidenceBar({ confidence }) {
  const pct   = Math.round((confidence || 0) * 100);
  const color = pct >= 80 ? 'var(--accent)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        flex: 1, height: '3px',
        background: 'var(--border)',
        borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color, borderRadius: '2px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        fontFamily: 'monospace', fontSize: '11.5px',
        fontWeight: 600, color,
        minWidth: '30px', textAlign: 'right',
      }}>
        {pct}%
      </span>
    </div>
  );
}

/* ── Human Badge ── */
export function HumanBadge({ needs }) {
  return (
    <span className="badge" style={{
      background: needs ? 'var(--amber-bg)' : 'var(--bg-hover)',
      color:      needs ? 'var(--amber-text)' : 'var(--text-3)',
      border:     needs ? '1px solid rgba(217,119,6,0.2)' : '1px solid var(--border)',
    }}>
      {needs ? 'Required' : 'No'}
    </span>
  );
}
