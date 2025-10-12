import { readEntries } from '../../lib/contentStore';
import { readChannelContent } from '../../lib/channelContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';
import ProjectsContent from './ProjectsContent';

export const dynamic = 'force-dynamic';

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

  return <ProjectsContent entries={entries} hero={hero} />;
}
