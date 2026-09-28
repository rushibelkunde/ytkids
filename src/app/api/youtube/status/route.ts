import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/lib/db';
import { generateYouTubeAuthUrl } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  try {
    const settings = DB.getSettings();
    const hasClientId = Boolean(settings.youtube_client_id && settings.youtube_client_secret);
    let isConnected = Boolean(settings.youtube_refresh_token || process.env.YOUTUBE_REFRESH_TOKEN);

    let authUrl = '';
    if (hasClientId) {
      try {
        authUrl = generateYouTubeAuthUrl();
      } catch {}
    }

    // Proactively verify token health if credentials are present
    if (isConnected && settings.youtube_refresh_token) {
      try {
        const { getOAuth2Client } = await import('@/lib/youtube');
        const client = getOAuth2Client();
        const tokenRes = await client.getAccessToken();
        if (!tokenRes.token) {
          isConnected = false;
        }
      } catch (tokenErr: any) {
        console.warn('OAuth refresh token is invalid or expired:', tokenErr.message);
        isConnected = false;
        // Clean up invalid tokens from DB
        DB.updateSettings({
          youtube_access_token: undefined,
          youtube_refresh_token: undefined
        });
      }
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
