import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { assembleFullVideo } from '@/lib/video/ffmpeg';
import { generateSceneImage, generateSceneVideo } from '@/lib/ai/fal';
import { generateSpeech } from '@/lib/ai/tts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { story_id, aspect_ratio = '9:16', engine = 'motion_storybook' } = body;

    if (!story_id) {
      return NextResponse.json({ error: 'Missing story_id' }, { status: 400 });
    }

    const story = DB.getStory(story_id);
    if (!story || !story.scenes || story.scenes.length === 0) {
      return NextResponse.json({ error: 'Story has no scenes to render' }, { status: 404 });
    }

    // Auto-generate missing images, videos, and audios
    const readyScenes = [];
    for (const scene of story.scenes) {
      let imgUrl = scene.image_url;
      let vidUrl = scene.video_url;
      let audUrl = scene.audio_url;
      let duration = scene.duration_seconds || 6.0;

      // 1. Ensure scene image exists
      if (!imgUrl) {
        const imgRes = await generateSceneImage({
          prompt: scene.visual_prompt,
          sceneId: scene.id,
          aspectRatio: aspect_ratio
        });
        imgUrl = imgRes.url;
        DB.updateScene({ id: scene.id, image_url: imgUrl, status: 'generated' });
      }

      // 2. If engine is full_ai_video, ensure scene has moving character video
      if (engine === 'full_ai_video' && !vidUrl) {
        try {
          const vidRes = await generateSceneVideo({
            prompt: scene.visual_prompt,
            imageUrl: imgUrl,
            sceneId: scene.id,
            aspectRatio: aspect_ratio,
            duration: '5'
          });
          vidUrl = vidRes.url;
          DB.updateScene({ id: scene.id, video_url: vidUrl, status: 'generated' });
        } catch (vidErr) {
          console.warn(`Video generation failed for scene ${scene.id}, falling back to motion storybook:`, vidErr);
        }
      }

      // 3. Ensure scene audio exists
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

    // Assemble via FFmpeg
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
