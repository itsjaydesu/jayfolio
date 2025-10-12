import { readEntries } from '../../lib/contentStore';
import { readChannelContent } from '../../lib/channelContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';
import { hasAdminSession } from '../../lib/adminSession';
import SoundsContent from './SoundsContent';

// Use ISR with 1 hour revalidation for better performance
export const revalidate = 3600;

export async function generateMetadata() {
  return await getMetadata('sounds');
}

export async function generateViewport() {
  return await generateViewportData('sounds');
}

export default async function SoundsPage() {
  const [entries, channelContent] = await Promise.all([
    readEntries('sounds'),
    readChannelContent()
  ]);
  const hero = channelContent.sounds;
  const isAdmin = await hasAdminSession();

  return <SoundsContent entries={entries} hero={hero} isAdmin={isAdmin} />;
}
