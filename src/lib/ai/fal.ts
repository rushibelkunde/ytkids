import path from 'path';
import fs from 'fs';
import { DB } from '../db';

export interface FalImageResult {
  filePath: string;
  url: string;
}

export interface FalVideoResult {
  filePath: string;
  url: string;
}

export async function generateSceneImage(params: {
  prompt: string;
  sceneId: string;
  aspectRatio?: '9:16' | '16:9';
}): Promise<FalImageResult> {
  const settings = DB.getSettings();
  const falKey = settings.fal_key || process.env.FAL_KEY || process.env.FAL_AI_API_KEY;
  const ratio = params.aspectRatio || '9:16';
  const outFilename = `scene_${params.sceneId}_${Math.random().toString(36).slice(2, 7)}.png`;
  const scenesDir = path.join(process.cwd(), 'data', 'scenes');
  if (!fs.existsSync(scenesDir)) fs.mkdirSync(scenesDir, { recursive: true });
  const outPath = path.join(scenesDir, outFilename);

  if (falKey) {
    try {
      // Use fal.ai fast flux / sdm model
      const imageSize = ratio === '9:16' 
        ? { width: 720, height: 1280 } 
        : { width: 1280, height: 720 };

      const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: params.prompt,
          image_size: imageSize,
          num_inference_steps: 4,
          enable_safety_checker: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.images?.[0]?.url;
        if (imageUrl) {
          const imgRes = await fetch(imageUrl);
          const buffer = await imgRes.arrayBuffer();
          fs.writeFileSync(outPath, Buffer.from(buffer));
          return {
            filePath: outPath,
            url: `/api/media/scenes/${outFilename}`
          };
        }
      }
    } catch (err) {
      console.warn('fal.ai image generation error, falling back to local styled canvas:', err);
    }
  }

  // Local beautiful SVG render fallback when no key is set yet
  generateStyledPlaceholderImage(outPath, params.prompt, ratio);
  return {
    filePath: outPath,
    url: `/api/media/scenes/${outFilename}`
  };
}

export async function generateCharacterAvatar(params: {
  name: string;
  visualDna: string;
  stylePrompt: string;
  characterId: string;
}): Promise<FalImageResult> {
  const settings = DB.getSettings();
  const falKey = settings.fal_key || process.env.FAL_KEY || process.env.FAL_AI_API_KEY;
  const outFilename = `avatar_${params.characterId}.png`;
  const charDir = path.join(process.cwd(), 'data', 'characters');
  if (!fs.existsSync(charDir)) fs.mkdirSync(charDir, { recursive: true });
  const outPath = path.join(charDir, outFilename);

  const fullPrompt = `Character concept art sheet of ${params.name}, ${params.visualDna}, front facing portrait, smiling cheerfully, solid soft pastel gradient background, clean character design, ${params.stylePrompt}`;

  if (falKey) {
    try {
      const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          image_size: { width: 768, height: 768 },
          num_inference_steps: 4
        })
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.images?.[0]?.url;
        if (imageUrl) {
          const imgRes = await fetch(imageUrl);
          const buffer = await imgRes.arrayBuffer();
          fs.writeFileSync(outPath, Buffer.from(buffer));
          return {
            filePath: outPath,
            url: `/api/media/characters/${outFilename}`
          };
        }
      }
    } catch (err) {
      console.warn('fal.ai character avatar generation error:', err);
    }
  }

  generateCharacterSvg(outPath, params.name);
  return {
    filePath: outPath,
    url: `/api/media/characters/${outFilename}`
  };
}

