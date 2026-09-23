import React, { useState } from 'react';
import { BarChart2, Check, X, AlertTriangle, DollarSign, Activity, ChevronRight, ChevronDown } from 'lucide-react';
import { CategoryBadge } from './Badges';

const API_BASE = 'http://127.0.0.1:8000';

const ENGINES = [
  { value: 'hybrid', label: 'Hybrid (Auto-route)' },
  { value: 'groq', label: 'Groq (gpt-oss-120b)' },
  { value: 'laya', label: 'Laya (Local)' },
];

function StatCard({ label, value, sub, accent }) {
  const accentColor = accent === 'green' ? '#15803D' : accent === 'amber' ? '#D97706' : accent === 'red' ? '#DC2626' : '#1E40AF';
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: '6px',
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: accentColor, fontFamily: 'monospace', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '12px', color: '#475569', width: '120px', flexShrink: 0, textTransform: 'capitalize' }}>
        {label.replace(/_/g, ' ')}
      </span>
      <div style={{ flex: 1, height: '5px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#1E40AF', borderRadius: '3px' }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#64748B', width: '36px', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function EvalView() {
  const [report, setReport] = useState(null);
  const [provider, setProvider] = useState('hybrid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMisclass, setShowMisclass] = useState(true);

  const runEval = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/evaluate?provider=${provider}`);
      if (!r.ok) throw new Error('Evaluation failed');
      const data = await r.json();
      setReport(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const acc = report ? Math.round((report.accuracy || 0) * 100) : null;
  const accColor = acc == null ? 'blue' : acc >= 80 ? 'green' : acc >= 60 ? 'amber' : 'red';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Evaluation Suite</h2>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
            F1 scoring against ground truth dataset
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            disabled={loading}
            style={{
              padding: '6px 10px',
              border: '1px solid #E2E8F0',
              borderRadius: '5px',
              fontSize: '12.5px',
              color: '#0F172A',
              background: '#fff',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {ENGINES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          <button
            onClick={runEval}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 14px',
              border: 'none',
              borderRadius: '5px',
              background: loading ? '#64748B' : '#1E40AF',
              color: '#fff',
              fontSize: '12.5px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <BarChart2 size={13} />
            {loading ? 'Running…' : 'Run Evaluation'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 12px', border: '1px solid #FECACA', borderRadius: '5px', background: '#FEF2F2', color: '#991B1B', fontSize: '12.5px' }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
          <div style={{
            width: '24px', height: '24px',
            border: '2px solid #E2E8F0', borderTop: '2px solid #1E40AF',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ margin: 0, fontSize: '13px' }}>Running evaluation against ground truth…</p>
        </div>
      )}

      {/* Placeholder */}
      {!loading && !report && (
        <div style={{ border: '1px dashed #E2E8F0', borderRadius: '6px', padding: '48px 24px', textAlign: 'center', color: '#CBD5E1' }}>
          <BarChart2 size={28} style={{ marginBottom: '10px', opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '13px' }}>Run evaluation to see F1 scores, accuracy, and misclassifications</p>
        </div>
      )}

      {/* Report */}
      {report && !loading && (
        <>
          {/* Top stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            <StatCard label="Accuracy" value={`${acc}%`} sub={`${report.correct || 0} / ${report.total || 0} correct`} accent={accColor} />
            <StatCard label="Macro F1" value={`${Math.round((report.macro_f1 || 0) * 100)}%`} sub="macro average" accent={accColor} />
            <StatCard label="Total" value={report.total || 0} sub="test cases" accent="blue" />
            <StatCard label="Correct" value={report.correct || 0} sub="matched ground truth" accent="green" />
            <StatCard label="Failures" value={(report.total || 0) - (report.correct || 0)} sub="misclassified" accent="red" />
            {report.avg_latency_ms != null && (
              <StatCard label="Avg Latency" value={`${Math.round(report.avg_latency_ms)}ms`} sub="per message" accent="blue" />
            )}
            {report.estimated_cost_usd != null && (
              <StatCard label="Est. Cost" value={`$${report.estimated_cost_usd.toFixed(4)}`} sub="USD for this run" accent="amber" />
            )}
          </div>

          {/* Per-class F1 scores */}
          {report.per_class_f1 && Object.keys(report.per_class_f1).length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}>
                Per-Class F1 Scores
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(report.per_class_f1).map(([cls, f1]) => (
                  <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CategoryBadge category={cls} />
                    <div style={{ flex: 1, height: '5px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.round(f1 * 100)}%`,
                        height: '100%',
                        background: f1 >= 0.8 ? '#15803D' : f1 >= 0.6 ? '#D97706' : '#DC2626',
                        borderRadius: '3px',
                      }} />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: '#0F172A', minWidth: '36px', textAlign: 'right' }}>
                      {Math.round(f1 * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latency percentiles */}
          {report.latency_percentiles && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}>
                Latency Percentiles
              </div>
              <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {Object.entries(report.latency_percentiles).map(([p, v]) => (
                  <div key={p}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{p}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: '2px' }}>
                      {typeof v === 'number' ? `${Math.round(v)}ms` : v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Misclassifications */}
          {report.misclassifications && report.misclassifications.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                onClick={() => setShowMisclass(!showMisclass)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: 'none',
                  borderBottom: showMisclass ? '1px solid #E2E8F0' : 'none',
                  background: '#F8FAFC',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  textAlign: 'left',
                }}
              >
                {showMisclass ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Misclassifications
                </span>
                <span style={{
                  marginLeft: '6px',
                  background: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FECACA',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '1px 7px',
                }}>
                  {report.misclassifications.length}
                </span>
              </button>

              {showMisclass && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E2E8F0' }}>
                        {['Message', 'Expected', 'Got', 'Confidence'].map(h => (
                          <th key={h} style={{
                            padding: '8px 12px',
                            textAlign: 'left',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#64748B',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.misclassifications.map((m, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                          <td style={{ padding: '8px 12px', maxWidth: '240px' }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155', fontSize: '12px' }}
                              title={m.payload}>
                              {String(m.payload).slice(0, 60)}{String(m.payload).length > 60 ? '…' : ''}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <CategoryBadge category={m.expected} />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <CategoryBadge category={m.predicted} />
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '12px', color: '#475569' }}>
                            {m.confidence != null ? `${Math.round(m.confidence * 100)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
