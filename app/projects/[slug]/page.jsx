import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry } from '../../../lib/contentStore';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }) {
  const entry = await readEntry('projects', params.slug);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="projects" entry={entry} />;
}
