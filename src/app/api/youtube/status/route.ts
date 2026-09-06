import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { generateYouTubeAuthUrl } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  try {
    const settings = DB.getSettings();
    const hasClientId = Boolean(settings.youtube_client_id && settings.youtube_client_secret);
    const isConnected = Boolean(settings.youtube_refresh_token || process.env.YOUTUBE_REFRESH_TOKEN);

    let authUrl = '';
    if (hasClientId) {
      try {
        authUrl = generateYouTubeAuthUrl();
      } catch {}
    }

    return NextResponse.json({
      hasClientId,
      isConnected,
      channelTitle: settings.youtube_channel_title || (isConnected ? 'Connected YouTube Channel' : null),
      channelId: settings.youtube_channel_id || null,
      authUrl
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
