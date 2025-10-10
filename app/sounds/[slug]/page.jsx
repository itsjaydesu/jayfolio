import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry } from '../../../lib/contentStore';
import { generateMetadata as getMetadata } from '../../../lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = await readEntry('sounds', slug);
  
  if (!entry) {
    return {};
  }
  
  return await getMetadata('sounds', entry, 'sounds');
}

export default async function SoundDetailPage({ params }) {
  const { slug } = await params;
  const entry = await readEntry('sounds', slug);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="sounds" entry={entry} />;
}
