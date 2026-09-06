'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Film, 
  Sparkles, 
  Play, 
  Volume2, 
  Camera, 
  Download, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  Eye, 
  Layers, 
  Zap, 
  ArrowLeft
} from 'lucide-react';
import { YoutubeIcon } from '@/components/ui/YoutubeIcon';
import { Story, Scene, VideoProject, ProductionEngine } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function ProductionStudio() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}>Loading Production Studio...</div>}>
      <ProductionStudioContent />
    </Suspense>
  );
}

function ProductionStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storyId = searchParams.get('story_id');

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<string>('');
  const [completedVideo, setCompletedVideo] = useState<VideoProject | null>(null);

  // Settings for this render
  const [engine, setEngine] = useState<ProductionEngine>('motion_storybook');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [generatingAsset, setGeneratingAsset] = useState<string | null>(null);

  const fetchStory = async () => {
    if (!storyId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/stories?id=${storyId}`);
      if (res.ok) {
        const data: Story = await res.json();
        setStory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStory();
  }, [storyId]);

  const handleGenerateImage = async (sceneId: string) => {
    setGeneratingAsset(`img_${sceneId}`);
    try {
      const res = await fetch(`/api/scenes/${sceneId}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: story?.id,
          aspect_ratio: aspectRatio
        })
      });
      if (res.ok) {
        await fetchStory();
      } else {
        alert('Image generation failed');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setGeneratingAsset(null);
    }
  };

  const handleGenerateAudio = async (sceneId: string) => {
    setGeneratingAsset(`aud_${sceneId}`);
    try {
      const res = await fetch(`/api/scenes/${sceneId}/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: story?.id
        })
      });
      if (res.ok) {
        await fetchStory();
      } else {
        alert('Voice generation failed');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setGeneratingAsset(null);
    }
  };

  const handleRenderFullVideo = async () => {
    if (!story || rendering) return;
    setRendering(true);
    setRenderProgress('Composing scenes & applying Ken Burns camera motion...');

    try {
      const res = await fetch('/api/production/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: story.id,
          aspect_ratio: aspectRatio,
          engine: engine
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCompletedVideo(data.video);
        await fetchStory();
      } else {
        const errData = await res.json();
        alert('Render failed: ' + errData.error);
      }
    } catch (err: any) {
      alert('Render error: ' + err.message);
    } finally {
      setRendering(false);
      setRenderProgress('');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>Loading Production Studio...</div>;
  }

  if (!storyId || !story) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
        <Film size={48} color="#475569" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>No Story Selected</h2>
        <p style={{ color: '#94A3B8', marginBottom: '24px' }}>
          Select or write a story first, then launch it into the studio for rendering.
        </p>
        <Link href="/stories" className="btn btn-primary">
          <Sparkles size={16} />
          <span>Open Story Studio</span>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/stories" className="btn btn-ghost" style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-coral">Production Studio</span>
              <span className="badge badge-purple">{story.style}</span>
              <span className="badge badge-emerald">{story.scenes?.length} Scenes</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{story.title}</h1>
          </div>
        </div>

        {/* Engine & Format Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Format Toggle */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setAspectRatio('9:16')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: aspectRatio === '9:16' ? 'var(--accent-coral)' : 'transparent',
                color: '#FFF',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              📱 9:16 Shorts
            </button>
            <button
              onClick={() => setAspectRatio('16:9')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: aspectRatio === '16:9' ? 'var(--accent-coral)' : 'transparent',
                color: '#FFF',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🖥️ 16:9 Video
            </button>
          </div>

          {/* Engine Selector */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setEngine('motion_storybook')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: engine === 'motion_storybook' ? 'var(--grad-magic)' : 'transparent',
                color: '#FFF',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🚀 Motion Storybook (~$0.05)
            </button>
            <button
              onClick={() => setEngine('full_ai_video')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: engine === 'full_ai_video' ? 'var(--grad-magic)' : 'transparent',
                color: '#FFF',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🎬 Full AI Video (~$0.80)
            </button>
          </div>

          {/* 1-Click Render Button */}
          <button 
            onClick={handleRenderFullVideo}
            disabled={rendering}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '1rem' }}
          >
            {rendering ? (
              <>
                <RefreshCw className="spin" size={18} />
                <span>{renderProgress || 'Rendering Video...'}</span>
              </>
            ) : (
              <>
                <Film size={18} />
                <span>1-Click Render Full Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Completed Video Showcase Banner if just rendered */}
      {completedVideo && (
        <div className="glass-panel glass-panel-glow" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--grad-aurora)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={28} color="#FFF" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Video Successfully Rendered!</h3>
                <p style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>
                  Duration: <strong>{Math.round(completedVideo.duration_seconds)}s</strong> • Format: <strong>{completedVideo.aspect_ratio}</strong> • Burned Subtitles &amp; Audio Mix Ready
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a href={completedVideo.video_path} download className="btn btn-secondary">
                <Download size={16} />
                <span>Download MP4</span>
              </a>
              <Link href={`/library?video_id=${completedVideo.id}`} className="btn btn-primary">
                <YoutubeIcon size={16} />
                <span>Publish to YouTube →</span>
              </Link>
            </div>
          </div>

          {/* Inline Video Player */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <video 
              controls 
              src={completedVideo.video_path} 
              style={{
                maxHeight: '400px',
                borderRadius: '14px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                border: '1px solid var(--border-subtle)'
              }}
            />
          </div>
        </div>
      )}

      {/* Story Timeline / Scene Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Production Timeline &amp; Scenes</h3>
          <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
            You can preview, swap images, re-record audio, or adjust camera motion per scene.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {story.scenes?.map((scene, idx) => {
            const isGeneratingImg = generatingAsset === `img_${scene.id}`;
            const isGeneratingAud = generatingAsset === `aud_${scene.id}`;

            return (
              <div 
                key={scene.id}
                className="glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                  border: scene.image_url && scene.audio_url ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)'
                }}
              >
                {/* Scene Header */}
                <div style={{ padding: '12px 16px', background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--grad-sunset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontWeight: '700', fontSize: '0.88rem' }}>{scene.title}</span>
                  </div>
                  <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                    {scene.duration_seconds}s
                  </span>
                </div>

                {/* Visual Area */}
                <div style={{ height: '200px', background: '#0F172A', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {scene.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={scene.image_url} alt={scene.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <Camera size={32} color="#475569" style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Image not rendered yet</p>
                    </div>
                  )}

                  {/* Regenerate image action button */}
                  <button
                    onClick={() => handleGenerateImage(scene.id)}
                    disabled={isGeneratingImg}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={12} color="var(--accent-coral)" />
                    <span>{isGeneratingImg ? 'Rendering...' : (scene.image_url ? 'Regenerate Art' : 'Generate Art')}</span>
                  </button>

                  <span className="badge badge-cyan" style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '0.65rem' }}>
                    🎥 {scene.camera_direction.replace('_', ' ')}
                  </span>
                </div>

                {/* Details & Audio Player */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  
                  {/* Narration Script */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.82rem', color: '#F1F5F9', fontStyle: 'italic', lineHeight: 1.4 }}>
                      &ldquo;{scene.narration_text}&rdquo;
                    </p>
                  </div>

                  {/* Voiceover Player / Generator */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    {scene.audio_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <audio controls src={scene.audio_url} style={{ height: '32px', maxWidth: '180px' }} />
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Audio not synthesized</div>
                    )}

                    <button
                      onClick={() => handleGenerateAudio(scene.id)}
                      disabled={isGeneratingAud}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                    >
                      <Volume2 size={13} color="var(--accent-cyan)" />
                      <span>{isGeneratingAud ? 'Synthesizing...' : (scene.audio_url ? 'Re-voice' : 'Free Voiceover')}</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
