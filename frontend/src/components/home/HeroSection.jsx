import React from 'react';
import { Cpu, Cloud, Zap, ArrowRight, Layers, BarChart2, Shield, Terminal } from 'lucide-react';

export default function HeroSection({ onSelectTab }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header pill / telemetry status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          borderRadius: '20px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          fontSize: '11.5px',
          fontFamily: 'monospace',
          color: 'var(--text-2)',
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 6px var(--accent)',
            display: 'inline-block',
          }} />
          <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>CONDUIT ENGINE</span>
          <span style={{ color: 'var(--text-3)' }}>•</span>
          <span>LAYA ON-DEVICE ROUTER</span>
        </div>

        {/* Live Engine Badges */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11.5px',
          color: 'var(--text-3)',
          fontFamily: 'monospace',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Cpu size={13} color="var(--accent)" />
            <span>ModernBERT (Laya)</span>
          </span>
          <span>+</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Cloud size={13} color="var(--purple)" />
            <span>Groq LLaMA-3.3</span>
          </span>
          <span style={{ color: 'var(--text-4)' }}>|</span>
          <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>&lt; 30ms Latency</span>
        </div>
      </div>

      {/* Hero Content */}
      <div style={{ maxWidth: '820px' }}>
        <h1 style={{
          fontSize: '34px',
          fontWeight: 700,
          lineHeight: 1.22,
          letterSpacing: '-0.03em',
          color: 'var(--text-1)',
          margin: '0 0 16px',
        }}>
          High-Throughput Intelligent Decision Routing for Frontline Support.
        </h1>
        <p style={{
          fontSize: '15.5px',
          lineHeight: 1.6,
          color: 'var(--text-2)',
          margin: '0 0 28px',
          maxWidth: '720px',
        }}>
          Conduit is an enterprise decision router engineered for customer support and incident pipelines.
          It categorizes tickets across 8 business domains, enforces P0–P3 SLAs, extracts sentiment and urgency,
          and isolates prompt injections using a dual-engine architecture: local <strong>ModernBERT</strong> on CPU
          for sub-20ms routing, with <strong>Groq LLaMA-3.3-70B</strong> reasoning fallback.
        </p>

        {/* Quick Action Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onSelectTab('triage')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--text-1)',
              color: 'var(--bg-panel)',
              padding: '10px 18px',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Zap size={15} />
            <span>Launch Triage Console</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={() => onSelectTab('batch')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-panel)',
              color: 'var(--text-1)',
              padding: '9px 16px',
              borderRadius: 'var(--radius)',
              fontWeight: 500,
              fontSize: '13px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-panel)'}
          >
            <Layers size={15} color="var(--text-2)" />
            <span>Batch Runner</span>
          </button>

          <button
            onClick={() => onSelectTab('eval')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-panel)',
              color: 'var(--text-1)',
              padding: '9px 16px',
              borderRadius: 'var(--radius)',
              fontWeight: 500,
              fontSize: '13px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-panel)'}
          >
            <BarChart2 size={15} color="var(--text-2)" />
            <span>Evaluation Benchmarks</span>
          </button>
        </div>
      </div>

      {/* Architecture Highlights Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginTop: '8px',
      }}>
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="var(--accent)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tier-1: Laya Engine
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
            Local ModernBERT
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            Sub-20ms inference directly on CPU. 100% on-premise privacy with zero cloud egress cost.
          </div>
        </div>

        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={16} color="var(--purple)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tier-2: Deep Reasoning
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
            Groq LLaMA-3.3-70B
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            Structured JSON output at temp 0.0 for edge cases, sentiment, and auto-reply suggestions.
          </div>
        </div>

        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="var(--amber)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Security & Hygiene
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
            Sanitization & Guardrails
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            XSS & HTML stripping via BS4, prompt injection heuristics, and calibrated human escalations.
          </div>
        </div>

        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={16} color="var(--blue)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Throughput & Scale
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
            FastAPI + ORJSON
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            Non-blocking async pipelines, lifespan model preloading, batch CSV ingestion queues.
          </div>
        </div>
      </div>
    </section>
  );
}
