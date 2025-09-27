import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB cap for now

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

function buildFilename(originalName, mimeType) {
  const ext = path.extname(originalName) || mimeToExt(mimeType) || '';
  const base = crypto.randomBytes(6).toString('hex');
  return `${Date.now()}-${base}${ext}`;
}

function mimeToExt(mimeType) {
  if (!mimeType) return '';
  if (mimeType.startsWith('image/')) {
    return `.${mimeType.split('/')[1]}`;
  }
  if (mimeType.startsWith('video/')) {
    return `.${mimeType.split('/')[1]}`;
  }
  if (mimeType.startsWith('audio/')) {
    return `.${mimeType.split('/')[1]}`;
  }
  if (mimeType === 'text/plain') return '.txt';
  if (mimeType === 'text/markdown') return '.md';
  return '';
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

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    await ensureUploadDir();
    const buffer = Buffer.from(arrayBuffer);
    const filename = buildFilename(file.name ?? 'upload', file.type);
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url, filename, size: buffer.length, type: file.type });
  } catch (error) {
    console.error('[upload] error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
