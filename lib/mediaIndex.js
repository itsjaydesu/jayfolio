import { promises as fs } from 'fs';
import path from 'path';

const FILE_PATH = path.join(process.cwd(), 'content', 'media-index.json');

async function ensureFile() {
  try {
    await fs.access(FILE_PATH);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    await fs.writeFile(FILE_PATH, `${JSON.stringify({ files: [] }, null, 2)}\n`, 'utf8');
  }
}

export async function readMediaIndex() {
  await ensureFile();
  const raw = await fs.readFile(FILE_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const files = Array.isArray(parsed?.files) ? parsed.files : [];
  return { files };
}

export async function appendMediaFile(file) {
  const { files } = await readMediaIndex();
  const filtered = files.filter((f) => f.pathname !== file.pathname);
  filtered.unshift({ ...file, createdAt: file.createdAt || new Date().toISOString() });
  await fs.writeFile(FILE_PATH, `${JSON.stringify({ files: filtered }, null, 2)}\n`, 'utf8');
  return { files: filtered };
}

export async function updateMediaFile(pathname, patch) {
  const { files } = await readMediaIndex();
  const next = files.map((f) => (f.pathname === pathname ? { ...f, ...patch } : f));
  await fs.writeFile(FILE_PATH, `${JSON.stringify({ files: next }, null, 2)}\n`, 'utf8');
  return next.find((f) => f.pathname === pathname) || null;
}

export async function removeMediaFile(pathname) {
  const { files } = await readMediaIndex();
  const next = files.filter((f) => f.pathname !== pathname);
  await fs.writeFile(FILE_PATH, `${JSON.stringify({ files: next }, null, 2)}\n`, 'utf8');
  return { removed: next.length !== files.length };
}
