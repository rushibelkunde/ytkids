import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { DB } from './db';
import { VideoProject } from './types';

const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback';

export function getOAuth2Client() {
  const settings = DB.getSettings();
  const clientId = settings.youtube_client_id || process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const clientSecret = settings.youtube_client_secret || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth Client ID or Client Secret is not configured in .env.local or settings');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  if (settings.youtube_refresh_token) {
    oauth2Client.setCredentials({
      refresh_token: settings.youtube_refresh_token,
      access_token: settings.youtube_access_token || undefined
    });
  }

  return oauth2Client;
}

export function generateYouTubeAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    prompt: 'consent'
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{ channelTitle: string; channelId: string }> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Fetch Channel Info
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  let channelTitle = 'My YouTube Channel';
  let channelId = '';

  try {
    const channelRes = await youtube.channels.list({
      part: ['snippet'],
      mine: true
    });
    if (channelRes.data.items && channelRes.data.items.length > 0) {
      const channel = channelRes.data.items[0];
      channelTitle = channel.snippet?.title || channelTitle;
      channelId = channel.id || '';
    }
  } catch (err) {
    console.warn('Could not fetch channel details, using default title:', err);
  }

  DB.updateSettings({
    youtube_refresh_token: tokens.refresh_token || undefined,
    youtube_access_token: tokens.access_token || undefined,
    youtube_channel_title: channelTitle,
    youtube_channel_id: channelId
  });

  return { channelTitle, channelId };
}

export async function uploadVideoToYouTube(params: {
  videoId: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
  title?: string;
  description?: string;
  tags?: string[];
}): Promise<{ success: boolean; youtubeVideoId: string; url: string; title: string }> {
  const { videoId, privacyStatus = 'public', title, description, tags } = params;

  const videos = DB.getVideos();
  const video = videos.find(v => v.id === videoId);
  if (!video) {
    throw new Error(`Video with ID ${videoId} not found in database`);
  }

  const oauth2Client = getOAuth2Client();
  const settings = DB.getSettings();
  if (!settings.youtube_refresh_token && !process.env.YOUTUBE_REFRESH_TOKEN) {
    throw new Error('YouTube channel is not connected. Please authorize your channel first.');
  }

  const videoFilename = path.basename(video.video_path || '');
  const videoFilePath = path.join(process.cwd(), 'data', 'exports', videoFilename);

  if (!fs.existsSync(videoFilePath)) {
    throw new Error(`Video file not found at ${videoFilePath}`);
  }

  const finalTitle = (title || video.title).slice(0, 100);
  const finalDesc = description || video.description;
  const finalTags = tags || video.tags;

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  // 1. Upload Video
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: finalTitle,
        description: finalDesc,
        tags: finalTags,
        categoryId: '24', // Entertainment
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en'
      },
      status: {
        privacyStatus: privacyStatus,
        madeForKids: true,
        selfDeclaredMadeForKids: true
      }
    },
    media: {
      body: fs.createReadStream(videoFilePath)
    }
  });

  const ytId = res.data.id;
  if (!ytId) {
    throw new Error('YouTube API did not return a video ID');
  }

  // 2. Upload Custom Thumbnail if available
  if (video.thumbnail_path) {
    try {
      const thumbFilename = path.basename(video.thumbnail_path);
      const thumbPath = path.join(process.cwd(), 'data', 'exports', thumbFilename);
      if (fs.existsSync(thumbPath)) {
        await youtube.thumbnails.set({
          videoId: ytId,
          media: {
            body: fs.createReadStream(thumbPath)
          }
        });
      }
    } catch (thumbErr) {
      console.warn('Could not set custom thumbnail (requires verified channel phone number):', thumbErr);
    }
  }

  // 3. Update database
  video.youtube_video_id = ytId;
  video.youtube_status = privacyStatus;
  video.title = finalTitle;
  video.description = finalDesc;
  video.tags = finalTags;
  DB.saveVideo(video);

  return {
    success: true,
    youtubeVideoId: ytId,
    url: `https://youtube.com/shorts/${ytId}`,
    title: finalTitle
  };
}
