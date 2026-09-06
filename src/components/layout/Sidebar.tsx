'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Users, 
  BookOpen, 
  Film, 
  Library, 
  Settings, 
  Zap,
  DollarSign
} from 'lucide-react';
import { YoutubeIcon } from '@/components/ui/YoutubeIcon';

const NAV_ITEMS = [
  { href: '/', label: 'Studio Dashboard', icon: Sparkles },
  { href: '/characters', label: 'Character Workshop', icon: Users },
  { href: '/stories', label: 'Story & Script Studio', icon: BookOpen },
  { href: '/studio', label: 'Production Studio', icon: Film },
  { href: '/library', label: 'Video Library & YouTube', icon: Library },
  { href: '/settings', label: 'API Keys & Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 40,
      padding: '24px 16px',
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--grad-sunset)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(255, 94, 98, 0.4)'
        }}>
          <YoutubeIcon size={24} color="#FFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #FFF, #FCD34D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              YTKids
            </span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(255, 94, 98, 0.2)', color: '#FF7E82', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>
              PRO
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94A3B8' }}>AI Video Creation Studio</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.92rem',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                background: isActive ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0.08) 100%)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-purple)' : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} color={isActive ? 'var(--accent-purple)' : '#64748B'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Budget & Optimization Box */}
      <div className="glass-panel" style={{ padding: '14px', marginTop: 'auto', background: 'rgba(15, 23, 42, 0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={15} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F8FAFC' }}>$10 Smart Budget</span>
          </div>
          <span className="badge badge-emerald" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>ACTIVE</span>
        </div>
        <p style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: '1.3' }}>
          Motion Storybook: <strong style={{ color: '#FCD34D' }}>~$0.05/video</strong>
        </p>
        <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
          <div style={{ width: '8%', height: '100%', background: 'var(--grad-sunset)', borderRadius: '4px' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.68rem', color: '#64748B' }}>
          <span>Free Edge-TTS</span>
          <span>100+ Capacity</span>
        </div>
      </div>
    </aside>
  );
}
