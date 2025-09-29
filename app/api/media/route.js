import { NextResponse } from 'next/server';
import { readMediaIndex, updateMediaFile, removeMediaFile } from '../../../lib/mediaIndex';
import { del } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { files } = await readMediaIndex();
    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { pathname, ...patch } = await request.json();
    if (!pathname) return NextResponse.json({ error: 'Missing pathname' }, { status: 400 });
    const updated = await updateMediaFile(pathname, patch);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ file: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get('pathname');
    if (!pathname) return NextResponse.json({ error: 'Missing pathname' }, { status: 400 });

    // Attempt blob deletion first (ignore not found)
    try {
      await del(pathname);
    } catch (e) {
      console.warn('[media] blob delete ignored', e?.message || e);
    }

    const { removed } = await removeMediaFile(pathname);
    if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
