import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry, readEntries } from '../../../lib/contentStore';
import { generateMetadata as getMetadata, generateViewportData } from '../../../lib/metadata';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = await readEntry('content', slug);
  
  if (!entry || entry.status !== 'published') {
    return {};
  }
  
  return await getMetadata('content', entry, 'content');
}

export async function generateViewport({ params }) {
  const { slug } = await params;
  const entry = await readEntry('content', slug);
  if (!entry || entry.status !== 'published') {
    return await generateViewportData('content');
  }
  return await generateViewportData('content', entry, 'content');
}

export async function generateStaticParams() {
  const entries = await readEntries('content');
  return entries
    .filter((entry) => entry?.status === 'published')
    .map((entry) => ({ slug: entry.slug }));
}

export default async function ContentDetailPage({ params }) {
  const { slug } = await params;
  const entry = await readEntry('content', slug);
  if (!entry || entry.status !== 'published') {
    notFound();
  }

  return <EntryDetail type="content" entry={entry} />;
}
