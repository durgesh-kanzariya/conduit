import React from 'react';
import { CategoryBadge, PriorityBadge } from '../Badges';
import { CATEGORIES_DATA, SLA_PRIORITIES } from './landingData';

export default function TaxonomyMatrix() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Decision Framework
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
          Supported Taxonomy & SLA Matrix
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: '20px',
      }}>
        {/* 8 Categories */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '14px' }}>
            Classification Categories (8 Domain Classes)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {CATEGORIES_DATA.map(c => (
              <div
                key={c.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <CategoryBadge category={c.id} />
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-3)' }}>
                    Default: {c.defPrio}
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-2)', lineHeight: 1.4, marginTop: '2px' }}>
                  {c.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Priority Levels */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '2px' }}>
            Business Impact SLAs (P0–P3)
          </div>
          {SLA_PRIORITIES.map(p => (
            <div
              key={p.level}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PriorityBadge priority={p.level} />
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-1)' }}>
                    {p.label}
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: p.color }}>
                  SLA {p.sla}
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-2)', lineHeight: 1.4 }}>
                {p.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
