import React from 'react';

// Pill badge for category
export function CategoryBadge({ category }) {
  const map = {
    billing:         { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    auth:            { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    outage:          { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
    bug_report:      { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    feature_request: { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
    feedback:        { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
    security_flag:   { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    out_of_scope:    { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
    unclassifiable:  { bg: '#F8FAFC', color: '#94A3B8', border: '#E2E8F0' },
  };
  const style = map[category] || map.unclassifiable;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '3px',
      fontSize: '11.5px',
      fontWeight: 500,
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {(category || 'unknown').replace(/_/g, ' ')}
    </span>
  );
}

// Priority badge
export function PriorityBadge({ priority }) {
  const map = {
    P0: { bg: '#7F1D1D', color: '#FEE2E2', border: '#991B1B' },
    P1: { bg: '#78350F', color: '#FEF3C7', border: '#92400E' },
    P2: { bg: '#1E3A5F', color: '#DBEAFE', border: '#1E40AF' },
    P3: { bg: '#1E293B', color: '#CBD5E1', border: '#334155' },
  };
  const style = map[priority] || map.P3;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '1px 7px',
      borderRadius: '3px',
      fontSize: '11.5px',
      fontWeight: 700,
      fontFamily: 'monospace',
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      letterSpacing: '0.03em',
    }}>
      {priority}
    </span>
  );
}

// Tier badge - understated
export function TierBadge({ tier }) {
  const isLaya = String(tier).toLowerCase().includes('laya');
  const isFallback = String(tier).toLowerCase().includes('fallback');
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '1px 7px',
      borderRadius: '3px',
      fontSize: '11px',
      fontWeight: 500,
      fontFamily: 'monospace',
      background: isFallback ? '#FFF7ED' : isLaya ? '#F0FDF4' : '#F8FAFC',
      color: isFallback ? '#C2410C' : isLaya ? '#15803D' : '#475569',
      border: `1px solid ${isFallback ? '#FED7AA' : isLaya ? '#BBF7D0' : '#E2E8F0'}`,
    }}>
      {isLaya ? '⚡' : '☁'} {isLaya ? 'Laya' : 'Groq'}{isFallback ? ' (fb)' : ''}
    </span>
  );
}

// Confidence bar
export function ConfidenceBar({ confidence }) {
  const pct = Math.round((confidence || 0) * 100);
  const color = pct >= 80 ? '#15803D' : pct >= 60 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1,
        height: '4px',
        background: '#E2E8F0',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: '2px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        fontFamily: 'monospace',
        fontSize: '11.5px',
        fontWeight: 600,
        color: color,
        minWidth: '32px',
        textAlign: 'right',
      }}>{pct}%</span>
    </div>
  );
}

// Human flag indicator
export function HumanBadge({ needs }) {
  return (
    <span style={{
      fontSize: '11.5px',
      fontWeight: 500,
      color: needs ? '#92400E' : '#475569',
    }}>
      {needs ? 'Yes' : 'No'}
    </span>
  );
}
