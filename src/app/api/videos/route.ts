import { NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function GET() {
  const videos = DB.getVideos();
  return NextResponse.json(videos);
}
