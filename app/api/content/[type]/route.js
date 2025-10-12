import { NextResponse } from 'next/server';
import {
  CONTENT_TYPES,
  deleteEntry,
  readEntries,
  readEntry,
  upsertEntry
} from '../../../../lib/contentStore';

// Keep dynamic for admin operations, but add cache headers to GET requests
export const dynamic = 'force-dynamic';

function isValidType(type) {
  return CONTENT_TYPES.includes(type);
}

function normalizeEntry(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const {
    slug,
    title,
    summary = '',
    content = '',
    tags = [],
    coverImage = null,
    status = 'draft',
    createdAt = new Date().toISOString()
  } = payload;
  if (!slug || !title) {
    return null;
  }
  return {
    slug,
    title,
    summary,
    content,
    tags,
    coverImage,
    status: status === 'published' ? 'published' : 'draft',
    createdAt,
    updatedAt: new Date().toISOString()
  };
}

export async function GET(request, context) {
  const { type } = await context.params;
  if (!isValidType(type)) {
    return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  try {
    if (slug) {
      const entry = await readEntry(type, slug);
      if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }
      return NextResponse.json({ entry }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600'
        }
      });
    }

    const entries = await readEntries(type);
    return NextResponse.json({ entries }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, context) {
  const { type } = await context.params;
  if (!isValidType(type)) {
    return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const entry = normalizeEntry(payload);
    if (!entry) {
      return NextResponse.json({ error: 'Invalid entry payload' }, { status: 400 });
    }

    const existing = await readEntry(type, entry.slug);
    if (existing) {
      return NextResponse.json({ error: 'Entry already exists' }, { status: 409 });
    }

    await upsertEntry(type, entry);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  const { type } = await context.params;
  if (!isValidType(type)) {
    return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const entry = normalizeEntry(payload);
    if (!entry) {
      return NextResponse.json({ error: 'Invalid entry payload' }, { status: 400 });
    }

    const existing = await readEntry(type, entry.slug);
    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    await upsertEntry(type, entry);
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const { type } = await context.params;
  if (!isValidType(type)) {
    return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  try {
    const removed = await deleteEntry(type, slug);
    if (!removed) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
