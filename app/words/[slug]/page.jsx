import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry } from '../../../lib/contentStore';

export const dynamic = 'force-dynamic';

export default async function WordDetailPage({ params }) {
  const { slug } = await params;
  const entry = await readEntry('words', slug);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="words" entry={entry} />;
}
