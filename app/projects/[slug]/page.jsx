import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry } from '../../../lib/contentStore';
import { hasAdminSession } from '../../../lib/adminSession';
import { generateMetadata as getMetadata, generateViewportData } from '../../../lib/metadata';

// Use ISR with 1 hour revalidation for better performance
export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = await readEntry('projects', slug);
  
  if (!entry) {
    return {};
  }
  
  return await getMetadata('projects', entry, 'projects');
}

export async function generateViewport({ params }) {
  const { slug } = await params;
  const entry = await readEntry('projects', slug);
  if (!entry) {
    return await generateViewportData('projects');
  }
  return await generateViewportData('projects', entry, 'projects');
}

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;
  const [entry, isAdmin] = await Promise.all([
    readEntry('projects', slug),
    hasAdminSession()
  ]);
  if (!entry) {
    notFound();
  }

  return <EntryDetail type="projects" entry={entry} isAdmin={isAdmin} />;
}
