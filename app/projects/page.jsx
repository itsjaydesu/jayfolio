import { readEntries } from '../../lib/contentStore';
import { readChannelContent } from '../../lib/channelContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';
import { hasAdminSession } from '../../lib/adminSession';
import ProjectsContent from './ProjectsContent';

// Use ISR with 1 hour revalidation for better performance
export const revalidate = 3600;

export async function generateMetadata() {
  return await getMetadata('projects');
}

export async function generateViewport() {
  return await generateViewportData('projects');
}

export default async function ProjectsPage() {
  const [entries, channelContent] = await Promise.all([
    readEntries('projects'),
    readChannelContent()
  ]);
  const hero = channelContent.projects;
  const isAdmin = await hasAdminSession();

  return <ProjectsContent entries={entries} hero={hero} isAdmin={isAdmin} />;
}
