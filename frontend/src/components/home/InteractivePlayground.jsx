import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowUpRight, Clock, RefreshCw, Send, AlertTriangle, Download } from 'lucide-react';
import { CategoryBadge, PriorityBadge } from '../Badges';
import { API_BASE } from '../../config';
import { PLAYGROUND_PRESETS } from './landingData';
import { useEngine } from '../../context/EngineContext';

export default function InteractivePlayground({ onSelectTab }) {
  const { layaAvailable, openDownloadModal } = useEngine();
  const [selectedPreset, setSelectedPreset] = useState(PLAYGROUND_PRESETS[0]);
  const [customInput, setCustomInput] = useState(PLAYGROUND_PRESETS[0].text);
  const [playResult, setPlayResult] = useState(PLAYGROUND_PRESETS[0].expected);
  const [isClassifying, setIsClassifying] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState(() => layaAvailable ? 'laya' : 'hybrid');
  const [isPendingClassification, setIsPendingClassification] = useState(false);

  useEffect(() => {
    if (!layaAvailable && selectedEngine === 'laya') {
      setSelectedEngine('hybrid');
    }
  }, [layaAvailable, selectedEngine]);

  // Execute quick classification in playground
  const handleRunPlayground = async (textToRun = customInput) => {
    if (!textToRun.trim()) return;
    if (selectedEngine === 'laya' && !layaAvailable) {
      openDownloadModal();
      return;
    }
    setIsClassifying(true);
    const startT = performance.now();

    try {
      const res = await fetch(`${API_BASE}/api/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToRun, provider: selectedEngine }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.detail && errJson.detail.includes('Local Laya model is not available')) {
          openDownloadModal();
        }
      }

      if (res.ok) {
        const data = await res.json();
        const decision = data.decision || data;
        const duration = data.latency_ms ? Math.round(data.latency_ms) : Math.round(performance.now() - startT);
        setPlayResult({
          category: decision.category || 'unknown',
          priority: decision.priority || 'P3',
          confidence: decision.confidence ?? 0.92,
          engine: decision.tier_used === 'laya' || selectedEngine === 'laya' ? 'Laya (ModernBERT)' : (decision.tier_used || selectedEngine),
          needs_human: Boolean(decision.needs_human),
          urgency: decision.urgency || (decision.priority === 'P0' ? 'critical' : decision.priority === 'P1' ? 'high' : 'medium'),
          sentiment: decision.sentiment || 'neutral',
          latency: duration,
          action: decision.suggested_action || decision.summary || 'Ticket classified and ready for queue dispatch.',
        });
        setIsPendingClassification(false);
        setIsClassifying(false);
        return;
      }
    } catch {
      // Fallback to local preset simulation
    }

    // Fallback simulation
    setTimeout(() => {
      const duration = Math.round(performance.now() - startT);
      const match = PLAYGROUND_PRESETS.find(p => p.text === textToRun) || selectedPreset;
      setPlayResult({
        ...match.expected,
        engine: selectedEngine === 'laya' ? 'Laya (ModernBERT)' : selectedEngine === 'groq' ? 'Groq (LLaMA-3.3)' : 'Hybrid Router',
        latency: Math.max(8, duration || (selectedEngine === 'laya' ? 14 : match.expected.latency)),
      });
      setIsPendingClassification(false);
      setIsClassifying(false);
    }, 120);
  };

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setCustomInput(preset.text);
    setIsPendingClassification(true);
    // Explicitly do not invoke classification API automatically
  };

  return (
    <section style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Playground header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-panel)',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            <Sparkles size={13} />
            <span>Interactive Classifier</span>
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
            Test Conduit Decision Routing
          </h2>
        </div>

        <button
          onClick={() => onSelectTab('triage')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            fontSize: '12px',
            color: 'var(--text-2)',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--border-mid)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <span>Open in Full Triage Console</span>
          <ArrowUpRight size={13} />
        </button>
      </div>

      {/* Preset Buttons & Engine Selection */}
      <div style={{
        padding: '12px 24px',
        background: 'var(--bg-hover)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-3)', fontWeight: 500, marginRight: '4px' }}>
            Sample Inputs:
          </span>
          {PLAYGROUND_PRESETS.map(preset => {
            const isActive = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius)',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  border: isActive ? '1px solid var(--text-1)' : '1px solid var(--border)',
                  background: isActive ? 'var(--bg-panel)' : 'transparent',
                  color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Engine Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-3)', fontFamily: 'monospace' }}>Engine:</span>
          <select
            value={selectedEngine}
            onChange={e => {
              if (e.target.value === 'laya' && !layaAvailable) {
                openDownloadModal();
                return;
              }
              setSelectedEngine(e.target.value);
              setIsPendingClassification(true);
            }}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-panel)',
              color: 'var(--text-1)',
              fontSize: '11.5px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="laya" disabled={!layaAvailable}>
              {layaAvailable ? 'Laya (ModernBERT - Local CPU)' : 'Laya (PC Only - Unavailable on Cloud)'}
            </option>
            <option value="hybrid">Hybrid (Local + Groq Fallback)</option>
            <option value="groq">Groq (LLaMA-3.3 Cloud)</option>
          </select>
        </div>
      </div>

      {/* Cloud Notice banner in Playground when Laya is not available */}
      {!layaAvailable && (
        <div style={{
          padding: '8px 24px',
          background: 'var(--amber-bg)',
          borderBottom: '1px solid rgba(217,119,6,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--amber-text)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={13} />
            <span>
              <strong>Cloud Mode:</strong> Laya (ModernBERT) model requires local PC memory and cannot run on cloud hosting (Render.com). Download the project to run Laya locally on your PC.
            </span>
          </div>
          <button
            onClick={openDownloadModal}
            style={{
              background: 'transparent',
              border: '1px solid rgba(217,119,6,0.4)',
              color: 'var(--amber-text)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Run on PC
          </button>
        </div>
      )}

      {/* Playground Body: 2 Columns (Input / Result) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
        divideX: '1px solid var(--border)',
      }}>
        {/* Left: Input Textarea */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', borderRight: '1px solid var(--border)' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Unstructured Ticket Payload
          </label>
          <textarea
            value={customInput}
            onChange={e => {
              setCustomInput(e.target.value);
              setIsPendingClassification(true);
            }}
            placeholder="Type or paste any customer issue, bug report, or billing dispute..."
            rows={5}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-1)',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.55,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: isPendingClassification ? 'var(--amber-text)' : 'var(--text-3)' }}>
              {isPendingClassification
                ? `● Sample loaded — Click "Classify Ticket" to route with ${selectedEngine === 'laya' ? 'Laya (Local)' : selectedEngine}`
                : 'Press classify to route payload through Conduit'}
            </span>
            <button
              onClick={() => handleRunPlayground(customInput)}
              disabled={isClassifying || !customInput.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--text-1)',
                color: 'var(--bg-panel)',
                padding: '7px 14px',
                borderRadius: 'var(--radius)',
                fontSize: '12.5px',
                fontWeight: 600,
                border: 'none',
                cursor: isClassifying ? 'wait' : 'pointer',
                opacity: isClassifying ? 0.7 : 1,
              }}
            >
              {isClassifying ? (
                <>
                  <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Routing...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Classify Ticket</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Decision Output */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-panel)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {isPendingClassification ? 'Decision Output (Click Classify to Evaluate)' : 'Conduit Decision Output'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--text-3)' }}>
              <Clock size={12} />
              <span>{playResult.latency}ms latency</span>
            </div>
          </div>

          {/* Badges strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <CategoryBadge category={playResult.category} />
            <PriorityBadge priority={playResult.priority} />
            <span style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-2)',
            }}>
              {playResult.engine}
            </span>
            {playResult.needs_human && (
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--amber-bg)',
                color: 'var(--amber-text)',
                border: '1px solid rgba(217,119,6,0.3)',
              }}>
                Human Escalation Flagged
              </span>
            )}
          </div>

          {/* Confidence Gauge */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)', marginBottom: '5px' }}>
              <span>Model Confidence</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-1)' }}>
                {Math.round(playResult.confidence * 100)}%
              </span>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.round(playResult.confidence * 100)}%`,
                height: '100%',
                background: playResult.confidence >= 0.8 ? 'var(--accent)' : 'var(--amber)',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Recommended Action / Summary */}
          <div style={{
            background: 'var(--bg-code)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px',
            fontSize: '12.5px',
            color: 'var(--text-2)',
            lineHeight: 1.5,
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Suggested Automated Action
            </div>
            {playResult.action}
          </div>
        </div>
      </div>
    </section>
  );
}
