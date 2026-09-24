import React from 'react';
import { Zap, Layers, BarChart2, ArrowRight } from 'lucide-react';

export default function WorkspaceCards({ onSelectTab }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          System Modules
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
          Three Dedicated Workspaces in Conduit
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '20px',
      }}>
        {/* Card 1: Interactive Triage */}
        <div
          onClick={() => onSelectTab('triage')}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--text-2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius)',
              background: 'var(--accent-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Zap size={20} color="var(--accent)" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)', margin: '0 0 8px' }}>
              Interactive Triage Console
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 16px' }}>
              Inspect real-time inferences with complete telemetry. Test raw text, JSON, or HTML inputs.
              Examine confidence calibrations, sentiment, urgency scores, and raw JSON payload outputs.
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', padding: '2px 7px', background: 'var(--bg-hover)', borderRadius: '4px', color: 'var(--text-3)', fontFamily: 'monospace' }}>Single Request</span>
              <span style={{ fontSize: '11px', padding: '2px 7px', background: 'var(--bg-hover)', borderRadius: '4px', color: 'var(--text-3)', fontFamily: 'monospace' }}>Auto-Replier</span>
              <span style={{ fontSize: '11px', padding: '2px 7px', background: 'var(--bg-hover)', borderRadius: '4px', color: 'var(--text-3)', fontFamily: 'monospace' }}>Raw JSON</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-1)',
          }}>
            <span>Open Triage Console</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Card 2: Batch Runner */}
        <div
          onClick={() => onSelectTab('batch')}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--text-2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius)',
              background: 'var(--blue-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Layers size={20} color="var(--blue)" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)', margin: '0 0 8px' }}>
              High-Throughput Batch Runner
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 16px' }}>
              Ingest and process historical CSV ticket exports or benchmark test suites.
              Monitor parallel async execution, real-time throughput metrics (tickets/sec), and export classified records.
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', padding: '2px 7px', background: 'var(--bg-hover)', borderRadius: '4px', color: 'var(--text-3)', fontFamily: 'monospace' }}>CSV / JSON Upload</span>
              <span style={{ fontSize: '11px', padding: '2px 7px', background: 'var(--bg-hover)', borderRadius: '4px', color: 'var(--text-3)', fontFamily: 'monospace' }}>Concurrent Workers</span>
              <span style={{ fontSize: '11px', padding: '2px 7px', background: 'var(--bg-hover)', borderRadius: '4px', color: 'var(--text-3)', fontFamily: 'monospace' }}>Export Results</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-1)',
          }}>
            <span>Launch Batch Processing</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Card 3: Evaluation Suite */}
        <div
          onClick={() => onSelectTab('eval')}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--text-2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius)',
              background: '#FAF5FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <BarChart2 size={20} color="var(--purple)" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)', margin: '0 0 8px' }}>
              Model Accuracy & Evaluation
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 16px' }}>
              Validate decisions against ground-truth datasets. Track precision, recall, F1 scores per category,
              examine confusion matrix distribution, and analyze P50, P95, and P99 latency percentiles.
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', padding: '2px 7px', background: 'var(--bg-hover)', borderRadius: '4px', color: 'var(--text-3)', fontFamily: 'monospace' }}>Ground Truth</span>
              <span style={{ fontSize: '11px', padding: '2px 7px', background: 'var(--bg-hover)', borderRadius: '4px', color: 'var(--text-3)', fontFamily: 'monospace' }}>Confusion Matrix</span>
              <span style={{ fontSize: '11px', padding: '2px 7px', background: 'var(--bg-hover)', borderRadius: '4px', color: 'var(--text-3)', fontFamily: 'monospace' }}>P95 Latency</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-1)',
          }}>
            <span>View Evaluation Benchmarks</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </section>
  );
}
