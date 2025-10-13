import { readEntries } from '../../lib/contentStore';
import { readChannelContent } from '../../lib/channelContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';
import { hasAdminSession } from '../../lib/adminSession';
import ArtContent from './ArtContent';

// Use ISR with 1 hour revalidation for better performance
export const revalidate = 3600;

export async function generateMetadata() {
  return await getMetadata('art');
}

export async function generateViewport() {
  return await generateViewportData('art');
}

export default async function ArtPage() {
  const [entries, channelContent] = await Promise.all([
    readEntries('art'),
    readChannelContent()
  ]);
  const hero = channelContent.art;
  const isAdmin = await hasAdminSession();

  return <ArtContent entries={entries} hero={hero} isAdmin={isAdmin} />;
}
