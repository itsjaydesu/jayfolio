import { promises as fs } from 'fs';
import path from 'path';
import { CHANNEL_CONTENT_DEFAULTS, createChannelContentDefaults } from './channelContentDefaults';

const FILE_PATH = path.join(process.cwd(), 'content', 'channel-content.json');

async function ensureFile() {
  try {
    await fs.access(FILE_PATH);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    await fs.writeFile(FILE_PATH, `${JSON.stringify(CHANNEL_CONTENT_DEFAULTS, null, 2)}\n`, 'utf8');
  }
}

function sanitizeString(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const next = value.trim();
  return next.length ? next : fallback;
}

function sanitizeLocalizedField(value, fallback) {
  const languages = ['en', 'ja'];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    if (fallback && typeof fallback === 'object') {
      return { ...fallback, en: trimmed };
    }
    return trimmed;
  }

  if (value && typeof value === 'object') {
    const result = {};
    for (const lang of languages) {
      const candidate = typeof value[lang] === 'string' ? value[lang].trim() : '';
      if (candidate) {
        result[lang] = candidate;
      }
    }
    if (Object.keys(result).length) {
      if (fallback && typeof fallback === 'object') {
        return { ...fallback, ...result };
      }
      return result;
    }
  }

  return fallback;
}

function hasLocalizedValue(value) {
  if (!value) return false;
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some((entry) => typeof entry === 'string' && entry.trim().length > 0);
  }
  return false;
}

function sanitizeParagraphs(value, fallback) {
  if (Array.isArray(value)) {
    const next = value.map((item) => sanitizeString(item)).filter(Boolean);
    return next.length ? next : fallback;
  }

  if (typeof value === 'string') {
    const parts = value
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.length ? parts : fallback;
  }

  return fallback;
}

function sanitizeStringList(value, fallback) {
  if (Array.isArray(value)) {
    const next = value.map((item) => sanitizeString(item)).filter(Boolean);
    return next.length ? next : fallback;
  }

  if (typeof value === 'string') {
    const parts = value
      .split(/\n+/)
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.length ? parts : fallback;
  }

  return fallback;
}

function sanitizeHistory(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .map((item) => ({
      year: sanitizeString(item?.year, ''),
      description: sanitizeString(item?.description, '')
    }))
    .filter((item) => item.year && item.description);
  return next.length ? next : fallback;
}

function sanitizeSignals(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .map((item) => ({
      term: sanitizeString(item?.term, ''),
      description: sanitizeString(item?.description, '')
    }))
    .filter((item) => item.term && item.description);
  return next.length ? next : fallback;
}

function sanitizeDetailCards(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const defaults = Array.isArray(fallback) ? fallback : [];
  const next = value
    .map((item, index) => {
      const defaultCard = defaults[index] || {};
      const title = sanitizeLocalizedField(item?.title, defaultCard.title || '');
      const text = sanitizeLocalizedField(item?.text, defaultCard.text || '');
      if (!hasLocalizedValue(title) || !hasLocalizedValue(text)) {
        return null;
      }
      return { title, text };
    })
    .filter(Boolean);
  return next.length ? next : defaults;
}

function sanitizeLocalizedStringList(value, fallback) {
  const languages = ['en', 'ja'];

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const result = {};
    for (const lang of languages) {
      const entries = sanitizeStringList(value[lang], []);
      if (entries.length) {
        result[lang] = entries;
      }
    }
    return Object.keys(result).length
      ? typeof fallback === 'object'
        ? { ...fallback, ...result }
        : result
      : fallback;
  }

  const entries = sanitizeStringList(value, []);
  if (!entries.length) {
    return fallback;
  }

  if (fallback && typeof fallback === 'object') {
    return { ...fallback, en: entries };
  }

  return entries;
}

function mergeChannelContent(payload) {
  const defaults = createChannelContentDefaults();
  if (!payload || typeof payload !== 'object') {
    return defaults;
  }

  const result = createChannelContentDefaults();

  const aboutDefaults = defaults.about;
  const aboutPayload = payload.about ?? {};
  result.about = {
    // Glassmorphic about page fields
    aboutTitle: sanitizeLocalizedField(aboutPayload.aboutTitle, aboutDefaults.aboutTitle),
    aboutSubtitle: sanitizeLocalizedField(aboutPayload.aboutSubtitle, aboutDefaults.aboutSubtitle),
    aboutContent: sanitizeLocalizedField(aboutPayload.aboutContent, aboutDefaults.aboutContent),
    aboutDetailCards: sanitizeDetailCards(aboutPayload.aboutDetailCards, aboutDefaults.aboutDetailCards),
    aboutTags: sanitizeLocalizedStringList(aboutPayload.aboutTags, aboutDefaults.aboutTags),
    
    // Keep legacy fields for compatibility
    title: sanitizeString(aboutPayload.title, aboutDefaults.title),
    lead: sanitizeString(aboutPayload.lead, aboutDefaults.lead),
    statusDate: sanitizeString(aboutPayload.statusDate, aboutDefaults.statusDate),
    statusLabel: sanitizeString(aboutPayload.statusLabel, aboutDefaults.statusLabel),
    tags: sanitizeString(aboutPayload.tags, aboutDefaults.tags),
    headline: sanitizeString(aboutPayload.headline, aboutDefaults.headline),
    summary: sanitizeString(aboutPayload.summary, aboutDefaults.summary),
    practiceVectors: sanitizeString(aboutPayload.practiceVectors, aboutDefaults.practiceVectors),
    currentCollaborators: sanitizeStringList(
      aboutPayload.currentCollaborators,
      aboutDefaults.currentCollaborators
    ),
    operatingPrinciples: sanitizeString(aboutPayload.operatingPrinciples, aboutDefaults.operatingPrinciples),
    overview: sanitizeParagraphs(aboutPayload.overview, aboutDefaults.overview),
    history: sanitizeHistory(aboutPayload.history, aboutDefaults.history),
    signals: sanitizeSignals(aboutPayload.signals, aboutDefaults.signals)
  };

  for (const key of ['projects', 'content', 'sounds', 'art']) {
    const defaultsChannel = defaults[key];
    const payloadChannel = payload[key] ?? {};
    result[key] = {
      title: sanitizeLocalizedField(payloadChannel.title, defaultsChannel.title),
      lead: sanitizeLocalizedField(payloadChannel.lead, defaultsChannel.lead)
    };
  }

  return result;
}

export async function readChannelContent() {
  await ensureFile();
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return mergeChannelContent(parsed);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return createChannelContentDefaults();
    }
    throw error;
  }
}

export async function writeChannelContent(payload) {
  const sanitized = mergeChannelContent(payload);
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, `${JSON.stringify(sanitized, null, 2)}\n`, 'utf8');
  return sanitized;
}
