import React from 'react';
import TopNav from './TopNav';
import HeroSection from './home/HeroSection';
import InteractivePlayground from './home/InteractivePlayground';
import PipelineSection from './home/PipelineSection';
import WorkspaceCards from './home/WorkspaceCards';
import TaxonomyMatrix from './home/TaxonomyMatrix';
import LiveFeedStream from './home/LiveFeedStream';
import FooterSection from './home/FooterSection';

export default function LandingPage({ onSelectTab, theme, toggleTheme }) {
  return (
    <div style={{
      background: 'var(--bg)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background 0.2s',
      color: 'var(--text-1)',
    }}>
      <TopNav
        activeTab="home"
        onSelectTab={onSelectTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div style={{
        maxWidth: '1120px',
        margin: '0 auto',
        padding: '40px 24px 80px',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '64px',
      }}>
        {/* Section 1: Hero & Architecture Highlights */}
        <HeroSection onSelectTab={onSelectTab} />

        {/* Section 2: Interactive Sandbox Playground */}
        <InteractivePlayground onSelectTab={onSelectTab} />

        {/* Section 3: 4-Stage Decision Routing Pipeline */}
        <PipelineSection />

        {/* Section 4: Three Core Workspaces in Conduit */}
        <WorkspaceCards onSelectTab={onSelectTab} />

        {/* Section 5: Supported Taxonomy (8 categories) & SLA Matrix */}
        <TaxonomyMatrix />

        {/* Section 6: Real-time Ingestion Stream */}
        <LiveFeedStream onSelectTab={onSelectTab} />

        {/* Section 7: Technical Specifications & Footer */}
        <FooterSection onSelectTab={onSelectTab} />
      </div>
    </div>
  );
}
