import { promises as fs } from 'fs';
import path from 'path';
import { SITE_TEXT_DEFAULTS as DEFAULTS } from './siteTextDefaults';

const FILE_PATH = path.join(process.cwd(), 'content', 'site-text.json');

// defaults now sourced from shared client-safe module

async function ensureFile() {
  try {
    await fs.access(FILE_PATH);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    await fs.writeFile(FILE_PATH, `${JSON.stringify(DEFAULTS, null, 2)}\n`, 'utf8');
  }
}

export async function readSiteText() {
  await ensureFile();
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    // Defensive merge with defaults
    const brand = typeof parsed.brand === 'string' && parsed.brand.trim() ? parsed.brand : DEFAULTS.brand;
    const primaryMenu = Array.isArray(parsed.primaryMenu) && parsed.primaryMenu.length
      ? parsed.primaryMenu
      : DEFAULTS.primaryMenu;
    return { brand, primaryMenu };
  } catch (error) {
    if (error?.code === 'ENOENT') return DEFAULTS;
    throw error;
  }
}

export async function writeSiteText(payload) {
  const brand = typeof payload?.brand === 'string' && payload.brand.trim() ? payload.brand.trim() : DEFAULTS.brand;
  const items = Array.isArray(payload?.primaryMenu) ? payload.primaryMenu : [];
  const primaryMenu = items
    .map((item, idx) => ({
      id: String(item?.id ?? idx),
      label: String(item?.label ?? '').trim() || `Item ${idx + 1}`,
      route: String(item?.route ?? '').trim() || DEFAULTS.primaryMenu[idx]?.route || '/',
      description: String(item?.description ?? '').trim() || ''
    }))
    .filter((i) => !!i.route);

  const data = { brand, primaryMenu };
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return data;
}

// No client-defaults re-export here; import from lib/siteTextDefaults in client code
