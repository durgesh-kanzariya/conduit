import React from 'react';

export default function PipelineSection() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Architecture Overview
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 8px' }}>
          The 4-Stage Decision Pipeline
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-2)', margin: 0, maxWidth: '680px', lineHeight: 1.6 }}>
          Every inbound ticket passes through rigorous input hygiene, deterministic classification routing,
          business impact SLA mapping, and human-in-the-loop escalation gates.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
      }}>
        {/* Step 1 */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius)',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'monospace',
            color: 'var(--text-1)',
          }}>
            01
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>
            Ingest & Sanitize
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>
            Strips raw HTML, script payloads, normalizes messy Unicode and multiformat inputs (JSON, text, multipart).
            Scans for prompt injections and adversarial overrides before passing to models.
          </p>
        </div>

        {/* Step 2 */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius)',
            background: 'var(--accent-bg)',
            border: '1px solid rgba(22,163,74,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'monospace',
            color: 'var(--accent-text)',
          }}>
            02
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>
            Local Fast Router
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>
            Runs <strong>ModernBERT (Laya)</strong> directly in memory on CPU. Zero network roundtrip, zero cloud cost,
            and zero telemetry egress. Resolves high-confidence tickets in sub-20ms.
          </p>
        </div>

        {/* Step 3 */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius)',
            background: '#FAF5FF',
            border: '1px solid rgba(126,34,206,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'monospace',
            color: 'var(--purple-text)',
          }}>
            03
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>
            Deep Reasoning Fallback
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>
            Activated if local model confidence is borderline or for complex, multi-intent queries.
            Queries <strong>Groq LLaMA-3.3-70B</strong> at temperature 0.0 with deterministic JSON schemas.
          </p>
        </div>

        {/* Step 4 */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius)',
            background: 'var(--blue-bg)',
            border: '1px solid rgba(37,99,235,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'monospace',
            color: 'var(--blue-text)',
          }}>
            04
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>
            SLA & Human Escalation
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>
            Validates confidence tiers. If confidence &lt; 0.50, the system automatically flags
            <code>needs_human = true</code> to prevent hallucinated routing. Applies strict P0–P3 enterprise SLAs.
          </p>
        </div>
      </div>
    </section>
  );
}
