'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  BookOpen, 
  Sparkles, 
  Film, 
  Trash2, 
  Check, 
  ArrowRight, 
  Edit3, 
  Save, 
  Clock, 
  Layers,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Story, Character, ContentNiche, TargetAgeGroup, VisualStyle } from '@/lib/types';
import { CONTENT_NICHES, VISUAL_STYLES, AGE_GROUPS, STARTER_PROMPTS } from '@/lib/presets';

export const dynamic = 'force-dynamic';

export default function StoriesPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}>Loading Stories Studio...</div>}>
      <StoriesPageContent />
    </Suspense>
  );
}

function StoriesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCharId = searchParams.get('char_id');

  const [stories, setStories] = useState<Story[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form State
  const [prompt, setPrompt] = useState(STARTER_PROMPTS[0].prompt);
  const [niche, setNiche] = useState<ContentNiche>('slapstick_comedy');
  const [ageGroup, setAgeGroup] = useState<TargetAgeGroup>('toddler');
  const [style, setStyle] = useState<VisualStyle>('3d_pixar');
  const [language, setLanguage] = useState('English');
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [sceneCount, setSceneCount] = useState(3);

  const fetchData = async () => {
    try {
      const [storiesRes, charsRes] = await Promise.all([
        fetch('/api/stories').then(r => r.json()),
        fetch('/api/characters').then(r => r.json())
      ]);
      setStories(storiesRes || []);
      setCharacters(charsRes || []);

      if (preselectedCharId) {
        setSelectedCharIds([preselectedCharId]);
      } else if (charsRes && charsRes.length > 0) {
        setSelectedCharIds([charsRes[0].id]);
      }

      if (storiesRes && storiesRes.length > 0 && !selectedStory) {
        setSelectedStory(storiesRes[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [preselectedCharId]);

  const toggleCharacter = (id: string) => {
    if (selectedCharIds.includes(id)) {
      setSelectedCharIds(selectedCharIds.filter(c => c !== id));
    } else {
      setSelectedCharIds([...selectedCharIds, id]);
    }
  };

  const handleGenerateStory = async (e: React.FormEvent) => {
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
          language,
          character_ids: selectedCharIds,
          scene_count: sceneCount
        })
      });

      if (res.ok) {
        const newStory: Story = await res.json();
        setStories([newStory, ...stories]);
        setSelectedStory(newStory);
      } else {
        alert('Story generation failed. Please check settings or try again.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story and its scenes?')) return;
    await fetch(`/api/stories?id=${id}`, { method: 'DELETE' });
    setStories(stories.filter(s => s.id !== id));
    if (selectedStory?.id === id) {
      setSelectedStory(stories.find(s => s.id !== id) || null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-coral">Scriptwriting Engine</span>
          <span className="badge badge-amber">Gemini 2.5 Flash</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Story & Script Studio</h1>
        <p style={{ fontSize: '0.95rem', color: '#94A3B8' }}>
          Turn concepts into scene-by-scene narrated scripts with locked character continuity and camera direction.
        </p>
      </div>

      {/* Grid: Generator on Left, Story Editor & Scene List on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '28px' }}>
        
        {/* Story Generation Form */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' }}>Generate New Script</h2>

          <form onSubmit={handleGenerateStory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Cast Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '8px' }}>
                Starring Character(s)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {characters.map(char => {
                  const isSelected = selectedCharIds.includes(char.id);
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => toggleCharacter(char.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        background: isSelected ? 'var(--accent-purple)' : 'rgba(15, 23, 42, 0.6)',
                        border: isSelected ? '1px solid #C084FC' : '1px solid var(--border-subtle)',
                        color: '#FFF',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isSelected ? <Check size={14} /> : null}
                      <span>{char.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                Story Prompt / Plot Idea
              </label>
              <textarea 
                className="input-field textarea-field" 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="What happens in this adventure?"
                rows={3}
                required
              />
            </div>

            {/* Starter Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {STARTER_PROMPTS.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(sp.prompt);
                    setNiche(sp.niche);
                    setStyle(sp.style);
                  }}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.72rem', padding: '3px 8px', background: 'rgba(255,255,255,0.04)' }}
                >
                  ⚡ {sp.title.split(' ')[0]}...
                </button>
              ))}
            </div>

            {/* Config Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Niche</label>
                <select className="input-field" value={niche} onChange={e => setNiche(e.target.value as ContentNiche)}>
                  {CONTENT_NICHES.map(n => <option key={n.id} value={n.id}>{n.icon} {n.title}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Target Age</label>
                <select className="input-field" value={ageGroup} onChange={e => setAgeGroup(e.target.value as TargetAgeGroup)}>
                  {AGE_GROUPS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Visual Style</label>
                <select className="input-field" value={style} onChange={e => setStyle(e.target.value as VisualStyle)}>
                  {VISUAL_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Language</label>
                <select className="input-field" value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                </select>
              </div>
            </div>

            {/* Scene Count Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600' }}>Number of Scenes</label>
                <span style={{ fontSize: '0.78rem', color: '#FCD34D', fontWeight: '700' }}>{sceneCount} Scenes (~{sceneCount * 7}s)</span>
              </div>
              <input 
                type="range" 
                min={3} 
                max={7} 
                value={sceneCount} 
                onChange={e => setSceneCount(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-coral)' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '6px' }} disabled={generating}>
              {generating ? (
                <>
                  <Sparkles className="spin" size={16} />
                  <span>Scripting with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Full Story Script</span>
                </>
              )}
            </button>
          </form>

          {/* Saved Stories List */}
          <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>Your Saved Stories ({stories.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
              {stories.map(s => (
                <div 
                  key={s.id}
                  onClick={() => setSelectedStory(s)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: selectedStory?.id === s.id ? 'rgba(139, 92, 246, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                    border: selectedStory?.id === s.id ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {s.scenes?.length || 0} scenes • {s.niche}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteStory(s.id); }}
                    style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Story Scenes & Script Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedStory ? (
            <div className="glass-panel" style={{ padding: '26px' }}>
              
              {/* Story Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-purple">{selectedStory.niche}</span>
                    <span className="badge badge-cyan">{selectedStory.style}</span>
                    <span className="badge badge-amber">{selectedStory.language}</span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{selectedStory.title}</h2>
                  <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '4px' }}>
                    💡 <strong>Hook/Moral:</strong> {selectedStory.moral_or_hook}
                  </p>
                </div>

                {/* Send to Studio button */}
                <button 
                  onClick={() => router.push(`/studio?story_id=${selectedStory.id}`)}
                  className="btn btn-primary"
                  style={{ flexShrink: 0 }}
                >
                  <Film size={16} />
                  <span>Produce in Studio</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Scene Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#CBD5E1' }}>
                  Scene-by-Scene Script & Camera Directions
                </h3>

                {selectedStory.scenes?.map((scene, idx) => (
                  <div 
                    key={scene.id}
                    style={{
                      padding: '16px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--grad-sunset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#FFF' }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontWeight: '700', fontSize: '0.92rem' }}>{scene.title}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                          🎥 {scene.camera_direction.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          ~{scene.duration_seconds}s
                        </span>
                      </div>
                    </div>

                    {/* Narration */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: '700', textTransform: 'uppercase' }}>
                        Voiceover Narration:
                      </span>
                      <p style={{ fontSize: '0.88rem', color: '#F8FAFC', marginTop: '2px', lineHeight: 1.4 }}>
                        &ldquo;{scene.narration_text}&rdquo;
                      </p>
                    </div>

                    {/* Visual Prompt */}
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: '700', textTransform: 'uppercase' }}>
                        Visual Prompt (with Character DNA):
                      </span>
                      <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px', lineHeight: 1.4 }}>
                        {scene.visual_prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
              <BookOpen size={48} color="#475569" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#CBD5E1', marginBottom: '8px' }}>Select or Generate a Story</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '400px', margin: '0 auto' }}>
                Use the generator on the left to write an engaging kids script, or select an existing one to review its scenes.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
