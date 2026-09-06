import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { generateSpeech } from '@/lib/ai/tts';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const storyId = body.story_id;
    if (!storyId) return NextResponse.json({ error: 'Missing story_id' }, { status: 400 });

    const story = DB.getStory(storyId);
    const scene = story?.scenes?.find(s => s.id === id);
    if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });

    const narrationText = body.narration_text || scene.narration_text;
    const voice = body.voice;

    const result = await generateSpeech(narrationText, voice, id);

    DB.updateScene({
      id,
      audio_url: result.audioUrl,
      duration_seconds: result.durationSeconds
    });

    return NextResponse.json({ 
      success: true, 
      audio_url: result.audioUrl,
      duration_seconds: result.durationSeconds 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
