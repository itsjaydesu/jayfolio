import { NextResponse } from 'next/server';
import { CONTENT_TYPES, readEntry, upsertEntry } from '../../../../../lib/contentStore';

export const dynamic = 'force-dynamic';

function isValidType(type) {
  return CONTENT_TYPES.includes(type);
}

// no-op helper removed (lint)

export async function POST(request, { params }) {
  const { type } = params;
  if (!isValidType(type)) {
    return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
  }

  try {
    const { slug } = await request.json();
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }
    const original = await readEntry(type, slug);
    if (!original) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const exists = async (s) => Boolean(await readEntry(type, s));
    const copySlug = await (async () => {
      let candidate = `${slug}-copy`;
      let i = 2;
      while (await exists(candidate)) {
        candidate = `${slug}-copy-${i++}`;
      }
      return candidate;
    })();

    const now = new Date().toISOString();
    const copy = {
      ...original,
      slug: copySlug,
      title: `${original.title} (Copy)`,
      status: 'draft',
      updatedAt: now,
      createdAt: now
    };

    await upsertEntry(type, copy);
    return NextResponse.json({ entry: copy }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
