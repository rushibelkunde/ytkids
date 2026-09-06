import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { Scene, VideoProject, ProductionEngine } from '../types';

const execPromise = util.promisify(exec);

export interface SceneRenderResult {
  sceneId: string;
  clipPath: string;
  duration: number;
}

export async function renderSceneClip(params: {
  scene: Scene;
  aspectRatio: '9:16' | '16:9';
  outputDir: string;
}): Promise<SceneRenderResult> {
  const { scene, aspectRatio, outputDir } = params;
  const width = aspectRatio === '9:16' ? 720 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : 720;
  const fps = 25;
  const duration = Math.max(scene.duration_seconds || 5.0, 3.0);
  const totalFrames = Math.ceil(duration * fps);

  const clipFilename = `scene_clip_${scene.id}.mp4`;
  const clipPath = path.join(outputDir, clipFilename);

  // If already rendered and exists, reuse
  if (fs.existsSync(clipPath) && fs.statSync(clipPath).size > 1000) {
    return { sceneId: scene.id, clipPath, duration };
  }

  // If scene has an AI-generated animated video clip, render it directly with motion
  let rawVideoPath = scene.video_url 
    ? path.join(process.cwd(), scene.video_url.replace('/api/media', 'data'))
    : null;

  if (rawVideoPath && fs.existsSync(rawVideoPath)) {
    // Format subtitles for drawtext filter with multi-line word wrapping
    const safeNarration = wrapSubtitleText(scene.narration_text || '', aspectRatio === '9:16' ? 30 : 45);
    const fontSize = aspectRatio === '9:16' ? 32 : 28;
    const boxY = aspectRatio === '9:16' ? 'h-240' : 'h-130';
    const drawtextFilter = safeNarration ? `,drawtext=text='${safeNarration}':fontcolor=yellow:fontsize=${fontSize}:borderw=4:bordercolor=black:line_spacing=10:box=1:boxcolor=black@0.65:boxborderw=14:x=(w-text_w)/2:y=${boxY}` : '';
    
    const vf = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},format=yuv420p${drawtextFilter}`;

    // Check audio input
    let audioInput = '';
    let audioMap = '';
    let audioPath = scene.audio_url 
      ? path.join(process.cwd(), scene.audio_url.replace('/api/media', 'data'))
      : null;

    if (audioPath && fs.existsSync(audioPath)) {
      audioInput = `-i "${audioPath}"`;
      audioMap = `-filter_complex "[0:v]${vf}[vout];[1:a]apad=pad_dur=2[aout]" -map "[vout]" -map "[aout]"`;
    } else {
      audioInput = `-f lavfi -i anullsrc=r=44100:cl=stereo`;
      audioMap = `-filter_complex "[0:v]${vf}[vout]" -map "[vout]" -map 1:a`;
    }

    const cmd = `ffmpeg -y -i "${rawVideoPath}" ${audioInput} ${audioMap} -c:v libx264 -preset veryfast -pix_fmt yuv420p -r ${fps} -c:a aac -b:a 192k -shortest "${clipPath}"`;
    await execPromise(cmd);
    return { sceneId: scene.id, clipPath, duration };
  }

  // Determine input image
  let imagePath = scene.image_url 
    ? path.join(process.cwd(), scene.image_url.replace('/api/media', 'data'))
    : null;

  if (!imagePath || !fs.existsSync(imagePath)) {
    // Generate a quick fallback colored image
    imagePath = path.join(outputDir, `temp_img_${scene.id}.png`);
    await createFallbackImage(imagePath, width, height, scene.title);
  }

  // Determine camera motion zoompan filter
  let zoomFilter = '';
  switch (scene.camera_direction) {
    case 'zoom_in':
      zoomFilter = `zoompan=z='min(zoom+0.0012,1.20)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}`;
      break;
    case 'zoom_out':
      zoomFilter = `zoompan=z='if(lte(zoom,1.0),1.20,max(1.001,zoom-0.0012))':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}`;
      break;
    case 'pan_right':
      zoomFilter = `zoompan=z=1.12:x='if(lte(on,-1),0,min(x+1.5,iw-iw/zoom))':d=${totalFrames}:s=${width}x${height}`;
      break;
    case 'pan_left':
      zoomFilter = `zoompan=z=1.12:x='if(lte(on,-1),iw-iw/zoom,max(x-1.5,0))':d=${totalFrames}:s=${width}x${height}`;
      break;
    default:
      zoomFilter = `zoompan=z=1.05:d=${totalFrames}:s=${width}x${height}`;
  }

  // Format subtitles for drawtext filter with multi-line word wrapping
  const safeNarration = wrapSubtitleText(scene.narration_text || '', aspectRatio === '9:16' ? 32 : 48);

  // Subtitle styling: bold white text in centered semi-transparent rounded box
  const fontSize = aspectRatio === '9:16' ? 30 : 26;
  const boxY = aspectRatio === '9:16' ? 'h-240' : 'h-130';
  const drawtextFilter = safeNarration ? `,drawtext=text='${safeNarration}':fontcolor=white:fontsize=${fontSize}:line_spacing=10:box=1:boxcolor=black@0.65:boxborderw=14:x=(w-text_w)/2:y=${boxY}` : '';

  const vf = `${zoomFilter},format=yuv420p${drawtextFilter}`;

  // Check audio input
  let audioInput = '';
  let audioPath = scene.audio_url 
    ? path.join(process.cwd(), scene.audio_url.replace('/api/media', 'data'))
    : null;

  if (audioPath && fs.existsSync(audioPath)) {
    audioInput = `-i "${audioPath}" -c:a aac -b:a 192k -shortest`;
  } else {
    // Silent / tone audio
    audioInput = `-f lavfi -i anullsrc=r=44100:cl=stereo -c:a aac -t ${duration}`;
  }

  const cmd = `ffmpeg -y -loop 1 -t ${duration} -i "${imagePath}" ${audioInput} -vf "${vf}" -c:v libx264 -preset veryfast -pix_fmt yuv420p -r ${fps} "${clipPath}"`;

  try {
    await execPromise(cmd);
  } catch (err: any) {
    console.error(`Failed to render scene ${scene.id} with zoompan:`, err.message);
    // Simpler fallback without complex zoom filter if system encounters issue
    const simpleCmd = `ffmpeg -y -loop 1 -t ${duration} -i "${imagePath}" ${audioInput} -vf "scale=${width}:${height},format=yuv420p${drawtextFilter}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -r ${fps} "${clipPath}"`;
    await execPromise(simpleCmd);
  }

  return {
    sceneId: scene.id,
    clipPath,
    duration
  };
}

