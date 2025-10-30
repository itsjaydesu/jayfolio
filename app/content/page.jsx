import { readEntries } from '../../lib/contentStore';
import { readChannelContent } from '../../lib/channelContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';
import ContentContent from './ContentContent';

export const dynamic = 'force-static';

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
  const publishedEntries = entries.filter((entry) => entry?.status === 'published');
  return <ContentContent entries={publishedEntries} hero={hero} />;
}
