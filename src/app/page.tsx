'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Film, 
  Users, 
  BookOpen, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Play, 
  Plus, 
  Layers,
  Palette
} from 'lucide-react';
import { YoutubeIcon } from '@/components/ui/YoutubeIcon';
import { CONTENT_NICHES, VISUAL_STYLES, AGE_GROUPS, STARTER_PROMPTS } from '@/lib/presets';
import { Character, Story, VideoProject, ContentNiche, TargetAgeGroup, VisualStyle } from '@/lib/types';

export default function Dashboard() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick generator form state
  const [prompt, setPrompt] = useState(STARTER_PROMPTS[0].prompt);
  const [niche, setNiche] = useState<ContentNiche>('moral_story');
  const [ageGroup, setAgeGroup] = useState<TargetAgeGroup>('early');
  const [style, setStyle] = useState<VisualStyle>('3d_pixar');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [charsRes, storiesRes, vidsRes] = await Promise.all([
          fetch('/api/characters').then(r => r.json()),
          fetch('/api/stories').then(r => r.json()),
          fetch('/api/videos').then(r => r.json())
        ]);
        setCharacters(charsRes || []);
        setStories(storiesRes || []);
        setVideos(vidsRes || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQuickGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || generating) return;
    setGenerating(true);

    try {
      const res = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          niche,
          age_group: ageGroup,
          style,
          language: 'English',
          character_ids: characters.slice(0, 1).map(c => c.id)
        })
      });

      if (res.ok) {
        const story: Story = await res.json();
        router.push(`/studio?story_id=${story.id}`);
      } else {
        alert('Could not generate story. Check API keys in settings or try again.');
      }
    } catch (err: any) {
      alert('Error generating story: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Hero Banner */}
      <div className="glass-panel glass-panel-glow" style={{
        padding: '36px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(26, 34, 56, 0.9) 0%, rgba(17, 23, 40, 0.9) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          right: '-40px',
          top: '-40px',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(255, 94, 98, 0.25) 0%, rgba(139, 92, 246, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span className="badge badge-coral">🚀 AI YouTube Kids Studio</span>
            <span className="badge badge-purple">✨ Character Consistency Guaranteed</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.15, marginBottom: '14px', background: 'linear-gradient(135deg, #FFFFFF 40%, #FBBF24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Create High-Retention Kids Shorts & Videos in Minutes
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: '24px' }}>
            Transform prompts into complete animated stories with persistent recurring characters, warm natural narration, cinematic Ken Burns camera motion, and automatic subtitles.
          </p>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>Recurring Characters</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#F8FAFC' }}>{characters.length}</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>Scripted Stories</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#A78BFA' }}>{stories.length}</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>Produced Videos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#38BDF8' }}>{videos.length}</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>Est. Cost per Short</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FCD34D' }}>~$0.05</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Creation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '28px' }}>
        
        {/* Instant AI Video Creator Form */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700' }}>Instant Prompt-to-Video Creator</h2>
              <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Enter a theme or choose from top trending kids formats</p>
            </div>
            <span className="badge badge-amber">Instant Scripting</span>
          </div>

          <form onSubmit={handleQuickGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Story Prompt */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '8px' }}>
                Story Theme / Prompt
              </label>
              <textarea 
                className="input-field textarea-field" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A little baby dinosaur learns to count colorful berries with his mommy..."
                rows={3}
              />
            </div>

            {/* Quick Inspiration Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {STARTER_PROMPTS.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(sp.prompt);
                    setNiche(sp.niche);
                    setStyle(sp.style);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '20px' }}
                >
                  💡 {sp.title}
                </button>
              ))}
            </div>

            {/* Selectors Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {/* Niche */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                  Content Niche
                </label>
                <select 
                  className="input-field" 
                  value={niche} 
                  onChange={(e) => setNiche(e.target.value as ContentNiche)}
                >
                  {CONTENT_NICHES.map(n => (
                    <option key={n.id} value={n.id}>{n.icon} {n.title}</option>
                  ))}
                </select>
              </div>

              {/* Age Group */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                  Target Age
                </label>
                <select 
                  className="input-field" 
                  value={ageGroup} 
                  onChange={(e) => setAgeGroup(e.target.value as TargetAgeGroup)}
                >
                  {AGE_GROUPS.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>

              {/* Visual Style */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                  Art Style
                </label>
                <select 
                  className="input-field" 
                  value={style} 
                  onChange={(e) => setStyle(e.target.value as VisualStyle)}
                >
                  {VISUAL_STYLES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={generating}
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', marginTop: '6px' }}
            >
              {generating ? (
                <>
                  <Sparkles className="spin" size={18} />
                  <span>Generating Multi-Scene Storyboard...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate Storyboard & Go To Studio</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Cast & Persistent Characters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--accent-purple)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Your Character Cast</h3>
              </div>
              <Link href="/characters" className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                Manage All →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {characters.slice(0, 3).map(char => (
                <div 
                  key={char.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    background: 'var(--grad-sunset)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '1.2rem',
                    color: '#FFF',
                    flexShrink: 0
                  }}>
                    {char.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {char.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {char.species} • {char.age_appearance}
                    </div>
                  </div>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                    Visual DNA
                  </span>
                </div>
              ))}

              <Link href="/characters" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>
                <Plus size={16} />
                <span>Create New Consistent Character</span>
              </Link>
            </div>
          </div>

          {/* Strategy Tip Card */}
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-coral)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={16} color="var(--accent-coral)" />
              <span style={{ fontWeight: '700', fontSize: '0.88rem' }}>2026 YouTube Kids Growth Tip</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Use the same protagonist (like <em>Pip the Fox</em>) across 10+ episodes! YouTube’s recommendation algorithm clusters recurring characters, boosting your channel’s binge-watch retention by up to <strong>300%</strong>.
            </p>
          </div>

        </div>

      </div>

      {/* Recent Videos & Production Showcase */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Recent Rendered Videos</h2>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Your ready-to-upload YouTube Shorts & Episodes</p>
          </div>
          <Link href="/library" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            View Full Library ({videos.length}) →
          </Link>
        </div>

        {videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px' }}>
            <Film size={40} color="#475569" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1rem', color: '#CBD5E1', marginBottom: '6px' }}>No videos rendered yet</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: '400px', margin: '0 auto 18px' }}>
              Click above to generate your first kids storyboard, then hit &quot;1-Click Render&quot; in the studio!
            </p>
            <button 
              onClick={() => {
                const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                if (btn) btn.click();
              }}
              className="btn btn-primary"
            >
              <Sparkles size={16} />
              <span>Create First Video Now</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {videos.slice(0, 4).map(vid => (
              <div key={vid.id} style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div style={{ position: 'relative', height: '160px', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {vid.thumbnail_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={vid.thumbnail_path} alt={vid.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Film size={32} color="#64748B" />
                  )}
                  <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {Math.round(vid.duration_seconds)}s
                  </span>
                  <span className="badge badge-coral" style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.65rem' }}>
                    {vid.aspect_ratio} Shorts
                  </span>
                </div>
                <div style={{ padding: '14px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: '700', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {vid.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Ready to Publish</span>
                    <Link href={`/library?video_id=${vid.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                      Publish →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