export async function assembleFullVideo(params: {
  storyId: string;
  title: string;
  scenes: Scene[];
  aspectRatio: '9:16' | '16:9';
  engine: ProductionEngine;
}): Promise<VideoProject> {
  const { storyId, title, scenes, aspectRatio, engine } = params;
  const exportsDir = path.join(process.cwd(), 'data', 'exports');
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

  const videoId = `vid_${Date.now()}`;
  const finalVideoFilename = `${videoId}.mp4`;
  const finalVideoPath = path.join(exportsDir, finalVideoFilename);
  const thumbnailFilename = `${videoId}_thumb.jpg`;
  const thumbnailPath = path.join(exportsDir, thumbnailFilename);

  // 1. Render each scene clip
  const clips: string[] = [];
  let totalDuration = 0;

  for (const scene of scenes) {
    const renderRes = await renderSceneClip({
      scene,
      aspectRatio,
      outputDir: exportsDir
    });
    clips.push(renderRes.clipPath);
    totalDuration += renderRes.duration;
  }

  // 2. Create concat file
  const concatFilePath = path.join(exportsDir, `concat_${videoId}.txt`);
  const concatContent = clips.map(c => `file '${c.replace(/'/g, "'\\''")}'`).join('\n');
  fs.writeFileSync(concatFilePath, concatContent);

  // 3. Optional background music layer
  const bgMusicPath = path.join(exportsDir, `bgm_${videoId}.mp3`);
  await generatePlayfulBgm(bgMusicPath, totalDuration);

  // 4. Stitch clips and mix background music (subtle 10% volume)
  const stitchCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" -i "${bgMusicPath}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:weights=1.0 0.12[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k "${finalVideoPath}"`;

  try {
    await execPromise(stitchCmd);
  } catch (err: any) {
    console.warn('Audio mix failed, stitching without BGM:', err.message);
    const simpleStitch = `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" -c copy "${finalVideoPath}"`;
    await execPromise(simpleStitch);
  }

  // 5. Generate Thumbnail
  try {
    await execPromise(`ffmpeg -y -ss 00:00:02 -i "${finalVideoPath}" -vframes 1 -q:v 2 "${thumbnailPath}"`);
  } catch {
    // If ss 2s fails, take 0.5s
    await execPromise(`ffmpeg -y -ss 00:00:00.5 -i "${finalVideoPath}" -vframes 1 -q:v 2 "${thumbnailPath}"`);
  }

  // Clean up concat txt
  if (fs.existsSync(concatFilePath)) fs.unlinkSync(concatFilePath);

  return {
    id: videoId,
    story_id: storyId,
    title,
    description: `🌟 Welcome to a magical adventure for kids! Don't forget to LIKE and SUBSCRIBE for more fun daily kids stories! #Shorts #KidsStories #Animation`,
    tags: ['kids stories', 'bedtime story', 'animated shorts', 'nursery rhymes', 'kids cartoons', 'educational'],
    aspect_ratio: aspectRatio,
    engine,
    video_path: `/api/media/exports/${finalVideoFilename}`,
    thumbnail_path: `/api/media/exports/${thumbnailFilename}`,
    duration_seconds: totalDuration,
    youtube_status: 'draft',
    created_at: new Date().toISOString()
  };
}

