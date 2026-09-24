import React, { useState } from 'react';
import { Send, RotateCcw, Copy, Check, Clock, User, AlertTriangle, History, ChevronDown, ChevronUp } from 'lucide-react';
import { CategoryBadge, PriorityBadge, TierBadge, ConfidenceBar } from './Badges';
import { API_BASE } from '../config';
import { useEngine } from '../context/EngineContext';

const HISTORY_KEY = 'conduit_history_v1';
const FORMATS  = ['Auto', 'Text', 'JSON', 'HTML', 'CSV'];
const SAMPLES = [
  "Hi, I just noticed my card was charged $49.00 today but my subscription tier is supposed to be the $29.00 starter plan.",
  "Our production database has been down for 40 minutes and we're losing customer orders. This is critical.",
  "I clicked on password reset link but it didn't send the email to my inbox.",
  "Could you add webhook support to the API? We'd love to get real-time updates.",
];

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(h) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 10))); } catch {}
}

/* ── Shared styles ── */
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
    marginBottom: '6px',
    display: 'block',
  },
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 10px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'transparent',
    color: 'var(--text-2)',
    fontSize: '12.5px', fontWeight: 400,
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    transition: 'background 0.1s, color 0.1s, border-color 0.1s',
  },
  select: {
    border: 'none',
    background: 'transparent',
    color: 'var(--text-2)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '12.5px', fontWeight: 400,
    outline: 'none',
    cursor: 'pointer',
    padding: '0 4px',
  },
};

/* ── Section label ── */
function SectionLabel({ children }) {
  return <div style={S.label}>{children}</div>;
}

/* ── Divider ── */
function Divider() {
  return <div style={{ borderTop: '1px solid var(--border)', margin: '0' }} />;
}

