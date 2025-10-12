import { readEntries } from '../../lib/contentStore';
import { readChannelContent } from '../../lib/channelContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';
import { hasAdminSession } from '../../lib/adminSession';
import WordsContent from './WordsContent';

// Use ISR with 1 hour revalidation for better performance
export const revalidate = 3600;

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
  const isAdmin = await hasAdminSession();

  return <WordsContent entries={entries} hero={hero} isAdmin={isAdmin} />;
}
