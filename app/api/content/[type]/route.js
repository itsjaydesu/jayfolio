import { NextResponse } from 'next/server';
import {
  CONTENT_TYPES,
  deleteEntry,
  readEntries,
  readEntry,
  upsertEntry
} from '../../../../lib/contentStore';

export const dynamic = 'force-dynamic';

function isValidType(type) {
  return CONTENT_TYPES.includes(type);
}

function normalizeEntry(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const { slug, title, summary = '', content = '', tags = [], createdAt = new Date().toISOString() } = payload;
  if (!slug || !title) {
    return null;
  }
  return {
    slug,
    title,
    summary,
    content,
    tags,
    createdAt
  };
}

export async function GET(request, { params }) {
  const { type } = params;
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
      return NextResponse.json({ entry });
    }

    const entries = await readEntries(type);
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { type } = params;
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

export async function PUT(request, { params }) {
  const { type } = params;
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

export async function DELETE(request, { params }) {
  const { type } = params;
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
