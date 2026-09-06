import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { generateSceneImage } from '@/lib/ai/fal';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    
    // Find scene
    const storyId = body.story_id;
    if (!storyId) return NextResponse.json({ error: 'Missing story_id' }, { status: 400 });

    const story = DB.getStory(storyId);
    const scene = story?.scenes?.find(s => s.id === id);
    if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });

    const prompt = body.prompt || scene.visual_prompt;
    const aspectRatio = body.aspect_ratio || '9:16';

    const result = await generateSceneImage({
      prompt,
      sceneId: id,
      aspectRatio
    });

    DB.updateScene({
      id,
      image_url: result.url,
      status: 'generated'
    });

    return NextResponse.json({ success: true, image_url: result.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
