// ---------------------------------------------------------------------------
// Preset Test Data for Live Playground
// ---------------------------------------------------------------------------

export const PLAYGROUND_PRESETS = [
  {
    id: 'outage',
    label: '🚨 Production 503 Outage',
    badge: 'P0 Outage',
    text: 'Our production database and API gateway are returning 503 Service Unavailable for all EU customers since 08:30 UTC. Transactions are failing and customers cannot check out.',
    expected: {
      category: 'outage',
      priority: 'P0',
      confidence: 0.98,
      engine: 'Laya (ModernBERT)',
      needs_human: false,
      urgency: 'critical',
      sentiment: 'frustrated',
      latency: 14,
      action: 'Trigger P0 PagerDuty incident, notify Site Reliability Engineering, display public status banner.',
    },
  },
  {
    id: 'billing',
    label: '💳 Duplicate Subscription Charge',
    badge: 'P1 Billing',
    text: 'My credit card was charged twice ($49.00 each) on invoice #INV-9281 this morning for our Pro workspace subscription. Please issue a refund for the duplicate charge.',
    expected: {
      category: 'billing',
      priority: 'P1',
      confidence: 0.95,
      engine: 'Laya (ModernBERT)',
      needs_human: true,
      urgency: 'high',
      sentiment: 'concerned',
      latency: 16,
      action: 'Verify transaction ID in Stripe, void duplicate authorization, initiate auto-refund receipt.',
    },
  },
  {
    id: 'auth',
    label: '🔑 Okta SSO SAML Error',
    badge: 'P2 Auth',
    text: 'Our team is unable to sign in via Okta SAML SSO. It gives an invalid certificate error on redirect. Individual email/password logins still work as a temporary workaround.',
    expected: {
      category: 'auth',
      priority: 'P2',
      confidence: 0.93,
      engine: 'Laya (ModernBERT)',
      needs_human: false,
      urgency: 'medium',
      sentiment: 'neutral',
      latency: 18,
      action: 'Dispatch to Identity & Security queue; verify SAML x509 cert expiration.',
    },
  },
  {
    id: 'feature',
    label: '💡 Webhook CSV Export',
    badge: 'P3 Feature',
    text: 'Would love an automated webhook or daily scheduled S3 sync for raw ticket resolution logs so we can feed them into our internal Snowflake analytics warehouse.',
    expected: {
      category: 'feature_request',
      priority: 'P3',
      confidence: 0.91,
      engine: 'Laya (ModernBERT)',
      needs_human: false,
      urgency: 'low',
      sentiment: 'positive',
      latency: 15,
      action: 'Log to Product Management backlog in Linear; subscribe requester to telemetry feature updates.',
    },
  },
];

// ---------------------------------------------------------------------------
// Simulated Live Feed Ticket Stream Data
// ---------------------------------------------------------------------------

export const FEED_POOL = [
  { excerpt: 'Production API returning 503 for all endpoints',        cat: 'outage',          prio: 'P0', ms: 11, engine: 'laya' },
  { excerpt: 'Card charged twice on annual workspace invoice',         cat: 'billing',         prio: 'P1', ms: 38, engine: 'hybrid' },
  { excerpt: 'Okta SAML assertion signature verification failed',      cat: 'auth',            prio: 'P1', ms: 16, engine: 'laya' },
  { excerpt: 'Can you support webhook destinations for triage events?',cat: 'feature_request', prio: 'P3', ms: 44, engine: 'groq' },
  { excerpt: 'Login modal does not respond on Safari 17.4',           cat: 'bug_report',      prio: 'P2', ms: 19, engine: 'laya' },
  { excerpt: 'Foreign IP login detected on root admin account',        cat: 'security_flag',   prio: 'P0', ms: 14, engine: 'laya' },
  { excerpt: 'Love the speed improvements in the new dashboard',       cat: 'feedback',        prio: 'P3', ms: 52, engine: 'groq' },
  { excerpt: 'Need tax exemption certificate applied to subscription', cat: 'billing',         prio: 'P3', ms: 29, engine: 'hybrid' },
  { excerpt: 'Entire organization locked out after domain change',     cat: 'outage',          prio: 'P0', ms: 9,  engine: 'laya' },
  { excerpt: 'CSV export omits timestamps for older customer entries', cat: 'bug_report',      prio: 'P2', ms: 23, engine: 'hybrid' },
  { excerpt: 'Where can I find the public OpenAPI documentation?',     cat: 'out_of_scope',    prio: 'P3', ms: 8,  engine: 'laya' },
  { excerpt: '2FA authentication SMS codes not arriving',              cat: 'auth',            prio: 'P1', ms: 15, engine: 'laya' },
];

