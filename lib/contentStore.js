import { promises as fs } from 'fs';
import path from 'path';
import { getLocalizedContent } from './translations';

export const CONTENT_TYPES = ['projects', 'content', 'words', 'sounds', 'art'];

const CONTENT_DIR = path.join(process.cwd(), 'content');

// Map 'words' to 'content' for backward compatibility
const TYPE_MAPPING = {
  'words': 'content'
};

function assertType(type) {
  if (!CONTENT_TYPES.includes(type)) {
    throw new Error(`Unsupported content type: ${type}`);
  }
}

function getMappedType(type) {
  return TYPE_MAPPING[type] || type;
}

async function ensureDir() {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
}

function getContentPath(type) {
  const mappedType = getMappedType(type);
  return path.join(CONTENT_DIR, `${mappedType}.json`);
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

/**
 * Read localized entries with content fallback
 * @param {string} type - Content type
 * @param {string} language - Language code ('en' or 'ja')
 * @returns {Promise<Array>} Localized entries array
 */
export async function readLocalizedEntries(type, language = 'en') {
  const entries = await readEntries(type);
  
  return entries.map(entry => ({
    ...entry,
    title: getLocalizedContent(entry.title, language),
    summary: getLocalizedContent(entry.summary, language),
    content: getLocalizedContent(entry.content, language),
    _originalEntry: entry // Keep reference for fallback checking
  }));
}

/**
 * Read a single localized entry with fallback
 * @param {string} type - Content type
 * @param {string} slug - Entry slug
 * @param {string} language - Language code ('en' or 'ja')
 * @returns {Promise<object|null>} Localized entry or null
 */
export async function readLocalizedEntry(type, slug, language = 'en') {
  const entry = await readEntry(type, slug);
  if (!entry) return null;
  
  return {
    ...entry,
    title: getLocalizedContent(entry.title, language),
    summary: getLocalizedContent(entry.summary, language),
    content: getLocalizedContent(entry.content, language),
    _originalEntry: entry
  };
}

/**
 * Check if an entry has translation for a specific language
 * @param {object} entry - Content entry
 * @param {string} language - Language code ('en' or 'ja')
 * @returns {boolean} True if translation exists
 */
export function hasTranslation(entry, language = 'en') {
  if (!entry || typeof entry !== 'object') return false;
  
  // For English, check if string exists (backward compatibility)
  if (language === 'en') {
    return !!(typeof entry.title === 'string' && entry.title.trim() ||
              typeof entry.title?.en === 'string' && entry.title.en.trim());
  }
  
  // For other languages, check language-specific field
  return !!(typeof entry.title?.[language] === 'string' && entry.title[language].trim() &&
            typeof entry.summary?.[language] === 'string' && entry.summary[language].trim());
}
