import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry } from '../../../lib/contentStore';

export const dynamic = 'force-dynamic';

export default async function SoundDetailPage({ params }) {
  const { slug } = await params;
  const entry = await readEntry('sounds', slug);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="sounds" entry={entry} />;
}
