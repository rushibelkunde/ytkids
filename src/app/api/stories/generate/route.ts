import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { generateKidsStory } from '@/lib/ai/gemini';
import { Story, Scene, Character } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, niche, age_group, style, language, character_ids } = body;

    // Fetch selected characters
    const allChars = DB.getCharacters();
    const selectedChars: Character[] = (character_ids && character_ids.length > 0)
      ? allChars.filter(c => character_ids.includes(c.id))
      : allChars.slice(0, 1);

    const generated = await generateKidsStory({
      prompt: prompt || 'A cheerful kids adventure about curiosity and friendship',
      niche: niche || 'moral_story',
      age_group: age_group || 'early',
      style: style || '3d_pixar',
      language: language || 'English',
      characters: selectedChars,
      scene_count: body.scene_count || 5
    });

    const storyId = `story_${Date.now()}`;
    const scenes: Scene[] = generated.scenes.map((s, idx) => ({
      id: `scene_${storyId}_${idx + 1}`,
      story_id: storyId,
      scene_number: s.scene_number || (idx + 1),
      title: s.title || `Scene ${idx + 1}`,
      narration_text: s.narration_text,
      visual_prompt: s.visual_prompt,
      camera_direction: s.camera_direction || 'zoom_in',
      duration_seconds: s.duration_seconds || 6.0,
      status: 'pending'
    }));

    const story: Story = {
      id: storyId,
      title: generated.title || 'Magical Kids Adventure',
      user_prompt: prompt,
      niche: niche || 'moral_story',
      age_group: age_group || 'early',
      style: style || '3d_pixar',
      language: language || 'English',
      character_ids: selectedChars.map(c => c.id),
      moral_or_hook: generated.moral_or_hook,
      estimated_duration: generated.estimated_duration || 30,
      status: 'scripted',
      created_at: new Date().toISOString(),
      scenes
    };

    DB.saveStory(story);
    return NextResponse.json(story);
  } catch (err: any) {
    console.error('Story generation API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
