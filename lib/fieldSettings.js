import { promises as fs } from 'fs';
import path from 'path';
import { FIELD_DEFAULT_BASE, FIELD_DEFAULT_INFLUENCES } from './fieldDefaults';

const SETTINGS_PATH = path.join(process.cwd(), 'content', 'field-settings.json');

function mergeBase(base = {}) {
  return {
    ...FIELD_DEFAULT_BASE,
    ...base
  };
}

function mergeInfluences(influences = {}) {
  const merged = {};
  for (const [key, defaults] of Object.entries(FIELD_DEFAULT_INFLUENCES)) {
    merged[key] = {
      ...defaults,
      ...(influences?.[key] ?? {})
    };
  }
  return merged;
}

async function ensureFile() {
  try {
    await fs.access(SETTINGS_PATH);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const payload = {
        base: FIELD_DEFAULT_BASE,
        influences: FIELD_DEFAULT_INFLUENCES
      };
      await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
      await fs.writeFile(SETTINGS_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    } else {
      throw error;
    }
  }
}

export async function readFieldSettings() {
  await ensureFile();
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      base: mergeBase(parsed.base),
      influences: mergeInfluences(parsed.influences)
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        base: FIELD_DEFAULT_BASE,
        influences: FIELD_DEFAULT_INFLUENCES
      };
    }
    throw error;
  }
}

export async function writeFieldSettings(settings) {
  const base = mergeBase(settings?.base);
  const influences = mergeInfluences(settings?.influences);
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  const payload = { base, influences };
  await fs.writeFile(SETTINGS_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}
