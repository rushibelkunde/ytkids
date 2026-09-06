import { NextRequest, NextResponse } from 'next/server';
import { uploadVideoToYouTube } from '@/lib/youtube';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { video_id, privacy_status = 'public', title, description, tags } = body;

    if (!video_id) {
      return NextResponse.json({ error: 'Missing video_id' }, { status: 400 });
    }

    const result = await uploadVideoToYouTube({
      videoId: video_id,
      privacyStatus: privacy_status,
      title,
      description,
      tags
    });

    return NextResponse.json({
      success: true,
      message: 'Video successfully published to YouTube Shorts!',
      ...result
    });
  } catch (err: any) {
    console.error('YouTube upload error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to upload video to YouTube',
      details: err.response?.data?.error?.message || err.message
    }, { status: 500 });
  }
}
