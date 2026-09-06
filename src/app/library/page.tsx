'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { 
  Library, 
  Download, 
  Play, 
  Clock, 
  Tag, 
  Copy, 
  Check, 
  UploadCloud, 
  ShieldCheck, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { YoutubeIcon } from '@/components/ui/YoutubeIcon';
import { VideoProject } from '@/lib/types';

export default function LibraryPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}>Loading Video Library...</div>}>
      <LibraryContent />
    </Suspense>
  );
}

function LibraryContent() {
  const searchParams = useSearchParams();
  const highlightedVideoId = searchParams.get('video_id');

  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [youtubeStatus, setYoutubeStatus] = useState<{
    hasClientId: boolean;
    isConnected: boolean;
    channelTitle: string | null;
    authUrl: string;
  } | null>(null);

  // YouTube Upload Form
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState('public');

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/youtube/status');
      const data = await res.json();
      setYoutubeStatus(data);
    } catch (e) {
      console.error('Failed to fetch YouTube status:', e);
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      const data: VideoProject[] = await res.json();
      setVideos(data || []);

      if (data && data.length > 0) {
        const found = highlightedVideoId ? data.find(v => v.id === highlightedVideoId) : data[0];
        const vid = found || data[0];
        setSelectedVideo(vid);
        setUploadTitle(vid.title);
        setUploadDescription(vid.description || '');
        setUploadTags((vid.tags || []).join(', '));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchStatus();
  }, [highlightedVideoId]);

  const handleSelectVideo = (vid: VideoProject) => {
    setSelectedVideo(vid);
    setUploadTitle(vid.title);
    setUploadDescription(vid.description || '');
    setUploadTags((vid.tags || []).join(', '));
    setUploadSuccess(false);
    setUploadedUrl(vid.youtube_video_id ? `https://youtube.com/shorts/${vid.youtube_video_id}` : null);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUploadToYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo || uploading) return;
    setUploading(true);
    setUploadSuccess(false);

    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: selectedVideo.id,
          title: uploadTitle,
          description: uploadDescription,
          tags: uploadTags.split(',').map(t => t.trim()),
          privacy_status: privacyStatus
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUploadSuccess(true);
        if (data.url) setUploadedUrl(data.url);
        fetchVideos();
      } else if (data.needsAuth && data.authUrl) {
        if (confirm('Your YouTube channel needs authorization before uploading. Click OK to open Google Authorization.')) {
          window.location.href = data.authUrl;
        }
      } else {
        alert(data.error || 'YouTube Upload failed. Please check error details.');
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-coral">YouTube Channel Hub</span>
          <span className="badge badge-emerald">COPPA Made For Kids Ready</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Video Library &amp; YouTube Publisher</h1>
        <p style={{ fontSize: '0.95rem', color: '#94A3B8' }}>
          Download, inspect metadata, and publish your generated Shorts directly to your YouTube channel.
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <Library size={48} color="#475569" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#CBD5E1', marginBottom: '8px' }}>No Videos Rendered Yet</h3>
          <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 20px' }}>
            Go to the Story Studio or Dashboard to generate a story and click &quot;1-Click Render Full Video&quot;!
          </p>
          <a href="/stories" className="btn btn-primary">Go to Story Studio</a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '28px' }}>
          
          {/* Left Column: Video List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Ready Videos ({videos.length})</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {videos.map(v => (
                <div
                  key={v.id}
                  onClick={() => handleSelectVideo(v)}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '12px',
                    borderRadius: '14px',
                    background: selectedVideo?.id === v.id ? 'rgba(139, 92, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                    border: selectedVideo?.id === v.id ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ width: '80px', height: '100px', background: '#0F172A', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    {v.thumbnail_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnail_path} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={20} color="#64748B" />
                      </div>
                    )}
                    <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.8)', padding: '1px 4px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700' }}>
                      {Math.round(v.duration_seconds)}s
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {v.aspect_ratio} • {v.engine.replace('_', ' ')}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <span className="badge badge-coral" style={{ fontSize: '0.62rem' }}>
                        {v.youtube_status === 'uploaded' ? 'PUBLISHED' : 'READY TO UPLOAD'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Player & YouTube Publisher */}
          {selectedVideo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Video Player Card */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{selectedVideo.title}</h2>
                  <a href={selectedVideo.video_path} download className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                    <Download size={14} />
                    <span>Download MP4</span>
                  </a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', background: '#0A0D17', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                  <video 
                    controls 
                    src={selectedVideo.video_path} 
                    style={{ maxHeight: '420px', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94A3B8' }}>
                  <span>Duration: {Math.round(selectedVideo.duration_seconds)} seconds</span>
                  <span>Audio: Integrated Narration + Lullaby Chord Synth</span>
                  <span>Format: MP4 (H.264 / AAC)</span>
                </div>
              </div>

              {/* YouTube Metadata & Upload Form */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <YoutubeIcon size={24} color="#FF0000" />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>YouTube Direct Publisher</h3>
                  </div>

                  {youtubeStatus?.isConnected ? (
                    <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={12} />
                      <span>{youtubeStatus.channelTitle || 'Connected'}</span>
                    </span>
                  ) : youtubeStatus?.hasClientId ? (
                    <a href={youtubeStatus.authUrl} className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                      <YoutubeIcon size={14} />
                      <span>Authorize Channel</span>
                    </a>
                  ) : null}
                </div>

                {youtubeStatus?.hasClientId && !youtubeStatus?.isConnected && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 16px', 
                    background: 'rgba(139, 92, 246, 0.15)', 
                    border: '1px solid var(--accent-purple)', 
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>Connect Your YouTube Channel</div>
                      <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '2px' }}>
                        Google OAuth credentials detected. Click Authorize to link your channel for 1-click publishing.
                      </div>
                    </div>
                    <a href={youtubeStatus.authUrl} className="btn btn-primary" style={{ fontSize: '0.82rem', flexShrink: 0 }}>
                      <YoutubeIcon size={15} />
                      <span>Authorize Channel</span>
                    </a>
                  </div>
                )}

                {uploadSuccess ? (
                  <div style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '12px', textAlign: 'center' }}>
                    <Check size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 8px' }} />
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white' }}>Published to YouTube!</h4>
                    <p style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '4px', maxWidth: '400px', margin: '4px auto 14px' }}>
                      Your Short has been processed and is ready on your YouTube channel with COPPA Made for Kids settings.
                    </p>
                    {uploadedUrl && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <a href={uploadedUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <span>Watch Short on YouTube</span>
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    )}
                    <button type="button" onClick={() => setUploadSuccess(false)} className="btn btn-ghost" style={{ marginTop: '12px', fontSize: '0.8rem' }}>
                      Upload Another Video
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUploadToYouTube} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Title */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Video Title (Shorts Optimized)</label>
                        <button type="button" onClick={() => handleCopy(uploadTitle, 'title')} className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                          {copiedField === 'title' ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <input className="input-field" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} required />
                    </div>

                    {/* Description */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Video Description</label>
                        <button type="button" onClick={() => handleCopy(uploadDescription, 'desc')} className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                          {copiedField === 'desc' ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <textarea className="input-field" rows={3} value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} />
                    </div>

                    {/* Tags */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>SEO Tags</label>
                        <button type="button" onClick={() => handleCopy(uploadTags, 'tags')} className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                          {copiedField === 'tags' ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <input className="input-field" value={uploadTags} onChange={e => setUploadTags(e.target.value)} />
                    </div>

                    {/* COPPA & Privacy Controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--accent-coral)' }}>
                          COPPA / Made for Kids:
                        </span>
                        <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                          Automatically flagged as &quot;Yes, it is made for kids&quot; to comply with YouTube policy.
                        </p>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Privacy Status</label>
                        <select className="input-field" value={privacyStatus} onChange={e => setPrivacyStatus(e.target.value)}>
                          <option value="private">Private (Review first)</option>
                          <option value="unlisted">Unlisted (Share via link)</option>
                          <option value="public">Public (Immediate viral publish)</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={uploading}
                      style={{ padding: '12px', fontSize: '0.95rem' }}
                    >
                      <UploadCloud size={16} />
                      <span>{uploading ? 'Uploading to YouTube Channel...' : 'Publish to YouTube'}</span>
                    </button>
                  </form>
                )}

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
