import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folder: string; filename: string }> }
) {
  const { folder, filename } = await params;

  // Validate allowed folders
  const allowedFolders = ['characters', 'scenes', 'audio', 'exports', 'channel'];
  if (!allowedFolders.includes(folder)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Prevent directory traversal
  const sanitizedFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), 'data', folder, sanitizedFilename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('File Not Found', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(sanitizedFilename).toLowerCase();

  let contentType = 'application/octet-stream';
  if (ext === '.png') contentType = 'image/png';
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.svg') contentType = 'image/svg+xml';
  else if (ext === '.mp3') contentType = 'audio/mpeg';
  else if (ext === '.mp4') contentType = 'video/mp4';

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, immutable'
    }
  });
}
