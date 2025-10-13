import { readEntries } from '../../lib/contentStore';
import { readChannelContent } from '../../lib/channelContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';
import { hasAdminSession } from '../../lib/adminSession';
import ContentContent from './ContentContent';

// Use ISR with 1 hour revalidation for better performance
export const revalidate = 3600;

export async function generateMetadata() {
  return await getMetadata('content');
}

export async function generateViewport() {
  return await generateViewportData('content');
}

export default async function ContentPage() {
  const [entries, channelContent] = await Promise.all([
    readEntries('content'),
    readChannelContent()
  ]);
  const hero = channelContent.content || channelContent.words; // Fallback to words for compatibility
  const isAdmin = await hasAdminSession();

  return <ContentContent entries={entries} hero={hero} isAdmin={isAdmin} />;
}
