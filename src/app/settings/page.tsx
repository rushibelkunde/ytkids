'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  Save, 
  Check, 
  DollarSign, 
  ShieldAlert, 
  Zap, 
  Volume2, 
  Palette, 
  ExternalLink
} from 'lucide-react';
import { YoutubeIcon } from '@/components/ui/YoutubeIcon';
import { StudioSettings, ProductionEngine, VisualStyle, TTSEngine } from '@/lib/types';
import { VISUAL_STYLES, SUGGESTED_VOICES } from '@/lib/presets';

export default function SettingsPage() {
  const [settings, setSettings] = useState<StudioSettings>({
    default_engine: 'motion_storybook',
    default_tts: 'edge_tts',
    default_style: '3d_pixar',
    default_language: 'English',
    default_voice: 'en-US-AnaNeural'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}>Loading Settings...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1000px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-purple">Configuration</span>
          <span className="badge badge-emerald">Budget Control</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Studio Settings &amp; API Keys</h1>
        <p style={{ fontSize: '0.95rem', color: '#94A3B8' }}>
          Manage your AI model keys, production engine defaults, and YouTube publishing access.
        </p>
      </div>

      {/* $10 Trial Budget Optimizer Card */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={26} color="#000" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>$10 Starter Trial Architecture</h3>
              <p style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '2px' }}>
                With <strong>Free Neural Edge-TTS</strong> + <strong>Motion Storybook (2.5D Animated)</strong>, each YouTube Short costs only <strong>~$0.05</strong>.
              </p>
            </div>
          </div>
          <span className="badge badge-emerald" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            Yields 100+ Videos
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* API Keys Section */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Key size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>AI Provider Keys</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Gemini API Key */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Google Gemini API Key (Story &amp; Script Generation)</label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  Get Free Key <ExternalLink size={12} />
                </a>
              </div>
              <input 
                type="password"
                className="input-field" 
                placeholder="AIzaSy..." 
                value={settings.gemini_api_key || ''} 
                onChange={e => setSettings({ ...settings, gemini_api_key: e.target.value })} 
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
                Free tier available. Used to write age-tailored scripts, character dialogue, and scene breakdowns.
              </span>
            </div>

            {/* Fal.ai API Key */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>fal.ai Key (Visual &amp; Video Generation)</label>
                <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-coral)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  Get fal.ai Key <ExternalLink size={12} />
                </a>
              </div>
              <input 
                type="password"
                className="input-field" 
                placeholder="fal_key_..." 
                value={settings.fal_key || ''} 
                onChange={e => setSettings({ ...settings, fal_key: e.target.value })} 
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
                Powers Flux high-res character art and Seedance / Kling video animation. (Local SVG generator works if empty).
              </span>
            </div>

            {/* ElevenLabs Key */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>ElevenLabs API Key (Optional)</label>
                <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  Get ElevenLabs Key <ExternalLink size={12} />
                </a>
              </div>
              <input 
                type="password"
                className="input-field" 
                placeholder="xi-api-key..." 
                value={settings.elevenlabs_api_key || ''} 
                onChange={e => setSettings({ ...settings, elevenlabs_api_key: e.target.value })} 
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
                Optional. You already have Free Neural Edge-TTS active out-of-the-box with zero fees.
              </span>
            </div>

          </div>
        </div>

        {/* Engine & Production Defaults */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Palette size={20} color="var(--accent-coral)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Production Defaults</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            
            {/* Default Engine */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                Default Production Mode
              </label>
              <select 
                className="input-field"
                value={settings.default_engine}
                onChange={e => setSettings({ ...settings, default_engine: e.target.value as ProductionEngine })}
              >
                <option value="motion_storybook">🚀 Motion Storybook (2.5D Animated, ~$0.05)</option>
                <option value="full_ai_video">🎬 Full AI Video (Seedance/Kling, ~$0.80)</option>
              </select>
            </div>

            {/* Voice Engine */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                Voiceover Engine
              </label>
              <select 
                className="input-field"
                value={settings.default_tts}
                onChange={e => setSettings({ ...settings, default_tts: e.target.value as TTSEngine })}
              >
                <option value="edge_tts">Free Edge-TTS (Zero Cost, 100% Free)</option>
                <option value="elevenlabs">ElevenLabs (Paid API)</option>
              </select>
            </div>

            {/* Default Voice */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                Default Narrator Voice
              </label>
              <select 
                className="input-field"
                value={settings.default_voice}
                onChange={e => setSettings({ ...settings, default_voice: e.target.value })}
              >
                {SUGGESTED_VOICES.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.personality})</option>
                ))}
              </select>
            </div>

            {/* Default Style */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                Default Visual Style
              </label>
              <select 
                className="input-field"
                value={settings.default_style}
                onChange={e => setSettings({ ...settings, default_style: e.target.value as VisualStyle })}
              >
                {VISUAL_STYLES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* YouTube Channel OAuth Setup */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <YoutubeIcon size={22} color="#FF0000" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>YouTube Channel Connection (OAuth 2.0)</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>Google OAuth Client ID</label>
              <input 
                className="input-field" 
                placeholder="xxxx.apps.googleusercontent.com" 
                value={settings.youtube_client_id || ''} 
                onChange={e => setSettings({ ...settings, youtube_client_id: e.target.value })} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>Google OAuth Client Secret</label>
              <input 
                type="password"
                className="input-field" 
                placeholder="GOCSPX-..." 
                value={settings.youtube_client_secret || ''} 
                onChange={e => setSettings({ ...settings, youtube_client_secret: e.target.value })} 
              />
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '8px', display: 'block' }}>
            Enter your Google OAuth credentials or configure them in .env.local to enable direct 1-click YouTube Shorts uploads.
          </span>
        </div>

        {/* Dungutuku Channel Branding & Assets */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Palette size={22} color="var(--accent-coral)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Dungutuku Channel Branding &amp; Assets</h3>
            </div>
            <span className="badge badge-purple">YouTube Ready</span>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginBottom: '20px' }}>
            High-resolution 3D animated channel graphics crafted specifically for your <strong>Dungutuku</strong> YouTube channel. Download and set them in your YouTube Studio customization settings.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
            
            {/* Logo Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '140px', height: '140px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-purple)', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)', marginBottom: '14px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/api/media/channel/dungutuku_logo.jpg" alt="Dungutuku Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'white' }}>Channel Logo / Avatar</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px', marginBottom: '14px' }}>
                1:1 Square (800 × 800)
              </div>
              <a href="/api/media/channel/dungutuku_logo.jpg" download="dungutuku_logo.jpg" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.82rem' }}>
                Download Logo
              </a>
            </div>

            {/* Banner Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/api/media/channel/dungutuku_banner.jpg" alt="Dungutuku Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: 'white' }}>Channel Banner Artwork</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px', marginBottom: '14px' }}>
                  16:9 Panoramic Widescreen (YouTube TV &amp; Mobile Safe Zone)
                </div>
              </div>
              <a href="/api/media/channel/dungutuku_banner.jpg" download="dungutuku_banner.jpg" className="btn btn-primary" style={{ width: '100%', fontSize: '0.82rem' }}>
                Download Channel Banner
              </a>
            </div>

          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px' }}>
          {savedSuccess && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.9rem', fontWeight: '700' }}>
              <Check size={18} /> Settings saved successfully!
            </span>
          )}
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving}
            style={{ padding: '12px 28px', fontSize: '1rem' }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
