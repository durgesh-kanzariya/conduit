import React, { useState, useEffect } from 'react';
import { BarChart2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { CategoryBadge } from './Badges';
import { API_BASE } from '../config';
import { useEngine } from '../context/EngineContext';

const S = {
  card: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    transition: 'background 0.2s, border-color 0.2s',
  },
  label: {
    fontSize: '11px', fontWeight: 600,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: '4px', display: 'block',
  },
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 11px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'transparent',
    color: 'var(--text-2)', fontSize: '12.5px', fontWeight: 400,
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
  },
  select: {
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-2)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '12.5px',
    outline: 'none', cursor: 'pointer',
    padding: '5px 8px',
    borderRadius: 'var(--radius)',
  },
};

/* ── Stat card ── */
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ ...S.card, padding: '14px 16px' }}>
      <div style={S.label}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: color || 'var(--text-1)', fontFamily: 'monospace', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

/* ── F1 bar ── */
function F1Bar({ category, f1 }) {
  const pct   = Math.round(f1 * 100);
  const color = f1 >= 0.8 ? 'var(--accent)' : f1 >= 0.6 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: '130px', flexShrink: 0 }}>
        <CategoryBadge category={category} />
      </div>
      <div style={{ flex: 1, height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color, minWidth: '36px', textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

export default function EvalView() {
  const { layaAvailable, openDownloadModal } = useEngine();
  const [report,       setReport]       = useState(null);
  const [provider,     setProvider]     = useState(() => layaAvailable ? 'laya' : 'hybrid');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [showMisclass, setShowMisclass] = useState(true);

  useEffect(() => {
    if (!layaAvailable && provider === 'laya') {
      setProvider('hybrid');
    }
  }, [layaAvailable, provider]);

  const runEval = async () => {
    if (provider === 'laya' && !layaAvailable) {
      setError('Local Laya model is not available in cloud deployment. Please download and run the project locally.');
      openDownloadModal();
      return;
    }
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/evaluate?provider=${provider}`);
      if (!r.ok) {
        const errJson = await r.json().catch(() => ({ detail: 'Evaluation failed' }));
        if (errJson.detail && errJson.detail.includes('Local Laya model is not available')) {
          openDownloadModal();
        }
        throw new Error(errJson.detail || 'Evaluation failed');
      }
      setReport(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const acc      = report ? Math.round((report.accuracy || 0) * 100) : null;
  const accColor = acc == null ? 'var(--text-1)'
    : acc >= 80 ? 'var(--accent)' : acc >= 60 ? 'var(--amber)' : 'var(--red)';

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>
          Evaluation
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '3px' }}>
          F1 scoring against ground truth dataset
        </p>
      </div>

      {/* ── Cloud Banner if Laya unavailable ── */}
      {!layaAvailable && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px', marginBottom: '14px',
          background: 'rgba(217, 119, 6, 0.08)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          borderRadius: 'var(--radius)',
          fontSize: '12.5px', color: 'var(--text-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0 }} />
            <span>
              <strong>Cloud Notice:</strong> Local Laya model (ModernBERT) evaluation runs locally on your PC. Cloud evaluation uses Groq or Hybrid.
            </span>
          </div>
          <button
            onClick={openDownloadModal}
            style={{
              background: 'transparent', border: 'none', color: 'var(--accent)',
              fontWeight: 600, fontSize: '12px', cursor: 'pointer', textDecoration: 'underline',
              whiteSpace: 'nowrap', padding: '2px 6px',
            }}
          >
            Run Laya Locally &rarr;
          </button>
        </div>
      )}

      {/* ── Controls ── */}
      <div style={{
        ...S.card, padding: '12px 16px', marginBottom: '16px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
      }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-2)' }}>
          {report ? `Last run: ${report.total} cases · ${Math.round((report.accuracy||0)*100)}% accuracy` : 'Select engine and run to see F1 scores, accuracy, and misclassifications.'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={provider}
            onChange={e => {
              if (e.target.value === 'laya' && !layaAvailable) {
                openDownloadModal();
                return;
              }
              setProvider(e.target.value);
            }}
            disabled={loading}
            style={S.select}
          >
            <option value="hybrid">Hybrid</option>
            <option value="groq">Groq</option>
            <option value="laya" disabled={!layaAvailable}>
              {layaAvailable ? 'Laya (Local ModernBERT)' : 'Laya (Local Only - Unavailable on Cloud)'}
            </option>
          </select>
          <button
            onClick={runEval} disabled={loading}
            style={{
              ...S.ghostBtn,
              background: loading ? 'var(--border-mid)' : 'var(--accent)',
              color: '#fff',
              borderColor: loading ? 'var(--border-mid)' : 'var(--accent)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)'; }}
          >
            <BarChart2 size={13} />
            {loading ? 'Running…' : 'Run Evaluation'}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center',
          padding: '10px 14px', marginBottom: '12px',
          background: 'var(--red-bg)', color: 'var(--red-text)',
          border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: 'var(--radius-lg)', fontSize: '13px',
        }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{
          ...S.card, padding: '32px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%',
            border: '2px solid var(--border-mid)', borderTopColor: 'var(--accent)',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-2)' }}>
            Running evaluation against ground truth…
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !report && (
        <div style={{ ...S.card, padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-3)' }}>
            Run evaluation to see F1 scores, accuracy, and misclassifications.
          </p>
        </div>
      )}

      {/* ── Report ── */}
      {report && !loading && (
        <>
          {/* Stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            <StatCard label="Accuracy"    value={`${acc}%`}   sub={`${report.correct||0}/${report.total||0}`} color={accColor} />
            <StatCard label="Macro F1"    value={`${Math.round((report.macro_f1||0)*100)}%`} sub="macro avg" color={accColor} />
            <StatCard label="Total"       value={report.total||0}   sub="test cases" />
            <StatCard label="Correct"     value={report.correct||0} sub="matched" color="var(--accent)" />
            <StatCard label="Failures"    value={(report.total||0)-(report.correct||0)} sub="missed" color={(report.total||0)-(report.correct||0) > 0 ? 'var(--red)' : 'var(--text-3)'} />
            {report.avg_latency_ms != null && (
              <StatCard label="Avg Latency" value={`${Math.round(report.avg_latency_ms)}ms`} sub="per call" color="var(--blue)" />
            )}
            {report.estimated_cost_usd != null && (
              <StatCard label="Est. Cost" value={`$${report.estimated_cost_usd.toFixed(4)}`} sub="this run" color="var(--amber)" />
            )}
          </div>

          {/* F1 per class */}
          {report.per_class_f1 && Object.keys(report.per_class_f1).length > 0 && (
            <div style={{ ...S.card, overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={S.label}>Per-Class F1 Scores</span>
              </div>
              <div style={{ padding: '8px 16px' }}>
                {Object.entries(report.per_class_f1).map(([cls, f1]) => (
                  <F1Bar key={cls} category={cls} f1={f1} />
                ))}
              </div>
            </div>
          )}

          {/* Latency percentiles */}
          {report.latency_percentiles && (
            <div style={{ ...S.card, overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={S.label}>Latency Percentiles</span>
              </div>
              <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
                {Object.entries(report.latency_percentiles).map(([p, v]) => (
                  <div key={p}>
                    <div style={{ ...S.label }}>{p}</div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', fontFamily: 'monospace' }}>
                      {typeof v === 'number' ? `${Math.round(v)}ms` : v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Misclassifications */}
          {report.misclassifications && report.misclassifications.length > 0 && (
            <div style={{ ...S.card, overflow: 'hidden' }}>
              <button
                onClick={() => setShowMisclass(!showMisclass)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '11px 16px', border: 'none',
                  borderBottom: showMisclass ? '1px solid var(--border)' : 'none',
                  background: 'transparent', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {showMisclass ? <ChevronDown size={13} color="var(--text-3)" /> : <ChevronRight size={13} color="var(--text-3)" />}
                <span style={{ ...S.label, marginBottom: 0 }}>
                  Misclassifications
                </span>
                <span style={{
                  padding: '1px 8px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--red-bg)', color: 'var(--red-text)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  fontSize: '11px', fontWeight: 600,
                }}>
                  {report.misclassifications.length}
                </span>
              </button>

              {showMisclass && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Message', 'Expected', 'Got', 'Confidence'].map(h => (
                          <th key={h} style={{
                            padding: '8px 14px', textAlign: 'left',
                            fontSize: '11px', fontWeight: 600, color: 'var(--text-3)',
                            textTransform: 'uppercase', letterSpacing: '0.07em',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.misclassifications.map((m, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '9px 14px', maxWidth: '240px' }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-2)', fontSize: '12.5px' }} title={m.payload}>
                              {String(m.payload).slice(0, 60)}{String(m.payload).length > 60 ? '…' : ''}
                            </span>
                          </td>
                          <td style={{ padding: '9px 14px' }}><CategoryBadge category={m.expected} /></td>
                          <td style={{ padding: '9px 14px' }}><CategoryBadge category={m.predicted} /></td>
                          <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-2)' }}>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
