import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Cpu, Download, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function RunLocalModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const cloneCommands = `# 1. Clone the repository
git clone https://github.com/durgesh-kanzariya/frontline-ai-triage.git
cd frontline-ai-triage

# 2. Install dependencies & launch local Backend (loads ModernBERT into local memory)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. In a new terminal, start the Frontend
cd ../frontend
npm install
npm run dev`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cloneCommands);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fade-in 0.15s ease-out',
    }}>
      <div style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '620px',
        width: '100%',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-panel)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius)',
              background: 'var(--accent-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Cpu size={16} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>
                Run Laya (ModernBERT) Locally
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'var(--amber-bg)',
            border: '1px solid rgba(217,119,6,0.3)',
            borderRadius: 'var(--radius)',
            padding: '12px 14px',
            fontSize: '12.5px',
            color: 'var(--amber-text)',
            lineHeight: 1.5,
          }}>
            <strong>Why is Laya unavailable on the live cloud?</strong>
            <p style={{ margin: '4px 0 0', color: 'var(--text-2)', fontSize: '12px' }}>
              The <strong>Laya (ModernBERT)</strong> router is designed as an on-device model that runs in local CPU memory for sub-20ms latency and 100% data privacy.
              Because live cloud platforms (like Render.com free tier) have strict RAM limits, local PyTorch model weights are disabled on the public web deployment.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>
                Download & Run on Your Local PC:
              </span>
              <button
                onClick={handleCopy}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 8px',
                  fontSize: '11px',
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                {copied ? <Check size={12} color="var(--accent)" /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre style={{
              margin: 0,
              background: 'var(--bg-code)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 14px',
              fontSize: '11.5px',
              fontFamily: 'monospace',
              color: 'var(--text-1)',
              lineHeight: 1.6,
              overflowX: 'auto',
            }}>
              {cloneCommands}
            </pre>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-3)',
          }}>
            <ShieldCheck size={14} color="var(--accent)" />
            <span>On your local PC, Conduit will automatically detect your local CPU and enable the fast-path Laya router.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-hover)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <a
            href="https://github.com/durgesh-kanzariya/frontline-ai-triage"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              color: 'var(--text-2)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <span>View GitHub Repository</span>
            <ArrowUpRight size={13} />
          </a>

          <button
            onClick={onClose}
            style={{
              background: 'var(--text-1)',
              color: 'var(--bg-panel)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
