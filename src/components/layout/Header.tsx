'use client';

import Link from 'next/link';
import { Sparkles, Key, CheckCircle, Video, Volume2 } from 'lucide-react';

export function Header() {
  return (
    <header style={{
      height: '70px',
      position: 'fixed',
      top: 0,
      left: '260px',
      right: 0,
      background: 'rgba(10, 13, 23, 0.8)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      zIndex: 30
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pulsing-dot" />
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#CBD5E1' }}>Engine Status:</span>
          <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
            2.5D Motion Storybook
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Volume2 size={14} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Free Neural Edge-TTS</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/settings" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 14px' }}>
          <Key size={14} />
          <span>API Keys</span>
        </Link>
        <Link href="/stories" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
          <Sparkles size={16} />
          <span>Generate New Video</span>
        </Link>
      </div>
    </header>
  );
}
