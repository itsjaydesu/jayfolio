import { readEntries } from '../../lib/contentStore';
import { readChannelContent } from '../../lib/channelContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';
import SoundsContent from './SoundsContent';

export const dynamic = 'force-static';

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
  return <SoundsContent entries={entries} hero={hero} />;
}