export default function TriageView() {
  const { layaAvailable, openDownloadModal } = useEngine();
  const [input,       setInput]       = useState('');
  const [format,      setFormat]      = useState('Auto');
  const [engine,      setEngine]      = useState(() => layaAvailable ? 'laya' : 'hybrid');
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [copied,      setCopied]      = useState(false);
  const [history,     setHistory]     = useState(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [rawOpen,     setRawOpen]     = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    if (engine === 'laya' && !layaAvailable) {
      setError("The local Laya (ModernBERT) model cannot be run on live cloud deployment (Render.com). Please download the project to run Laya locally on your PC, or switch to Groq / Hybrid.");
      openDownloadModal();
      return;
    }
    setLoading(true); setError(null); setResult(null);
    const truncated = input.slice(0, 2000);
    let headers = {}, body = '';
    if (format === 'Text' || format === 'CSV') {
      headers['Content-Type'] = 'text/plain'; body = truncated;
    } else if (format === 'HTML') {
      headers['Content-Type'] = 'text/html'; body = truncated;
    } else {
      headers['Content-Type'] = 'application/json';
      try { JSON.parse(truncated); body = truncated; }
      catch { body = JSON.stringify({ payload: truncated }); }
    }
    try {
      const res = await fetch(`${API_BASE}/api/triage?provider=${engine}`, { method: 'POST', headers, body });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.detail || `HTTP ${res.status}`;
        if (errMsg.includes('Laya') || errMsg.includes('Render')) {
          openDownloadModal();
        }
        throw new Error(errMsg);
      }
      const data = await res.json();
      setResult(data);
      const entry = { id: Date.now(), payload: truncated, engine, result: data, ts: new Date().toLocaleTimeString() };
      const updated = [entry, ...history].slice(0, 10);
      setHistory(updated); saveHistory(updated);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result.decision, null, 2)).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const d = result?.decision;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            Triage
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '3px' }}>
            Classify a customer support ticket
          </p>
        </div>

        {/* History toggle */}
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              ...S.ghostBtn,
              color: showHistory ? 'var(--text-1)' : 'var(--text-2)',
              borderColor: showHistory ? 'var(--border-mid)' : 'var(--border)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <History size={13} />
            History ({history.length})
          </button>
        )}
      </div>

      {/* ── History panel ── */}
      {showHistory && (
        <div className="fade-in" style={{ ...S.card, marginBottom: '12px', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 14px',
          }}>
            <span style={S.label}>Recent runs</span>
            <button
              onClick={() => { setHistory([]); saveHistory([]); setShowHistory(false); }}
              style={{ ...S.ghostBtn, padding: '2px 8px', fontSize: '11.5px', border: 'none' }}
            >
              Clear
            </button>
          </div>
          <Divider />
          {history.map(h => (
            <button
              key={h.id}
              onClick={() => { setInput(h.payload); setEngine(h.engine); setResult(h.result); setShowHistory(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '9px 14px',
                border: 'none', borderBottom: '1px solid var(--border)',
                background: 'transparent', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <CategoryBadge category={h.result?.decision?.category} />
              <span style={{ flex: 1, fontSize: '12.5px', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {h.payload}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'monospace', flexShrink: 0 }}>{h.ts}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Cloud Notice Banner when Laya is not available ── */}
      {!layaAvailable && (
        <div style={{
          background: 'var(--amber-bg)',
          border: '1px solid rgba(217,119,6,0.25)',
          borderRadius: 'var(--radius)',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '12.5px',
          color: 'var(--amber-text)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} />
            <span>
              <strong>Live Cloud Notice:</strong> The on-device <strong>Laya (ModernBERT)</strong> router cannot be run on live cloud deployment (Render.com free tier). Download the project to run Laya locally on your PC.
            </span>
          </div>
          <button
            onClick={openDownloadModal}
            style={{
              background: 'var(--text-1)',
              color: 'var(--bg-panel)',
              border: 'none',
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Run Laya on PC
          </button>
        </div>
      )}

      {/* ── Input card ── */}
      <div style={{ ...S.card, marginBottom: '12px' }}>
        {/* Textarea */}
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
          placeholder="Paste a support message, email, JSON, HTML, or CSV…"
          rows={7}
          style={{
            width: '100%', padding: '14px 16px',
            border: 'none', borderBottom: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            fontSize: '13.5px', lineHeight: '1.65',
            color: 'var(--text-1)',
            background: 'transparent',
            resize: 'vertical',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            boxSizing: 'border-box',
            minHeight: '140px',
            transition: 'color 0.2s',
          }}
        />

        {/* Controls row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '8px 12px',
          flexWrap: 'wrap',
        }}>
          {/* Quick samples */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>Try:</span>
            {SAMPLES.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                style={{
                  padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-3)', fontSize: '11.5px',
                  fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
              >
                #{i + 1}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 4px' }} />

          {/* Format */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>Format</span>
            <select value={format} onChange={e => setFormat(e.target.value)} style={S.select}>
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 4px' }} />

          {/* Engine */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>Engine</span>
            <select
              value={engine}
              onChange={e => {
                if (e.target.value === 'laya' && !layaAvailable) {
                  openDownloadModal();
                  return;
                }
                setEngine(e.target.value);
              }}
              style={S.select}
            >
              <option value="hybrid">Hybrid</option>
              <option value="groq">Groq</option>
              <option value="laya" disabled={!layaAvailable}>
                {layaAvailable ? 'Laya' : 'Laya (PC Only)'}
              </option>
            </select>
          </div>

          {/* Char count */}
          <span style={{
            marginLeft: 'auto',
            fontSize: '11px', color: input.length > 1800 ? 'var(--red)' : 'var(--text-4)',
            fontFamily: 'monospace',
          }}>
            {input.length}/2000
          </span>

          {/* Reset */}
          {result && (
            <button
              onClick={() => { setResult(null); setInput(''); setError(null); }}
              style={{ ...S.ghostBtn, padding: '5px 10px' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            title="Run triage (Ctrl+Enter)"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 14px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: loading || !input.trim() ? 'var(--border-mid)' : 'var(--accent)',
              color: '#fff',
              fontSize: '13px', fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={e => { if (!loading && input.trim()) e.currentTarget.style.background = 'var(--accent)'; }}
          >
            <Send size={12} />
            {loading ? 'Analyzing…' : 'Run Triage'}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="fade-in" style={{
          display: 'flex', gap: '8px', alignItems: 'flex-start',
          padding: '10px 14px', marginBottom: '12px',
          background: 'var(--red-bg)', color: 'var(--red-text)',
          border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: 'var(--radius-lg)',
          fontSize: '13px',
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="fade-in" style={{
          ...S.card, padding: '24px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '12px',
        }}>
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%',
            border: '2px solid var(--border-mid)', borderTopColor: 'var(--accent)',
            animation: 'spin 0.7s linear infinite', flexShrink: 0,
          }} />
          <span style={{ fontSize: '13.5px', color: 'var(--text-2)' }}>
            Analyzing ticket via <strong style={{ color: 'var(--text-1)', fontWeight: 500 }}>{engine}</strong>…
          </span>
        </div>
      )}

      {/* ── Result ── */}
      {d && (
        <div className="fade-in" style={{ ...S.card, overflow: 'hidden' }}>

          {/* Status bar */}
          <div style={{
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
            borderBottom: '1px solid var(--border)',
          }}>
            <PriorityBadge priority={d.priority} />
            <CategoryBadge category={d.category} />
            <TierBadge tier={d.tier_used} />
            {d.fallback_triggered && (
              <span className="badge" style={{ background: 'var(--amber-bg)', color: 'var(--amber-text)', border: '1px solid rgba(217,119,6,0.2)' }}>
                <AlertTriangle size={10} style={{ marginRight: '3px' }} />Fallback
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-3)' }}>
              <Clock size={11} />
              <span style={{ fontFamily: 'monospace' }}>{result.latency_ms?.toFixed(0) || '—'}ms</span>
            </div>
          </div>

          {/* Summary */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <SectionLabel>Summary</SectionLabel>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-1)', lineHeight: '1.6' }}>{d.summary}</p>
          </div>

          {/* Suggested action */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
            <SectionLabel>Suggested Action</SectionLabel>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-2)', fontFamily: 'monospace', lineHeight: '1.55' }}>
              {d.suggested_action}
            </p>
          </div>

          {/* Metrics row */}
          <div style={{
            padding: '12px 16px',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
          }}>
            <div>
              <SectionLabel>Confidence</SectionLabel>
              <ConfidenceBar confidence={d.confidence} />
            </div>
            <div>
              <SectionLabel>Escalation</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} color={d.needs_human ? 'var(--amber)' : 'var(--text-4)'} />
                <span style={{ fontSize: '13px', color: d.needs_human ? 'var(--amber-text)' : 'var(--text-3)', fontWeight: 500 }}>
                  {d.needs_human ? 'Required' : 'Not needed'}
                </span>
              </div>
            </div>
            <div>
              <SectionLabel>Export</SectionLabel>
              <button
                onClick={handleCopy}
                style={{
                  ...S.ghostBtn,
                  color: copied ? 'var(--accent-text)' : 'var(--text-2)',
                  borderColor: copied ? 'rgba(22,163,74,0.3)' : 'var(--border)',
                  background: copied ? 'var(--accent-bg)' : 'transparent',
                }}
                onMouseEnter={e => { if (!copied) { e.currentTarget.style.background = 'var(--bg-hover)'; } }}
                onMouseLeave={e => { if (!copied) { e.currentTarget.style.background = 'transparent'; } }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
          </div>

          {/* Raw JSON toggle */}
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => setRawOpen(!rawOpen)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', border: 'none',
                background: 'transparent', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', textAlign: 'left',
                fontSize: '12px', color: 'var(--text-3)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {rawOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Raw JSON
            </button>
            {rawOpen && (
              <pre style={{
                margin: 0, padding: '14px 16px',
                background: 'var(--bg-code)',
                borderTop: '1px solid var(--border)',
                color: 'var(--text-2)',
                fontSize: '11.5px', lineHeight: '1.7',
                overflow: 'auto', maxHeight: '220px',
                fontFamily: "'SF Mono', 'Fira Mono', monospace",
                borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              }}>
                {JSON.stringify(d, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Empty result state */}
      {!result && !loading && !error && (
        <div style={{
          padding: '20px 0',
          color: 'var(--text-4)',
          fontSize: '13px', textAlign: 'left',
        }}>
          Submit a ticket to see classification, priority, and recommended action. <kbd style={{ padding: '1px 5px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '3px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'monospace' }}>Ctrl+Enter</kbd> to run.
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


