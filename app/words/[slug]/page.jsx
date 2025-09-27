import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry } from '../../../lib/contentStore';

export const dynamic = 'force-dynamic';

export default async function WordDetailPage({ params }) {
  const entry = await readEntry('words', params.slug);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="words" entry={entry} />;
}
