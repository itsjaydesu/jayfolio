import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB cap for now

function isAllowedFileType(type) {
  if (!type) return true;
  return (
    type.startsWith('image/') ||
    type.startsWith('video/') ||
    type.startsWith('audio/') ||
    type === 'application/zip' ||
    type === 'application/pdf' ||
    type === 'text/plain' ||
    type === 'text/markdown' ||
    type === 'application/json'
  );
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (typeof file === 'string') {
      return NextResponse.json({ error: 'Invalid file payload' }, { status: 400 });
    }

    if (!isAllowedFileType(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const safeName = file.name || 'upload';

    const blob = await put(safeName, file, {
      access: 'public',
      addRandomSuffix: true,
      cacheControl: 'public, max-age=31536000, immutable'
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      type: blob.contentType
    });
  } catch (error) {
    console.error('[upload] error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
