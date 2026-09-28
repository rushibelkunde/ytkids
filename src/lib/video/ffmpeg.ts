import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { Scene, VideoProject, ProductionEngine } from '../types';

const execPromise = util.promisify(exec);

// Ensure local bin directory (with ffmpeg, ffprobe, edge-tts) is always in PATH
const binDir = path.join(process.cwd(), 'bin');
if (fs.existsSync(binDir) && !process.env.PATH?.includes(binDir)) {
  process.env.PATH = `${binDir};${process.env.PATH}`;
}

export function getFfmpegCmd(): string {
  const localBin = path.join(process.cwd(), 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  if (fs.existsSync(localBin)) return `"${localBin}"`;
  return 'ffmpeg';
}

export function getFfprobeCmd(): string {
  const localBin = path.join(process.cwd(), 'bin', process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
  if (fs.existsSync(localBin)) return `"${localBin}"`;
  return 'ffprobe';
}

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
      audioMap = `-filter_complex "[0:v]${vf}[vout]" -map "[vout]" -map 1:a`;
    } else {
      audioInput = `-f lavfi -i anullsrc=r=44100:cl=stereo`;
      audioMap = `-filter_complex "[0:v]${vf}[vout]" -map "[vout]" -map 1:a`;
    }

    const cmd = `${getFfmpegCmd()} -y -t ${duration} -i "${rawVideoPath}" ${audioInput} ${audioMap} -c:v libx264 -preset veryfast -pix_fmt yuv420p -r ${fps} -c:a aac -b:a 192k -t ${duration} "${clipPath}"`;
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

  const cmd = `${getFfmpegCmd()} -y -loop 1 -t ${duration} -i "${imagePath}" ${audioInput} -vf "${vf}" -c:v libx264 -preset veryfast -pix_fmt yuv420p -r ${fps} "${clipPath}"`;

  try {
    await execPromise(cmd);
  } catch (err: any) {
    console.error(`Failed to render scene ${scene.id} with zoompan:`, err.message);
    // Simpler fallback without complex zoom filter if system encounters issue
    const simpleCmd = `${getFfmpegCmd()} -y -loop 1 -t ${duration} -i "${imagePath}" ${audioInput} -vf "scale=${width}:${height},format=yuv420p${drawtextFilter}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -r ${fps} "${clipPath}"`;
    await execPromise(simpleCmd);
  }

  return {
    sceneId: scene.id,
    clipPath,
    duration
  };
}

/**
 * Extract the last frame from a video clip for frame-chaining continuity.
 * The last frame of clip N becomes the input image for generating clip N+1,
 * ensuring consistent character appearance and environment across scenes.
 */