async function createFallbackImage(filePath: string, width: number, height: number, text: string) {
  const safeText = text.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 30);
  const cmd = `ffmpeg -y -f lavfi -i color=c=0x1E1B4B:s=${width}x${height}:d=1 -vf "drawtext=text='${safeText}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2" -vframes 1 "${filePath}"`;
  await execPromise(cmd);
}

async function generatePlayfulBgm(outPath: string, durationSeconds: number) {
  const customBgm = path.join(process.cwd(), 'data', 'audio', 'comedy_bouncy_bgm.mp3');
  const d = Math.ceil(durationSeconds) + 2;
  if (fs.existsSync(customBgm)) {
    const cmd = `ffmpeg -y -stream_loop -1 -i "${customBgm}" -t ${d} -c:a libmp3lame "${outPath}"`;
    try {
      await execPromise(cmd);
      return;
    } catch (e) {
      console.warn('Failed to loop custom BGM, falling back to synth:', e);
    }
  }

  // Synthesize a soft, cheerful chord progression (C-E-G / gentle lullaby tones)
  const cmd = `ffmpeg -y -f lavfi -i "sine=frequency=261.63:duration=${d}" -f lavfi -i "sine=frequency=329.63:duration=${d}" -f lavfi -i "sine=frequency=392.00:duration=${d}" -filter_complex "[0:a][1:a][2:a]amix=inputs=3:dropout_transition=2,volume=0.08,lowpass=f=1200" -c:a libmp3lame "${outPath}"`;
  try {
    await execPromise(cmd);
  } catch (err) {
    console.warn('Failed to synth BGM:', err);
  }
}

function wrapSubtitleText(text: string, maxLineLength = 34): string {
  const clean = (text || '').replace(/['":\\]/g, '').trim();
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxLineLength) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3).join('\n');
}
