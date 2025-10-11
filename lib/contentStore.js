import { promises as fs } from 'fs';
import path from 'path';

export const CONTENT_TYPES = ['projects', 'words', 'sounds'];

const CONTENT_DIR = path.join(process.cwd(), 'content');

function assertType(type) {
  if (!CONTENT_TYPES.includes(type)) {
    throw new Error(`Unsupported content type: ${type}`);
  }
}

async function ensureDir() {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
}

function getContentPath(type) {
  return path.join(CONTENT_DIR, `${type}.json`);
}

export async function readContentFile(type) {
  assertType(type);
  await ensureDir();
  const filePath = getContentPath(type);

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { entries: [] };
    }
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    return { entries };
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify({ entries: [] }, null, 2));
      return { entries: [] };
    }
    throw error;
  }
}

export async function readEntries(type) {
  const { entries } = await readContentFile(type);
  return [...entries].sort((a, b) => {
    const aTime = a?.createdAt ? Date.parse(a.createdAt) : Number.NEGATIVE_INFINITY;
    const bTime = b?.createdAt ? Date.parse(b.createdAt) : Number.NEGATIVE_INFINITY;

    if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
      if (aTime !== bTime) {
        return bTime - aTime;
      }
    } else if (Number.isFinite(aTime)) {
      return -1;
    } else if (Number.isFinite(bTime)) {
      return 1;
    }

    return (a?.title || '').localeCompare(b?.title || '');
  });
}

export async function readEntry(type, slug) {
  if (!slug) return null;
  const entries = await readEntries(type);
  return entries.find((entry) => entry.slug === slug) ?? null;
}

export async function writeEntries(type, entries) {
  assertType(type);
  await ensureDir();
  const filePath = getContentPath(type);
  const payload = { entries };
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return entries;
}

export async function upsertEntry(type, entry) {
  assertType(type);
  if (!entry?.slug) {
    throw new Error('Entry must include a slug');
  }
  const entries = await readEntries(type);
  const index = entries.findIndex((item) => item.slug === entry.slug);
  if (index >= 0) {
    entries[index] = { ...entries[index], ...entry };
  } else {
    entries.unshift(entry);
  }
  await writeEntries(type, entries);
  return entry;
}

export async function deleteEntry(type, slug) {
  assertType(type);
  const entries = await readEntries(type);
  const next = entries.filter((item) => item.slug !== slug);
  await writeEntries(type, next);
  return next.length !== entries.length;
}
