import { notFound } from 'next/navigation';
import EntryDetail from '../../../components/EntryDetail';
import { readEntry, readEntries } from '../../../lib/contentStore';
import { generateMetadata as getMetadata, generateViewportData } from '../../../lib/metadata';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = await readEntry('projects', slug);
  
  if (!entry || entry.status !== 'published') {
    return {};
  }
  
  return await getMetadata('projects', entry, 'projects');
}

export async function generateViewport({ params }) {
  const { slug } = await params;
  const entry = await readEntry('projects', slug);
  if (!entry || entry.status !== 'published') {
    return await generateViewportData('projects');
  }
  return await generateViewportData('projects', entry, 'projects');
}

export async function generateStaticParams() {
  const entries = await readEntries('projects');
  return entries
    .filter((entry) => entry?.status === 'published')
    .map((entry) => ({ slug: entry.slug }));
}

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;
  const entry = await readEntry('projects', slug);
  if (!entry || entry.status !== 'published') {
    notFound();
  }

  return <EntryDetail type="projects" entry={entry} />;
}
