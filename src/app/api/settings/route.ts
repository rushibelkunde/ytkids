import { NextRequest, NextResponse } from 'next/server';
import { DB } from '@/lib/db';

export async function GET() {
  const settings = DB.getSettings();
  // Mask sensitive keys slightly for display
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = DB.updateSettings(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
