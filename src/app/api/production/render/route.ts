import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { assembleFullVideo, extractLastFrame } from '@/lib/video/ffmpeg';
import { generateSceneImage, generateSceneVideo } from '@/lib/ai/fal';
import { generateSpeech } from '@/lib/ai/tts';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = DB.getSettings();
    const defaultEngine = settings.default_engine || 'full_ai_video';
    const { story_id, aspect_ratio = '9:16', engine = defaultEngine } = body;

    if (!story_id) {
      return NextResponse.json({ error: 'Missing story_id' }, { status: 400 });
    }

    const story = DB.getStory(story_id);
    if (!story || !story.scenes || story.scenes.length === 0) {
      return NextResponse.json({ error: 'Story has no scenes to render' }, { status: 404 });
    }

    // Auto-generate missing images, videos, and audios
    // With FRAME-CHAINING: each scene uses the last frame of the previous scene
    // to maintain 100% consistent character appearance, lighting, and environment.
    const readyScenes = [];
    let previousClipPath: string | null = null; // For frame-chaining continuity
    let hasRegeneratedPrevious = Boolean(body.force_regenerate || body.force);

    for (let i = 0; i < story.scenes.length; i++) {
      const scene = story.scenes[i];
      let imgUrl = scene.image_url;
      let vidUrl = scene.video_url;
      let audUrl = scene.audio_url;
      let duration = scene.duration_seconds || 6.0;

      // 1. Frame-chaining for full_ai_video:
      // For all scenes after Scene 1 (i > 0), the starting image MUST be the exact last frame
      // of the preceding clip so that character appearance, pose, clothing, and background are continuous.
      if (engine === 'full_ai_video' && i > 0 && previousClipPath) {
        try {
          const exportsDir = path.join(process.cwd(), 'data', 'exports');
          const lastFramePath = await extractLastFrame(previousClipPath, exportsDir);
          const fs = await import('fs');
          const scenesDir = path.join(process.cwd(), 'data', 'scenes');
          const chainedFilename = `chained_${scene.id}_${Date.now()}.png`;
          const chainedPath = path.join(scenesDir, chainedFilename);
          fs.copyFileSync(lastFramePath, chainedPath);
          imgUrl = `/api/media/scenes/${chainedFilename}`;
          DB.updateScene({ id: scene.id, image_url: imgUrl, status: 'generated' });
        } catch (chainErr) {
          console.warn(`Frame-chaining extraction failed for scene ${scene.id}:`, chainErr);
        }
      }

      // 2. Ensure initial scene image exists (for Scene 1 or if chaining failed)
      if (!imgUrl) {
        const imgRes = await generateSceneImage({
          prompt: scene.visual_prompt,
          sceneId: scene.id,
          aspectRatio: aspect_ratio
        });
        imgUrl = imgRes.url;
        DB.updateScene({ id: scene.id, image_url: imgUrl, status: 'generated' });
      }

      // 3. If engine is full_ai_video, generate animated video clip
      if (engine === 'full_ai_video') {
        const shouldGenerateVid = !vidUrl || hasRegeneratedPrevious;
        if (shouldGenerateVid) {
          try {
            const vidRes = await generateSceneVideo({
              prompt: scene.visual_prompt,
              imageUrl: imgUrl,
              sceneId: scene.id,
              aspectRatio: aspect_ratio,
              duration: '5',
              isChained: i > 0
            });
            vidUrl = vidRes.url;
            previousClipPath = vidRes.filePath;
            hasRegeneratedPrevious = true;
            DB.updateScene({ id: scene.id, video_url: vidUrl, status: 'generated' });
          } catch (vidErr) {
            console.warn(`Video generation failed for scene ${scene.id}, falling back to motion storybook:`, vidErr);
          }
        } else if (vidUrl) {
          // If reusing existing clip, track its local path for next scene chaining
          const fs = await import('fs');
          const localPath = path.join(process.cwd(), vidUrl.replace('/api/media', 'data'));
          if (fs.existsSync(localPath)) {
            previousClipPath = localPath;
          }
        }
      }

      // 4. Ensure scene audio exists
      if (!audUrl) {
        const audRes = await generateSpeech(scene.narration_text, undefined, scene.id);
        audUrl = audRes.audioUrl;
        duration = audRes.durationSeconds;
        DB.updateScene({ id: scene.id, audio_url: audUrl, duration_seconds: duration });
      }

      readyScenes.push({
        ...scene,
        image_url: imgUrl,
        video_url: vidUrl,
        audio_url: audUrl,
        duration_seconds: duration
      });
    }

    // Assemble via FFmpeg (with cross-dissolve transitions + color grading)
    const videoProject = await assembleFullVideo({
      storyId: story.id,
      title: story.title,
      scenes: readyScenes,
      aspectRatio: aspect_ratio,
      engine: engine
    });

    DB.saveVideo(videoProject);

    // Update story status
    story.status = 'completed';
    story.scenes = readyScenes;
    DB.saveStory(story);

    return NextResponse.json({
      success: true,
      video: videoProject
    });
  } catch (err: any) {
    console.error('Video assembly error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
