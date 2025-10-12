import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry } from '../../../lib/contentStore';
import { hasAdminSession } from '../../../lib/adminSession';
import { generateMetadata as getMetadata, generateViewportData } from '../../../lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = await readEntry('sounds', slug);
  
  if (!entry) {
    return {};
  }
  
  return await getMetadata('sounds', entry, 'sounds');
}

export async function generateViewport({ params }) {
  const { slug } = await params;
  const entry = await readEntry('sounds', slug);
  if (!entry) {
    return await generateViewportData('sounds');
  }
  return await generateViewportData('sounds', entry, 'sounds');
}

export default async function SoundDetailPage({ params }) {
  const { slug } = await params;
  const [entry, isAdmin] = await Promise.all([
    readEntry('sounds', slug),
    hasAdminSession()
  ]);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="sounds" entry={entry} isAdmin={isAdmin} />;
}
