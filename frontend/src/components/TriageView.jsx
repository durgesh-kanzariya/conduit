import React, { useState } from 'react';
import { Send, RotateCcw, Copy, Check, Clock, User, Zap, AlertTriangle, History, X } from 'lucide-react';
import { CategoryBadge, PriorityBadge, TierBadge, ConfidenceBar } from './Badges';

import { API_BASE } from '../config';

const HISTORY_KEY = 'conduit_history_v1';

const FORMATS = ['Auto', 'Text', 'JSON', 'HTML', 'CSV'];
const ENGINES = [
  { value: 'hybrid', label: 'Hybrid (Auto-route)' },
  { value: 'groq', label: 'Groq (gpt-oss-120b)' },
  { value: 'laya', label: 'Laya (Local)' },
];

const SAMPLE_MESSAGES = [
  "Hi, I just noticed my card was charged $49.00 today but my subscription tier is supposed to be the $29.00 starter plan.",
  "Our production database has been down for 40 minutes and we're losing customer orders. This is critical.",
  "I clicked on password reset link but it didn't send the email to my inbox.",
  "Could you add webhook support to the API? We'd love to get real-time updates.",
];

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(items) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 10))); } catch {}
}

export default function TriageView() {
  const [input, setInput] = useState('');
  const [format, setFormat] = useState('Auto');
  const [engine, setEngine] = useState('hybrid');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState(loadHistory);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const truncated = input.slice(0, 2000);
    let headers = {};
    let body = '';
    if (format === 'Text' || format === 'CSV') {
      headers['Content-Type'] = 'text/plain';
      body = truncated;
    } else if (format === 'HTML') {
      headers['Content-Type'] = 'text/html';
      body = truncated;
    } else {
      headers['Content-Type'] = 'application/json';
      try { JSON.parse(truncated); body = truncated; }
      catch { body = JSON.stringify({ payload: truncated }); }
    }
    try {
      const res = await fetch(`${API_BASE}/api/triage?provider=${engine}`, { method: 'POST', headers, body });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      const entry = { id: Date.now(), payload: truncated, engine, result: data, ts: new Date().toLocaleTimeString() };
      const updated = [entry, ...history].slice(0, 10);
      setHistory(updated);
      saveHistory(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result.decision, null, 2)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const restoreHistory = (item) => {
    setInput(item.payload);
    setEngine(item.engine);
    setResult(item.result);
    setShowHistory(false);
  };

  const d = result?.decision;

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      {/* Left Column: Input */}
      <div style={{ flex: '0 0 480px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Triage Message</h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>Classify a customer support ticket</p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px',
              border: '1px solid #E2E8F0',
              borderRadius: '5px',
              background: showHistory ? '#F1F5F9' : '#fff',
              color: '#475569',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <History size={13} />
            History {history.length > 0 && `(${history.length})`}
          </button>
        </div>

        {/* History drawer */}
        {showHistory && history.length > 0 && (
          <div style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              Recent Runs
              <button onClick={() => { setHistory([]); saveHistory([]); setShowHistory(false); }}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                Clear
              </button>
            </div>
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => restoreHistory(h)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '9px 12px',
                  border: 'none', borderBottom: '1px solid #F1F5F9',
                  background: '#fff', cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <CategoryBadge category={h.result?.decision?.category} />
                <span style={{ flex: 1, fontSize: '12px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.payload}
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', flexShrink: 0 }}>{h.ts}</span>
              </button>
            ))}
          </div>
        )}

        {/* Textarea */}
        <div style={{ position: 'relative' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste a support message, email, JSON, HTML, or CSV payload..."
            rows={8}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '13.5px',
              lineHeight: '1.6',
              color: '#0F172A',
              background: '#fff',
              resize: 'vertical',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#1E40AF'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          />
          <div style={{
            position: 'absolute', bottom: '10px', right: '12px',
            fontSize: '11px', color: input.length > 1800 ? '#DC2626' : '#94A3B8',
            fontFamily: 'monospace',
          }}>
            {input.length}/2000
          </div>
        </div>

        {/* Samples */}
        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', marginRight: '8px', fontWeight: 500 }}>Quick samples:</span>
          {SAMPLE_MESSAGES.map((s, i) => (
            <button
              key={i}
              onClick={() => setInput(s)}
              style={{
                display: 'inline-block',
                marginRight: '4px',
                marginBottom: '4px',
                padding: '2px 8px',
                borderRadius: '3px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#475569',
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
              }}
            >
              #{i + 1}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Format */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Format</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              style={{
                padding: '5px 8px',
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
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Engine */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Engine</label>
            <select
              value={engine}
              onChange={e => setEngine(e.target.value)}
              style={{
                padding: '5px 8px',
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
          </div>

          <div style={{ flex: 1 }} />

          {/* Reset */}
          {result && (
            <button
              onClick={() => { setResult(null); setInput(''); setError(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 10px',
                border: '1px solid #E2E8F0',
                borderRadius: '5px',
                background: '#fff',
                color: '#64748B',
                fontSize: '12.5px',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} /> Clear
            </button>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px',
              borderRadius: '5px',
              border: 'none',
              background: loading ? '#64748B' : '#1E40AF',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: !input.trim() ? 0.5 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.background = '#1D4ED8'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1E40AF'; }}
          >
            <Send size={13} />
            {loading ? 'Running...' : 'Run Triage'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 12px',
            border: '1px solid #FECACA',
            borderRadius: '5px',
            background: '#FEF2F2',
            color: '#991B1B',
            fontSize: '12.5px',
            display: 'flex', gap: '8px', alignItems: 'flex-start',
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Right Column: Result */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!result && !loading && (
          <div style={{
            border: '1px dashed #E2E8F0',
            borderRadius: '6px',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#CBD5E1',
          }}>
            <MessageSquareIcon size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Triage result will appear here</p>
          </div>
        )}

        {loading && (
          <div style={{
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#94A3B8',
          }}>
            <div style={{
              width: '24px', height: '24px',
              border: '2px solid #E2E8F0',
              borderTop: '2px solid #1E40AF',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Analyzing ticket...</p>
          </div>
        )}

        {d && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {/* Result card header */}
            <div style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: '6px 6px 0 0',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <PriorityBadge priority={d.priority} />
              <CategoryBadge category={d.category} />
              <TierBadge tier={d.tier_used} />
              <div style={{ flex: 1 }} />
              {d.fallback_triggered && (
                <span style={{ fontSize: '11px', color: '#C2410C', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={11} /> Fallback
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontSize: '12px' }}>
                <Clock size={12} />
                <span style={{ fontFamily: 'monospace' }}>{result.latency_ms?.toFixed(0) || '—'}ms</span>
              </div>
            </div>

            {/* Summary & action */}
            <div style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderTop: 'none',
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                Summary
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#1E293B', lineHeight: '1.55' }}>{d.summary}</p>
            </div>

            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderTop: 'none',
              padding: '12px 16px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
                Suggested Action
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#334155', fontFamily: 'monospace', lineHeight: '1.5' }}>{d.suggested_action}</p>
            </div>

            {/* Metrics row */}
            <div style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderTop: 'none',
              borderRadius: '0 0 6px 6px',
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px',
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                  Confidence
                </div>
                <ConfidenceBar confidence={d.confidence} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                  Needs Human
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} color={d.needs_human ? '#D97706' : '#94A3B8'} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: d.needs_human ? '#92400E' : '#64748B' }}>
                    {d.needs_human ? 'Required' : 'Not required'}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                  Actions
                </div>
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '4px 10px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    background: '#fff',
                    color: copied ? '#15803D' : '#475569',
                    fontSize: '12px',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
            </div>

            {/* Raw JSON collapsible */}
            <details style={{ marginTop: '8px' }}>
              <summary style={{
                padding: '8px 12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '5px',
                fontSize: '12px',
                color: '#64748B',
                cursor: 'pointer',
                fontWeight: 500,
                userSelect: 'none',
              }}>
                Raw JSON Response
              </summary>
              <pre style={{
                margin: '4px 0 0',
                padding: '12px',
                background: '#0F172A',
                color: '#94A3B8',
                borderRadius: '5px',
                fontSize: '12px',
                lineHeight: '1.6',
                overflow: 'auto',
                maxHeight: '240px',
                fontFamily: 'monospace',
              }}>
                {JSON.stringify(d, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// re-export icon inline to avoid import issues
function MessageSquareIcon({ size, style }) {
  return <Send size={size} style={style} />;
}
