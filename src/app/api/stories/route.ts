import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { Story } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const story = DB.getStory(id);
    if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(story);
  }
  const stories = DB.getStories();
  return NextResponse.json(stories);
}

export async function POST(req: NextRequest) {
  try {
    const story: Story = await req.json();
    if (!story.id) story.id = `story_${Date.now()}`;
    if (!story.created_at) story.created_at = new Date().toISOString();
    DB.saveStory(story);
    return NextResponse.json(story);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  DB.deleteStory(id);
  return NextResponse.json({ success: true });
}
