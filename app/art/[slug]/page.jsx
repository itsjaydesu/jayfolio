import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry } from '../../../lib/contentStore';
import { hasAdminSession } from '../../../lib/adminSession';
import { generateMetadata as getMetadata, generateViewportData } from '../../../lib/metadata';

// Use ISR with 1 hour revalidation for better performance
export const revalidate = 3600;

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

export default async function ArtDetailPage({ params }) {
  const { slug } = await params;
  const [entry, isAdmin] = await Promise.all([
    readEntry('art', slug),
    hasAdminSession()
  ]);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="art" entry={entry} isAdmin={isAdmin} />;
}
