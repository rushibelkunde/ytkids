import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { uploadVideoToYouTube, generateYouTubeAuthUrl } from '@/lib/youtube';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { video_id, title, description, tags, privacy_status = 'public' } = body;

    const videos = DB.getVideos();
    const video = videos.find(v => v.id === video_id);
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const settings = DB.getSettings();

    // If channel is authenticated, perform genuine live upload via YouTube Data API
    if (settings.youtube_refresh_token || process.env.YOUTUBE_REFRESH_TOKEN) {
      const uploadRes = await uploadVideoToYouTube({
        videoId: video_id,
        privacyStatus: privacy_status,
        title,
        description,
        tags
      });

      return NextResponse.json({
        success: true,
        message: 'Video successfully uploaded to your YouTube channel!',
        youtube_video_id: uploadRes.youtubeVideoId,
        url: uploadRes.url
      });
    }

    // If OAuth credentials exist but user has not authorized channel yet
    if (settings.youtube_client_id && settings.youtube_client_secret) {
      const authUrl = generateYouTubeAuthUrl();
      return NextResponse.json({
        needsAuth: true,
        error: 'YouTube channel not connected yet. Please click "Authorize YouTube" to link your channel.',
        authUrl
      }, { status: 401 });
    }

    // If no credentials configured at all
    return NextResponse.json({
      error: 'Google OAuth Client ID & Secret are not configured in settings.'
    }, { status: 400 });
  } catch (err: any) {
    console.error('YouTube API route error:', err);
    return NextResponse.json({ 
      error: err.message,
      details: err.response?.data?.error?.message || err.message 
    }, { status: 500 });
  }
}
