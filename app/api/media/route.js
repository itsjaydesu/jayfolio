import { NextResponse } from 'next/server';
import { readMediaIndex, updateMediaFile, removeMediaFile } from '../../../lib/mediaIndex';
import { del } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
    const offsetParam = Number.parseInt(searchParams.get('offset') || '0', 10);
    const searchTerm = (searchParams.get('search') || '').trim().toLowerCase();

    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 60) : 24;
    const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

    const { files } = await readMediaIndex();
    const filtered = searchTerm
      ? files.filter((file) => {
          const haystack = `${file.title || ''} ${file.alt || ''} ${file.pathname || ''}`.toLowerCase();
          return haystack.includes(searchTerm);
        })
      : files;

    const slice = filtered.slice(offset, offset + limit);
    const nextOffset = offset + slice.length;
    const total = filtered.length;
    const hasMore = nextOffset < total;

    return NextResponse.json({
      files: slice,
      total,
      hasMore,
      nextOffset: hasMore ? nextOffset : null
    });
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
