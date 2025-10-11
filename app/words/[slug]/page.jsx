import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry } from '../../../lib/contentStore';
import { generateMetadata as getMetadata, generateViewportData } from '../../../lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = await readEntry('words', slug);
  
  if (!entry) {
    return {};
  }
  
  return await getMetadata('words', entry, 'words');
}

export async function generateViewport({ params }) {
  const { slug } = await params;
  const entry = await readEntry('words', slug);
  if (!entry) {
    return await generateViewportData('words');
  }
  return await generateViewportData('words', entry, 'words');
}

export default async function WordDetailPage({ params }) {
  const { slug } = await params;
  const entry = await readEntry('words', slug);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="words" entry={entry} />;
}
