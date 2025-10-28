import { readEntries } from '../../lib/contentStore';
import { readChannelContent } from '../../lib/channelContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';
import ArtContent from './ArtContent';

export const dynamic = 'force-static';

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
  return <ArtContent entries={entries} hero={hero} />;
}
