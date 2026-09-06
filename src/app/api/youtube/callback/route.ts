import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL(`/library?error=${encodeURIComponent(error)}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/library?error=missing_code', req.url));
  }

  try {
    const { channelTitle } = await exchangeCodeForTokens(code);
    return NextResponse.redirect(
      new URL(`/library?connected=true&channel=${encodeURIComponent(channelTitle)}`, req.url)
    );
  } catch (err: any) {
    console.error('Error exchanging OAuth code for tokens:', err);
    return NextResponse.redirect(
      new URL(`/library?error=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}
