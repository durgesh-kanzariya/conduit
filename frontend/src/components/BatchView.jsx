import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Download, Clock, Loader, AlertTriangle } from 'lucide-react';
import { CategoryBadge, PriorityBadge, TierBadge, HumanBadge, ConfidenceBar } from './Badges';
import { API_BASE } from '../config';
import { useEngine } from '../context/EngineContext';

function fmt(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const S = {
  card: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    transition: 'background 0.2s, border-color 0.2s',
  },
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 11px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'transparent',
    color: 'var(--text-2)',
    fontSize: '12.5px', fontWeight: 400,
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    transition: 'background 0.1s, color 0.1s',
  },
  select: {
    border: 'none',
    background: 'transparent',
    color: 'var(--text-2)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '12.5px',
    outline: 'none',
    cursor: 'pointer',
    padding: '5px 8px',
    borderRadius: 'var(--radius)',
  },
};

export default function BatchView() {
  const { layaAvailable, openDownloadModal } = useEngine();
  const [testCases,    setTestCases]    = useState([]);
  const [results,      setResults]      = useState([]);
  const [engine,       setEngine]       = useState(() => layaAvailable ? 'laya' : 'hybrid');
  const [loading,      setLoading]      = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [elapsed,      setElapsed]      = useState(0);
  const [totalTime,    setTotalTime]    = useState(null);
  const [error,        setError]        = useState(null);

  const abortRef = useRef(null);
  const timerRef = useRef(null);
  const t0Ref    = useRef(0);

  useEffect(() => {
    if (!layaAvailable && engine === 'laya') {
      setEngine('hybrid');
    }
  }, [layaAvailable, engine]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const loadCases = async () => {
    try {
      setError(null);
      const r = await fetch(`${API_BASE}/api/test-cases`);
      if (!r.ok) throw new Error('Failed to load test cases');
      const data = await r.json();
      setTestCases(data); setResults([]);
      setCurrentIndex(-1); setTotalTime(null); setElapsed(0);
    } catch (e) { setError(e.message); }
  };

  const stopBatch = () => { if (abortRef.current) abortRef.current.abort(); };

  const runBatch = async () => {
    if (engine === 'laya' && !layaAvailable) {
      setError('Local Laya model is not available in cloud deployment. Please download and run the project locally.');
      openDownloadModal();
      return;
    }
    if (!testCases.length) { setError('Load test cases first.'); return; }
    abortRef.current = new AbortController();
    setLoading(true); setError(null);
    setResults(new Array(testCases.length).fill(null));
    setCurrentIndex(0); setTotalTime(null);
    t0Ref.current = performance.now(); setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(Math.round(performance.now() - t0Ref.current)), 100);

    try {
      for (let i = 0; i < testCases.length; i++) {
        if (abortRef.current.signal.aborted) break;
        const tc = testCases[i]; setCurrentIndex(i);
        const t1 = performance.now();
        try {
          const r = await fetch(`${API_BASE}/api/triage?provider=${engine}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload: tc.payload }),
            signal: abortRef.current.signal,
          });
          const itemMs = Math.round(performance.now() - t1);
          if (!r.ok) {
            const err = await r.json().catch(() => ({ detail: 'Error' }));
            setResults(prev => { const u = [...prev]; u[i] = { ok: false, error: err.detail, ms: itemMs }; return u; });
          } else {
            const data = await r.json();
            setResults(prev => { const u = [...prev]; u[i] = { ok: true, decision: data.decision, ms: data.latency_ms || itemMs }; return u; });
          }
        } catch (e) {
          if (e.name === 'AbortError') break;
          const itemMs = Math.round(performance.now() - t1);
          setResults(prev => { const u = [...prev]; u[i] = { ok: false, error: e.message, ms: itemMs }; return u; });
        }
      }
    } finally {
      clearInterval(timerRef.current); timerRef.current = null;
      const tot = Math.round(performance.now() - t0Ref.current);
      setElapsed(tot); setTotalTime(tot); setLoading(false); setCurrentIndex(-1);
    }
  };

  const done      = results.filter(r => r !== null).length;
  const succeeded = results.filter(r => r?.ok).length;
  const pct       = testCases.length ? Math.round((done / testCases.length) * 100) : 0;
  const avgMs     = succeeded
    ? Math.round(results.filter(r => r?.ok).reduce((s, r) => s + r.ms, 0) / succeeded)
    : null;

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>
          Batch Runner
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '3px' }}>
          Run all test cases through the triage pipeline
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
              <strong>Cloud Notice:</strong> Laya (ModernBERT) runs locally on PC. Cloud uses Groq / Hybrid.
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
        ...S.card,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-2)' }}>
          {testCases.length > 0
            ? <><strong style={{ color: 'var(--text-1)' }}>{testCases.length}</strong> cases loaded</>
            : 'Load cases to begin'
          }
          {done > 0 && !loading && (
            <span style={{ color: 'var(--text-3)', fontSize: '12.5px' }}>
              · {succeeded}/{done} passed · avg {avgMs ? fmt(avgMs) : '—'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={engine}
            onChange={e => {
              if (e.target.value === 'laya' && !layaAvailable) {
                openDownloadModal();
                return;
              }
              setEngine(e.target.value);
            }}
            disabled={loading}
            style={{ ...S.select, border: '1px solid var(--border)' }}
          >
            <option value="hybrid">Hybrid (Auto-route)</option>
            <option value="groq">Groq (gpt-oss-120b)</option>
            <option value="laya" disabled={!layaAvailable}>
              {layaAvailable ? 'Laya (Local ModernBERT)' : 'Laya (Local Only - Unavailable on Cloud)'}
            </option>
          </select>

          <button
            onClick={loadCases} disabled={loading}
            style={S.ghostBtn}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}
          >
            <Download size={13} /> Load
          </button>

          {loading ? (
            <button
              onClick={stopBatch}
              style={{
                ...S.ghostBtn,
                color: 'var(--red-text)', borderColor: 'rgba(220,38,38,0.3)',
                background: 'var(--red-bg)',
              }}
            >
              <Square size={12} /> Stop
            </button>
          ) : (
            <button
              onClick={runBatch} disabled={!testCases.length}
              style={{
                ...S.ghostBtn,
                background: testCases.length ? 'var(--accent)' : 'var(--border-mid)',
                color: '#fff',
                borderColor: testCases.length ? 'var(--accent)' : 'var(--border-mid)',
                cursor: testCases.length ? 'pointer' : 'not-allowed',
                fontWeight: 500,
              }}
              onMouseEnter={e => { if (testCases.length) e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={e => { if (testCases.length) e.currentTarget.style.background = 'var(--accent)'; }}
            >
              <Play size={12} /> Run {testCases.length || 40}
            </button>
          )}
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

      {/* ── Progress ── */}
      {testCases.length > 0 && (loading || done > 0) && (
        <div style={{ ...S.card, padding: '14px 16px', marginBottom: '12px' }}>
          {/* Active task */}
          {loading && currentIndex >= 0 && testCases[currentIndex] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Loader size={13} color="var(--accent)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>
                Processing <strong style={{ color: 'var(--text-1)' }}>#{testCases[currentIndex].id}</strong>
                <span style={{ color: 'var(--text-3)', marginLeft: '8px', fontFamily: 'monospace', fontSize: '11.5px' }}>
                  {String(testCases[currentIndex].payload).slice(0, 60)}…
                </span>
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> {fmt(elapsed)}
              </span>
            </div>
          )}

          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{done} of {testCases.length}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'monospace', fontWeight: 500 }}>{pct}%</span>
            </div>
            <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: 'var(--accent)', borderRadius: '2px',
                transition: 'width 0.2s ease',
              }} />
            </div>
          </div>

          {/* Summary metrics */}
          {!loading && done > 0 && (
            <div style={{ display: 'flex', gap: '24px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {[
                { label: 'Passed',   value: succeeded,                            color: 'var(--accent)' },
                { label: 'Failed',   value: done - succeeded,                      color: done - succeeded > 0 ? 'var(--red)' : 'var(--text-3)' },
                { label: 'Rate',     value: `${Math.round((succeeded/done)*100)}%`, color: 'var(--text-1)' },
                { label: 'Total time', value: totalTime ? fmt(totalTime) : '—',    color: 'var(--text-1)' },
                { label: 'Avg',      value: avgMs ? fmt(avgMs) : '—',             color: 'var(--text-1)' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color, fontFamily: 'monospace', lineHeight: 1 }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Table ── */}
      {testCases.length > 0 ? (
        <div style={{ ...S.card, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '520px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Message', 'Category', 'Priority', 'Human?', 'Confidence', 'Engine', 'Latency'].map(h => (
                    <th key={h} style={{
                      padding: '9px 12px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 600,
                      color: 'var(--text-3)',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      position: 'sticky', top: 0,
                      background: 'var(--bg-panel)',
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {testCases.map((tc, i) => {
                  const r = results[i];
                  const isCurrent = loading && i === currentIndex;
                  const payload = String(typeof tc.payload === 'object' ? JSON.stringify(tc.payload) : tc.payload);
                  return (
                    <tr key={tc.id} style={{
                      borderBottom: '1px solid var(--border)',
                      background: isCurrent ? 'var(--accent-bg)' : 'transparent',
                      opacity: !r && !isCurrent ? 0.35 : 1,
                      transition: 'opacity 0.2s, background 0.15s',
                    }}
                      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--text-3)', fontSize: '11.5px' }}>{tc.id}</td>
                      <td style={{ padding: '8px 12px', maxWidth: '220px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-2)' }} title={payload}>
                          {payload.slice(0, 50)}{payload.length > 50 ? '…' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {r?.ok ? <CategoryBadge category={r.decision.category} />
                          : isCurrent ? <span style={{ color: 'var(--text-3)', fontSize: '11.5px' }}>Processing…</span>
                          : r && !r.ok ? <span style={{ color: 'var(--red-text)', fontSize: '11.5px' }}>Error</span>
                          : <span style={{ color: 'var(--text-4)' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {r?.ok ? <PriorityBadge priority={r.decision.priority} /> : <span style={{ color: 'var(--text-4)' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {r?.ok ? <HumanBadge needs={r.decision.needs_human} /> : <span style={{ color: 'var(--text-4)' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 12px', minWidth: '120px' }}>
                        {r?.ok ? <ConfidenceBar confidence={r.decision.confidence} /> : <span style={{ color: 'var(--text-4)' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {r?.ok ? <TierBadge tier={r.decision.tier_used} /> : <span style={{ color: 'var(--text-4)' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--text-2)', fontSize: '12px', textAlign: 'right' }}>
                        {r ? fmt(r.ms)
                          : isCurrent ? <Loader size={11} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div style={{
          ...S.card, padding: '48px 24px', textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-3)' }}>
            Click <strong style={{ color: 'var(--text-1)' }}>Load</strong> to fetch test cases from the backend, then <strong style={{ color: 'var(--text-1)' }}>Run</strong> to execute.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
