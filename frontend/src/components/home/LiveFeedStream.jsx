import React, { useState, useEffect, useRef } from 'react';
import { Activity, Play, Pause } from 'lucide-react';
import { CategoryBadge, PriorityBadge } from '../Badges';
import { FEED_POOL, buildFeedRow } from './landingData';

export default function LiveFeedStream({ onSelectTab }) {
  const [feedRows, setFeedRows] = useState(() =>
    FEED_POOL.slice(0, 8).map((item, i) => buildFeedRow(item, i * 65000))
  );
  const [isFeedPaused, setIsFeedPaused] = useState(false);
  const poolIndexRef = useRef(8);

  useEffect(() => {
    if (isFeedPaused) return;
    const interval = setInterval(() => {
      const item = FEED_POOL[poolIndexRef.current % FEED_POOL.length];
      poolIndexRef.current++;
      const newRow = {
        ...buildFeedRow(item),
        time: new Date().toTimeString().slice(0, 8),
        fresh: true,
      };
      setFeedRows(prev => [newRow, ...prev.slice(0, 15)]);
    }, 2800);
    return () => clearInterval(interval);
  }, [isFeedPaused]);

  return (
    <section style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Feed Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={16} color="var(--accent)" />
          <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
            Live Ingestion Stream
          </h3>
          <span style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            padding: '2px 7px',
            borderRadius: '12px',
            background: 'var(--accent-bg)',
            color: 'var(--accent-text)',
            fontWeight: 600,
          }}>
            ● {isFeedPaused ? 'PAUSED' : 'STREAMING'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsFeedPaused(!isFeedPaused)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              fontSize: '11.5px',
              fontFamily: 'monospace',
              color: 'var(--text-2)',
              cursor: 'pointer',
            }}
          >
            {isFeedPaused ? <Play size={12} /> : <Pause size={12} />}
            <span>{isFeedPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={() => onSelectTab('triage')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '12px',
              color: 'var(--text-3)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            Inspect in Console →
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '70px 70px 1fr 130px 60px 70px 80px',
        gap: '12px',
        padding: '10px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-hover)',
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-3)',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        <span>Time</span>
        <span>ID</span>
        <span>Ticket Excerpt</span>
        <span>Domain</span>
        <span>SLA</span>
        <span>Latency</span>
        <span>Engine</span>
      </div>

      {/* Table Stream Rows */}
      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
        {feedRows.map((row, index) => {
          const isP0 = row.prio === 'P0';
          return (
            <div
              key={row.uid}
              onClick={() => onSelectTab('triage')}
              style={{
                display: 'grid',
                gridTemplateColumns: '70px 70px 1fr 130px 60px 70px 80px',
                gap: '12px',
                padding: '9px 24px',
                borderBottom: '1px solid var(--border)',
                borderLeft: isP0 ? '3px solid var(--red)' : '3px solid transparent',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '12.5px',
                transition: 'background 0.1s',
                background: isP0 ? 'var(--red-bg)' : index % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = isP0 ? 'var(--red-bg)' : index % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg)'}
            >
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-3)' }}>
                {row.time}
              </span>
              <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--text-2)', fontWeight: 500 }}>
                {row.id}
              </span>
              <span style={{
                color: 'var(--text-1)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: isP0 ? 600 : 400,
              }}>
                {row.excerpt}
              </span>
              <div>
                <CategoryBadge category={row.cat} />
              </div>
              <div>
                <PriorityBadge priority={row.prio} />
              </div>
              <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--text-3)' }}>
                {row.ms}ms
              </span>
              <span style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: row.engine === 'laya' ? 'var(--accent-text)' : 'var(--purple-text)',
              }}>
                {row.engine === 'laya' ? 'Laya (local)' : 'Groq (LLM)'}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{
        padding: '12px 24px',
        background: 'var(--bg-hover)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11.5px',
        color: 'var(--text-3)',
        fontFamily: 'monospace',
      }}>
        <span>Simulated live stream based on production benchmark pool</span>
        <span>Real inference active at /triage</span>
      </div>
    </section>
  );
}
