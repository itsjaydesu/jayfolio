import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry, readEntries } from '../../../lib/contentStore';
import { generateMetadata as getMetadata, generateViewportData } from '../../../lib/metadata';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = await readEntry('art', slug);

  if (!entry) {
    return {};
  }

  return await getMetadata('art', entry, 'art');
}

export async function generateViewport({ params }) {
  const { slug } = await params;
  const entry = await readEntry('art', slug);
  if (!entry) {
    return await generateViewportData('art');
  }
  return await generateViewportData('art', entry, 'art');
}

export async function generateStaticParams() {
  const entries = await readEntries('art');
  return entries.map((entry) => ({ slug: entry.slug }));
}

export default async function ArtDetailPage({ params }) {
  const { slug } = await params;
  const entry = await readEntry('art', slug);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="art" entry={entry} />;
}
