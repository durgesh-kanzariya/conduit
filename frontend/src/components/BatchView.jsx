import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Download, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { CategoryBadge, PriorityBadge, TierBadge, HumanBadge, ConfidenceBar } from './Badges';

const API_BASE = 'http://127.0.0.1:8000';
const ENGINES = [
  { value: 'hybrid', label: 'Hybrid (Auto-route)' },
  { value: 'groq', label: 'Groq (gpt-oss-120b)' },
  { value: 'laya', label: 'Laya (Local)' },
];

function fmt(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function BatchView() {
  const [testCases, setTestCases] = useState([]);
  const [results, setResults] = useState([]);
  const [engine, setEngine] = useState('hybrid');
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [totalTime, setTotalTime] = useState(null);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const timerRef = useRef(null);
  const t0Ref = useRef(0);

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
      setTestCases(data);
      setResults([]);
      setCurrentIndex(-1);
      setTotalTime(null);
      setElapsed(0);
    } catch (e) {
      setError(e.message);
    }
  };

  const stopBatch = () => {
    if (abortRef.current) abortRef.current.abort();
  };

  const runBatch = async () => {
    if (!testCases.length) { setError('Load test cases first.'); return; }
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    setResults(new Array(testCases.length).fill(null));
    setCurrentIndex(0);
    setTotalTime(null);
    t0Ref.current = performance.now();
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(Math.round(performance.now() - t0Ref.current)), 100);

    try {
      for (let i = 0; i < testCases.length; i++) {
        if (abortRef.current.signal.aborted) break;
        const tc = testCases[i];
        setCurrentIndex(i);
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
      clearInterval(timerRef.current);
      timerRef.current = null;
      const tot = Math.round(performance.now() - t0Ref.current);
      setElapsed(tot);
      setTotalTime(tot);
      setLoading(false);
      setCurrentIndex(-1);
    }
  };

  const done = results.filter(r => r !== null).length;
  const succeeded = results.filter(r => r?.ok).length;
  const pct = testCases.length ? Math.round((done / testCases.length) * 100) : 0;
  const avgMs = results.filter(r => r?.ok).length
    ? Math.round(results.filter(r => r?.ok).reduce((s, r) => s + r.ms, 0) / results.filter(r => r?.ok).length)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Batch Runner</h2>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
            Run all 40 test cases through the triage pipeline
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={engine}
            onChange={e => setEngine(e.target.value)}
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
            onClick={loadCases}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: '5px',
              background: '#fff',
              color: '#475569',
              fontSize: '12.5px',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <Download size={13} />
            Load
          </button>

          {loading ? (
            <button
              onClick={stopBatch}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 14px',
                border: 'none',
                borderRadius: '5px',
                background: '#DC2626',
                color: '#fff',
                fontSize: '12.5px',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              <Square size={12} /> Stop
            </button>
          ) : (
            <button
              onClick={runBatch}
              disabled={!testCases.length}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 14px',
                border: 'none',
                borderRadius: '5px',
                background: testCases.length ? '#1E40AF' : '#CBD5E1',
                color: '#fff',
                fontSize: '12.5px',
                fontFamily: 'Inter, sans-serif',
                cursor: testCases.length ? 'pointer' : 'not-allowed',
                fontWeight: 500,
              }}
            >
              <Play size={12} /> Run {testCases.length || 40}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 12px', border: '1px solid #FECACA', borderRadius: '5px', background: '#FEF2F2', color: '#991B1B', fontSize: '12.5px' }}>
          {error}
        </div>
      )}

      {/* Progress bar + live stats */}
      {testCases.length > 0 && (loading || done > 0) && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Active task */}
          {loading && currentIndex >= 0 && testCases[currentIndex] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader size={13} color="#1E40AF" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#475569' }}>
                Processing <strong style={{ color: '#0F172A' }}>#{testCases[currentIndex].id}</strong>
                <span style={{ color: '#94A3B8', marginLeft: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
                  {String(testCases[currentIndex].payload).slice(0, 70)}...
                </span>
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '12px', fontFamily: 'monospace' }}>
                <Clock size={12} />
                {fmt(elapsed)}
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>{done} of {testCases.length} processed</span>
              <span style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'monospace' }}>{pct}%</span>
            </div>
            <div style={{ height: '5px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: '#1E40AF',
                borderRadius: '3px',
                transition: 'width 0.2s ease',
              }} />
            </div>
          </div>

          {/* Summary metrics */}
          {!loading && done > 0 && (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px solid #F1F5F9' }}>
              {[
                { label: 'Total', value: done },
                { label: 'Passed', value: succeeded },
                { label: 'Failed', value: done - succeeded },
                { label: 'Success Rate', value: `${Math.round((succeeded / done) * 100)}%` },
                { label: 'Total Time', value: totalTime ? fmt(totalTime) : '—' },
                { label: 'Avg Latency', value: avgMs ? fmt(avgMs) : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', fontFamily: 'monospace', marginTop: '2px' }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results table */}
      {testCases.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '480px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['#', 'Message', 'Category', 'Priority', 'Human?', 'Confidence', 'Engine', 'Latency'].map(h => (
                    <th key={h} style={{
                      padding: '9px 12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      position: 'sticky',
                      top: 0,
                      background: '#F8FAFC',
                      whiteSpace: 'nowrap',
                      borderBottom: '1px solid #E2E8F0',
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
                      borderBottom: '1px solid #F1F5F9',
                      background: isCurrent ? '#EFF6FF' : i % 2 === 0 ? '#fff' : '#FAFAFA',
                      opacity: !r && !isCurrent ? 0.45 : 1,
                    }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#94A3B8', fontSize: '11.5px' }}>{tc.id}</td>
                      <td style={{ padding: '8px 12px', maxWidth: '240px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155' }} title={payload}>
                          {payload.slice(0, 55)}{payload.length > 55 ? '…' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {r?.ok ? <CategoryBadge category={r.decision.category} />
                          : isCurrent ? <span style={{ color: '#94A3B8', fontSize: '11px' }}>Processing…</span>
                          : r && !r.ok ? <span style={{ color: '#DC2626', fontSize: '11px' }}>Error</span>
                          : <span style={{ color: '#CBD5E1', fontSize: '11px' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {r?.ok ? <PriorityBadge priority={r.decision.priority} /> : <span style={{ color: '#CBD5E1', fontSize: '11px' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {r?.ok ? <HumanBadge needs={r.decision.needs_human} /> : <span style={{ color: '#CBD5E1', fontSize: '11px' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 12px', minWidth: '110px' }}>
                        {r?.ok
                          ? <ConfidenceBar confidence={r.decision.confidence} />
                          : <span style={{ color: '#CBD5E1', fontSize: '11px' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {r?.ok ? <TierBadge tier={r.decision.tier_used} /> : <span style={{ color: '#CBD5E1', fontSize: '11px' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#475569', fontSize: '11.5px', textAlign: 'right' }}>
                        {r ? fmt(r.ms) : isCurrent ? <Loader size={11} color="#1E40AF" style={{ animation: 'spin 1s linear infinite' }} /> : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!testCases.length && (
        <div style={{
          border: '1px dashed #E2E8F0',
          borderRadius: '6px',
          padding: '48px 24px',
          textAlign: 'center',
          color: '#CBD5E1',
        }}>
          <Download size={28} style={{ marginBottom: '10px', opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '13px' }}>Click <strong>Load</strong> to fetch the 40 test cases from the backend</p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
