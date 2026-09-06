import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { Character } from '@/lib/types';
import { generateCharacterAvatar } from '@/lib/ai/fal';
import { VISUAL_STYLES } from '@/lib/presets';

export async function GET() {
  const characters = DB.getCharacters();
  return NextResponse.json(characters);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id || `char_${Date.now()}`;
    
    const styleObj = VISUAL_STYLES.find(s => s.id === body.style) || VISUAL_STYLES[0];
    
    // Generate avatar if not provided
    let avatarUrl = body.avatar_url;
    if (!avatarUrl) {
      const avatarRes = await generateCharacterAvatar({
        name: body.name,
        visualDna: body.visual_dna,
        stylePrompt: styleObj.promptSuffix,
        characterId: id
      });
      avatarUrl = avatarRes.url;
    }

    const character: Character = {
      id,
      name: body.name,
      species: body.species || 'Animal',
      gender: body.gender || 'Any',
      age_appearance: body.age_appearance || 'Child',
      traits: Array.isArray(body.traits) ? body.traits : (body.traits ? body.traits.split(',').map((t: string) => t.trim()) : []),
      visual_dna: body.visual_dna || `${body.name}, cute ${body.species}`,
      style: body.style || '3d_pixar',
      avatar_url: avatarUrl,
      created_at: body.created_at || new Date().toISOString()
    };

    DB.saveCharacter(character);
    return NextResponse.json(character);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  DB.deleteCharacter(id);
  return NextResponse.json({ success: true });
}
