import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry, readEntries } from '../../../lib/contentStore';
import { generateMetadata as getMetadata, generateViewportData } from '../../../lib/metadata';

export const dynamic = 'force-static';

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

export async function generateStaticParams() {
  const entries = await readEntries('sounds');
  return entries.map((entry) => ({ slug: entry.slug }));
}

export default async function SoundDetailPage({ params }) {
  const { slug } = await params;
  const entry = await readEntry('sounds', slug);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="sounds" entry={entry} />;
}
