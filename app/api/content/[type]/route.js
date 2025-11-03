import { NextResponse } from 'next/server';
import {
  CONTENT_TYPES,
  deleteEntry,
  readEntries,
  readEntry,
  upsertEntry
} from '../../../../lib/contentStore';

const SUPPORTED_LANGUAGES = ['en', 'ja'];

// Keep dynamic for admin operations, but add cache headers to GET requests
export const dynamic = 'force-dynamic';

function isValidType(type) {
  return CONTENT_TYPES.includes(type);
}

function hasLocalizedValue(value) {
  if (!value) return false;
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'object') {
    return Object.values(value).some((entry) => typeof entry === 'string' && entry.trim().length > 0);
  }
  return false;
}

function normalizeLocalizedTextField(input) {
  if (!input) return null;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof input === 'object') {
    const result = {};
    for (const language of SUPPORTED_LANGUAGES) {
      const candidate = typeof input[language] === 'string' ? input[language].trim() : '';
      if (candidate) {
        result[language] = candidate;
      }
    }

    if (Object.keys(result).length === 0) {
      const first = Object.entries(input).find(([, value]) => typeof value === 'string' && value.trim());
      if (first) {
        return first[1].trim();
      }
      return null;
    }

    if (Object.keys(result).length === 1 && result.en) {
      return result.en;
    }

    return result;
  }

  return null;
}

function normalizeTagList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeLocalizedTags(input) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input) || typeof input === 'string') {
    return normalizeTagList(input);
  }

  if (typeof input === 'object') {
    const result = {};
    for (const language of SUPPORTED_LANGUAGES) {
      const list = normalizeTagList(input[language]);
      if (list.length) {
        result[language] = list;
      }
    }

    if (Object.keys(result).length === 0) {
      return [];
    }

    if (Object.keys(result).length === 1 && result.en) {
      return result.en;
    }

    return result;
  }

  return [];
}

function normalizeCoverImage(input) {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const url = typeof input.url === 'string' ? input.url.trim() : '';
  if (!url) {
    return null;
  }
  const alt = normalizeLocalizedTextField(input.alt);
  const cover = { url };
  if (hasLocalizedValue(alt)) {
    cover.alt = alt;
  }
  return cover;
}

function normalizeGalleryImages(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (!item) return null;

      if (typeof item === 'string') {
        const url = item.trim();
        return url ? { url } : null;
      }

      if (typeof item !== 'object') {
        return null;
      }

      const url = typeof item.url === 'string' ? item.url.trim() : '';
      if (!url) {
        return null;
      }

      const galleryItem = { url };

      const alt = normalizeLocalizedTextField(item.alt);
      if (hasLocalizedValue(alt)) {
        galleryItem.alt = alt;
      }

      const caption = normalizeLocalizedTextField(item.caption);
      if (hasLocalizedValue(caption)) {
        galleryItem.caption = caption;
      }

      const width = Number.parseInt(item.width, 10);
      if (Number.isFinite(width) && width > 0) {
        galleryItem.width = width;
      }

      const height = Number.parseInt(item.height, 10);
      if (Number.isFinite(height) && height > 0) {
        galleryItem.height = height;
      }

      const blurDataURL = typeof item.blurDataURL === 'string' ? item.blurDataURL.trim() : '';
      if (blurDataURL) {
        galleryItem.blurDataURL = blurDataURL;
      }

      const placeholder = typeof item.placeholder === 'string' ? item.placeholder.trim() : '';
      if (placeholder) {
        galleryItem.placeholder = placeholder;
      }

      const thumbnailUrl = typeof item.thumbnailUrl === 'string' ? item.thumbnailUrl.trim() : '';
      if (thumbnailUrl) {
        galleryItem.thumbnailUrl = thumbnailUrl;
      }

      return galleryItem;
    })
    .filter(Boolean);
}

function normalizeBackgroundImage(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function normalizeDate(value) {
  if (typeof value !== 'string') {
    return new Date().toISOString();
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return new Date().toISOString();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return new Date().toISOString();
}

function normalizeEntry(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const slug = typeof payload.slug === 'string' ? payload.slug.trim() : '';
  const title = normalizeLocalizedTextField(payload.title);
  if (!slug || !hasLocalizedValue(title)) {
    return null;
  }

  const summary = normalizeLocalizedTextField(payload.summary);
  const content = normalizeLocalizedTextField(payload.content);
  const tags = normalizeLocalizedTags(payload.tags);
  const coverImage = normalizeCoverImage(payload.coverImage);
  const status = payload.status === 'published' ? 'published' : 'draft';
  const createdAt = normalizeDate(payload.createdAt);
  const galleryImages = normalizeGalleryImages(payload.galleryImages);
  const backgroundImage = normalizeBackgroundImage(payload.backgroundImage);

  return {
    slug,
    title,
    summary: summary ?? '',
    content: content ?? '',
    tags,
    coverImage,
    galleryImages,
    backgroundImage,
    status,
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
