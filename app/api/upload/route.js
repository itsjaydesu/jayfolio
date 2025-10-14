import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { appendMediaFile } from '../../../lib/mediaIndex';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // Keep in sync with the editor.
const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
const ALLOWED_MIME_TYPES = new Set([
  'application/zip',
  'application/pdf',
  'application/json',
  'text/plain',
  'text/markdown'
]);
const ALLOWED_EXTENSIONS = ['.zip', '.pdf', '.txt', '.md', '.json'];

function sanitizeFileName(name) {
  if (!name || typeof name !== 'string') {
    return 'upload';
  }
  const trimmed = name.trim().replace(/\\/g, '/');
  const base = trimmed.substring(trimmed.lastIndexOf('/') + 1);
  const cleaned = base.replace(/[^a-zA-Z0-9._()-]/g, '-');
  return cleaned.length > 0 ? cleaned.slice(-128) : 'upload';
}

function isAllowedFile(file) {
  const type = file?.type ?? '';
  if (ALLOWED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix))) {
    return true;
  }
  if (ALLOWED_MIME_TYPES.has(type)) {
    return true;
  }
  const name = (file?.name ?? '').toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension));
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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    if (!isAllowedFile(file)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    const fileName = sanitizeFileName(file.name);

    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: true,
      cacheControl: 'public, max-age=31536000, immutable'
    });

    const record = {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      type: blob.contentType
    };

    try {
      await appendMediaFile(record);
    } catch (indexErr) {
      console.warn('[upload] failed to append media index', indexErr);
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('[upload] error:', error);
    
    // Handle different error types properly
    let errorMessage = 'Upload failed';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error.toString === 'function') {
      const errorString = error.toString();
      // Avoid returning "[object Event]" or similar object representations
      if (!errorString.startsWith('[object ')) {
        errorMessage = errorString;
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
