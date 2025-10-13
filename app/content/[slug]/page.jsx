import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry } from '../../../lib/contentStore';
import { hasAdminSession } from '../../../lib/adminSession';
import { generateMetadata as getMetadata, generateViewportData } from '../../../lib/metadata';

// Use ISR with 1 hour revalidation for better performance
export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = await readEntry('content', slug);
  
  if (!entry) {
    return {};
  }
  
  return await getMetadata('content', entry, 'content');
}

export async function generateViewport({ params }) {
  const { slug } = await params;
  const entry = await readEntry('content', slug);
  if (!entry) {
    return await generateViewportData('content');
  }
  return await generateViewportData('content', entry, 'content');
}

export default async function ContentDetailPage({ params }) {
  const { slug } = await params;
  const [entry, isAdmin] = await Promise.all([
    readEntry('content', slug),
    hasAdminSession()
  ]);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="content" entry={entry} isAdmin={isAdmin} />;
}