let _feedUid = 1000;
export function buildFeedRow(item, offsetMs = 0) {
  const d = new Date(Date.now() - offsetMs);
  const jitter = Math.floor((Math.random() - 0.5) * 6);
  return {
    uid: ++_feedUid,
    id: `#${1500 + (_feedUid % 400)}`,
    time: d.toTimeString().slice(0, 8),
    excerpt: item.excerpt,
    cat: item.cat,
    prio: item.prio,
    ms: Math.max(6, item.ms + jitter),
    engine: item.engine,
    fresh: false,
  };
}

// ---------------------------------------------------------------------------
// Supported Categories & Priority Matrix
// ---------------------------------------------------------------------------

export const CATEGORIES_DATA = [
  { id: 'outage',          label: 'Outage / Downtime',      desc: 'Infrastructure failure, 5xx server errors, critical database locks.', defPrio: 'P0' },
  { id: 'security_flag',   label: 'Security & Abuse',       desc: 'Account takeover, credential stuffing, prompt injection, data breach.', defPrio: 'P0' },
  { id: 'billing',         label: 'Billing & Payments',     desc: 'Disputed charges, invoice generation, refunds, subscription seats.', defPrio: 'P1' },
  { id: 'auth',            label: 'Authentication / SSO',   desc: 'Password resets, 2FA issues, SAML / Okta federation, access lockouts.', defPrio: 'P1' },
  { id: 'bug_report',      label: 'Bug Report',             desc: 'Frontend glitches, unexpected error codes, browser incompatibilities.', defPrio: 'P2' },
  { id: 'feature_request', label: 'Feature Request',        desc: 'New integrations, UX enhancements, public API extension requests.', defPrio: 'P3' },
  { id: 'feedback',        label: 'User Feedback',          desc: 'Net Promoter Score comments, testimonials, qualitative experience notes.', defPrio: 'P3' },
  { id: 'out_of_scope',    label: 'Out of Scope / General', desc: 'Marketing inquiries, unclassifiable noise, generic greetings.', defPrio: 'P3' },
];

export const SLA_PRIORITIES = [
  { level: 'P0', label: 'Emergency / Outage', color: 'var(--red)', bg: 'var(--red-bg)', text: 'var(--red-text)', sla: '< 5 mins', desc: 'System-wide outage, active security breach, multiple customer transaction failures.' },
  { level: 'P1', label: 'Critical Blocker',  color: 'var(--amber)', bg: 'var(--amber-bg)', text: 'var(--amber-text)', sla: '< 30 mins', desc: 'Paying customer completely blocked from key functionality with no available workaround.' },
  { level: 'P2', label: 'Degraded / Moderate',color: 'var(--blue)', bg: 'var(--blue-bg)', text: 'var(--blue-text)', sla: '< 4 hours', desc: 'Partial functionality impaired; functional workaround exists for the customer.' },
  { level: 'P3', label: 'General / Low',      color: 'var(--text-3)', bg: 'var(--bg-hover)', text: 'var(--text-2)', sla: '< 24 hours', desc: 'General product questions, new feature requests, or minor non-blocking feedback.' },
];
