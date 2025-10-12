import { readEntries } from '../../lib/contentStore';
import { readChannelContent } from '../../lib/channelContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';
import WordsContent from './WordsContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return await getMetadata('words');
}

export async function generateViewport() {
  return await generateViewportData('words');
}

export default async function WordsPage() {
  const [entries, channelContent] = await Promise.all([
    readEntries('words'),
    readChannelContent()
  ]);
  const hero = channelContent.words;

  return <WordsContent entries={entries} hero={hero} />;
}