function generateStyledPlaceholderImage(outPath: string, prompt: string, ratio: '9:16' | '16:9') {
  const width = ratio === '9:16' ? 720 : 1280;
  const height = ratio === '9:16' ? 1280 : 720;
  const cleanPrompt = prompt.slice(0, 140).replace(/["&<>]/g, '');

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF9A8B" />
        <stop offset="40%" stop-color="#FF6A88" />
        <stop offset="100%" stop-color="#FF99AC" />
      </linearGradient>
      <linearGradient id="hill" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#48bb78" />
        <stop offset="100%" stop-color="#2f855a" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="15" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#sky)" />
    <!-- Golden Sun -->
    <circle cx="${width * 0.8}" cy="${height * 0.2}" r="${width * 0.15}" fill="#FEFCBF" opacity="0.8" filter="url(#glow)" />
    <!-- Whimsical Hills -->
    <path d="M 0 ${height * 0.75} Q ${width * 0.3} ${height * 0.65} ${width * 0.6} ${height * 0.75} T ${width} ${height * 0.7} L ${width} ${height} L 0 ${height} Z" fill="url(#hill)" />
    <path d="M 0 ${height * 0.82} Q ${width * 0.5} ${height * 0.75} ${width} ${height * 0.85} L ${width} ${height} L 0 ${height} Z" fill="#276749" opacity="0.9" />
    
    <!-- Sparkles -->
    <circle cx="${width * 0.2}" cy="${height * 0.35}" r="8" fill="#FFF" opacity="0.9" />
    <circle cx="${width * 0.35}" cy="${height * 0.25}" r="5" fill="#FFF" opacity="0.8" />
    <circle cx="${width * 0.65}" cy="${height * 0.45}" r="7" fill="#FFF" opacity="0.9" />

    <!-- Prompt Card Overlay -->
    <rect x="${width * 0.08}" y="${height * 0.4}" width="${width * 0.84}" height="${height * 0.22}" rx="24" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="2" />
    <text x="${width * 0.5}" y="${height * 0.47}" font-family="system-ui, sans-serif" font-weight="800" font-size="${width * 0.045}" fill="#FFF" text-anchor="middle">✨ AI Visual Preview</text>
    <text x="${width * 0.5}" y="${height * 0.53}" font-family="system-ui, sans-serif" font-size="${width * 0.026}" fill="#CBD5E1" text-anchor="middle">Ready for Fal.ai High-Res Render</text>
    <text x="${width * 0.5}" y="${height * 0.58}" font-family="system-ui, sans-serif" font-size="${width * 0.022}" fill="#FDE047" text-anchor="middle">${cleanPrompt.slice(0, 55)}...</text>
  </svg>
  `;

  fs.writeFileSync(outPath, svg);
}

function generateCharacterSvg(outPath: string, name: string) {
  const svg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="charBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6EE7B7" />
        <stop offset="100%" stop-color="#3B82F6" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="64" fill="url(#charBg)" />
    <!-- Character Face Silhouette -->
    <circle cx="256" cy="230" r="140" fill="#FFF" />
    <circle cx="205" cy="210" r="18" fill="#1E293B" />
    <circle cx="307" cy="210" r="18" fill="#1E293B" />
    <circle cx="210" cy="205" r="6" fill="#FFF" />
    <circle cx="312" cy="205" r="6" fill="#FFF" />
    <!-- Cheeks -->
    <ellipse cx="180" cy="245" rx="16" ry="10" fill="#FDA4AF" opacity="0.8" />
    <ellipse cx="332" cy="245" rx="16" ry="10" fill="#FDA4AF" opacity="0.8" />
    <!-- Smile -->
    <path d="M 220 250 Q 256 285 292 250" stroke="#1E293B" stroke-width="8" stroke-linecap="round" fill="none" />
    <!-- Name banner -->
    <rect x="56" y="400" width="400" height="72" rx="36" fill="rgba(15, 23, 42, 0.85)" />
    <text x="256" y="445" font-family="system-ui, sans-serif" font-weight="bold" font-size="28" fill="#FFF" text-anchor="middle">${name}</text>
  </svg>
  `;
  fs.writeFileSync(outPath, svg);
}

export async function generateSceneVideo(params: {
  prompt: string;
  imageUrl: string;
  sceneId: string;
  aspectRatio?: '9:16' | '16:9';
  duration?: '5' | '10';
  isChained?: boolean;
}): Promise<FalVideoResult> {
  const settings = DB.getSettings();
  const falKey = settings.fal_key || process.env.FAL_KEY || process.env.FAL_AI_API_KEY;
  const outFilename = `video_${params.sceneId}_${Math.random().toString(36).slice(2, 7)}.mp4`;
  const scenesDir = path.join(process.cwd(), 'data', 'scenes');
  if (!fs.existsSync(scenesDir)) fs.mkdirSync(scenesDir, { recursive: true });
  const outPath = path.join(scenesDir, outFilename);

  if (!falKey) {
    throw new Error('fal.ai key not configured');
  }

  // When continuing from the previous scene's last frame (isChained: true):
  // Focus purely on continuous motion from the starting frame to prevent Kling from altering character DNA.
  const styledPrompt = params.isChained
    ? `Continuous animation from current pose, seamless natural motion, identical character features and clothes: ${params.prompt}, 3D Pixar CGI animation, consistent style, smooth physics`
    : `3D Pixar-style CGI animation, bright warm cinematic lighting, saturated cheerful colors, smooth fluid motion, consistent character design, ${params.prompt}`;

  // 1. If imageUrl is local path, upload to fal storage
  let cdnUrl = params.imageUrl;
  if (!cdnUrl.startsWith('http')) {
    const localPath = path.join(process.cwd(), cdnUrl.replace('/api/media', 'data'));
    cdnUrl = await uploadLocalFileToFal(localPath, falKey);
  }

  // 2. Submit to Kling image-to-video
  const submitRes = await fetch('https://queue.fal.run/fal-ai/kling-video/v1/standard/image-to-video', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: styledPrompt,
      image_url: cdnUrl,
      duration: params.duration || '5',
      aspect_ratio: params.aspectRatio || '9:16'
    })
  });

  if (!submitRes.ok) {
    throw new Error(`Kling submission failed: ${submitRes.status} ${await submitRes.text()}`);
  }

  const { response_url } = await submitRes.json();

  // 3. Poll until finished
  let videoUrl: string | null = null;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 6000));
    const pollRes = await fetch(response_url, {
      headers: { 'Authorization': `Key ${falKey}` }
    });
    if (pollRes.ok) {
      const data = await pollRes.json();
      if (data.video?.url) {
        videoUrl = data.video.url;
        break;
      }
    }
  }

  if (!videoUrl) {
    throw new Error('Timed out waiting for Kling video generation');
  }

  // 4. Download output video
  const vidRes = await fetch(videoUrl);
  const buffer = await vidRes.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(buffer));

  return {
    filePath: outPath,
    url: `/api/media/scenes/${outFilename}`
  };
}

async function uploadLocalFileToFal(localPath: string, falKey: string): Promise<string> {
  const fileName = path.basename(localPath);
  const ext = path.extname(localPath).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
  const fileBytes = fs.readFileSync(localPath);

  const initRes = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ file_name: fileName, content_type: contentType })
  });
  if (!initRes.ok) throw new Error('Fal storage initiate failed');
  const { upload_url, file_url } = await initRes.json();

  await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: fileBytes
  });

  return file_url;
}
