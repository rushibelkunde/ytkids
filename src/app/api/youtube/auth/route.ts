import { NextRequest, NextResponse } from 'next/server';
import { generateYouTubeAuthUrl } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  try {
    const authUrl = generateYouTubeAuthUrl();
    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get('format');

    if (format === 'json') {
      return NextResponse.json({ success: true, authUrl });
    }

    // Direct redirect to Google consent screen
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