export async function extractLastFrame(videoPath: string, outputDir: string): Promise<string> {
  const frameFilename = `last_frame_${path.basename(videoPath, '.mp4')}.png`;
  const framePath = path.join(outputDir, frameFilename);

  // Extract the frame ~0.1s before the end of the video
  const cmd = `${getFfmpegCmd()} -y -sseof -0.1 -i "${videoPath}" -vframes 1 -q:v 2 "${framePath}"`;
  try {
    await execPromise(cmd);
  } catch {
    // Fallback: try extracting the very last frame
    const fallbackCmd = `${getFfmpegCmd()} -y -sseof -0.01 -i "${videoPath}" -vframes 1 -q:v 2 "${framePath}"`;
    await execPromise(fallbackCmd);
  }

  return framePath;
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

  // 2. Stitch clips with seamless concatenation
  // For frame-chained videos, clip N+1 starts at the exact last frame of clip N.
  // Direct synchronized concat produces a 100% continuous, flicker-free, jump-free flow.
  let stitchedPath: string;

  if (clips.length === 1) {
    stitchedPath = clips[0];
  } else {
    const stitchedFilename = `stitched_${videoId}.mp4`;
    stitchedPath = path.join(exportsDir, stitchedFilename);

    const concatFilePath = path.join(exportsDir, `concat_${videoId}.txt`);
    const concatContent = clips.map(c => `file '${c.replace(/'/g, "'\\''")}'`).join('\n');
    fs.writeFileSync(concatFilePath, concatContent);

    // Re-encode during concat to ensure synchronized timestamps, keyframes, and seamless audio
    const concatCmd = `${getFfmpegCmd()} -y -f concat -safe 0 -i "${concatFilePath}" -c:v libx264 -preset veryfast -pix_fmt yuv420p -r 25 -c:a aac -b:a 192k "${stitchedPath}"`;
    try {
      await execPromise(concatCmd);
    } catch (concatErr: any) {
      console.warn('Re-encoded concat failed, trying fast copy concat:', concatErr.message);
      const copyCmd = `${getFfmpegCmd()} -y -f concat -safe 0 -i "${concatFilePath}" -c copy "${stitchedPath}"`;
      await execPromise(copyCmd);
    }
    if (fs.existsSync(concatFilePath)) fs.unlinkSync(concatFilePath);
  }

  // 3. Apply color unification pass for consistent look across all clips
  const colorGradedFilename = `graded_${videoId}.mp4`;
  const colorGradedPath = path.join(exportsDir, colorGradedFilename);
  try {
    const gradeCmd = `${getFfmpegCmd()} -y -i "${stitchedPath}" -vf "eq=brightness=0.04:saturation=1.3,hue=h=5" -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a copy "${colorGradedPath}"`;
    await execPromise(gradeCmd);
  } catch (err: any) {
    console.warn('Color grading pass failed, using ungraded:', err.message);
    if (stitchedPath !== colorGradedPath) {
      fs.copyFileSync(stitchedPath, colorGradedPath);
    }
  }

  // 4. Optional background music layer
  const bgMusicPath = path.join(exportsDir, `bgm_${videoId}.mp3`);
  await generatePlayfulBgm(bgMusicPath, totalDuration);

  // 5. Mix background music with the color-graded video (punchy bouncy volume)
  const mixCmd = `${getFfmpegCmd()} -y -i "${colorGradedPath}" -i "${bgMusicPath}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:weights=1.0 0.38[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k "${finalVideoPath}"`;

  try {
    await execPromise(mixCmd);
  } catch (err: any) {
    console.warn('Audio mix failed, using video without BGM:', err.message);
    fs.copyFileSync(colorGradedPath, finalVideoPath);
  }

  // Clean up intermediate files
  for (const tempFile of [stitchedPath, colorGradedPath]) {
    if (tempFile !== finalVideoPath && fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch { /* ignore */ }
    }
  }

  // 6. Generate Thumbnail
  try {
    await execPromise(`${getFfmpegCmd()} -y -ss 00:00:02 -i "${finalVideoPath}" -vframes 1 -q:v 2 "${thumbnailPath}"`);
  } catch {
    // If ss 2s fails, take 0.5s
    await execPromise(`${getFfmpegCmd()} -y -ss 00:00:00.5 -i "${finalVideoPath}" -vframes 1 -q:v 2 "${thumbnailPath}"`);
  }

  return {
    id: videoId,
    story_id: storyId,
    title,
    description: `Watch what happens next! 😂🦆 Subscribe for daily funny cartoons, dancing animals, and laugh-out-loud slapstick animations!\n\n#Shorts #Funny #Animation #Comedy #KidsAnimation #Slapstick #Trending #ViralShorts`,
    tags: ['funny 3d animation', 'pixar style shorts', 'baby and duck comedy', 'slapstick cartoon', 'kids comedy shorts', 'funny animal dance', 'viral shorts', 'trending shorts'],
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
  const cmd = `${getFfmpegCmd()} -y -f lavfi -i color=c=0x1E1B4B:s=${width}x${height}:d=1 -vf "drawtext=text='${safeText}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2" -vframes 1 "${filePath}"`;
  await execPromise(cmd);
}

async function generatePlayfulBgm(outPath: string, durationSeconds: number) {
  const fastBgm = path.join(process.cwd(), 'data', 'audio', 'fast_dance_funny_bgm.mp3');
  const customBgm = path.join(process.cwd(), 'data', 'audio', 'comedy_bouncy_bgm.mp3');
  const chosenBgm = fs.existsSync(fastBgm) ? fastBgm : customBgm;
  const d = Math.ceil(durationSeconds) + 2;

  if (fs.existsSync(chosenBgm)) {
    const cmd = `${getFfmpegCmd()} -y -stream_loop -1 -i "${chosenBgm}" -t ${d} -c:a libmp3lame "${outPath}"`;
    try {
      await execPromise(cmd);
      return;
    } catch (e) {
      console.warn('Failed to loop custom BGM, falling back to synth:', e);
    }
  }

  // Synthesize a soft, cheerful chord progression (C-E-G / gentle lullaby tones)
  const cmd = `${getFfmpegCmd()} -y -f lavfi -i "sine=frequency=261.63:duration=${d}" -f lavfi -i "sine=frequency=329.63:duration=${d}" -f lavfi -i "sine=frequency=392.00:duration=${d}" -filter_complex "[0:a][1:a][2:a]amix=inputs=3:dropout_transition=2,volume=0.08,lowpass=f=1200" -c:a libmp3lame "${outPath}"`;
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
