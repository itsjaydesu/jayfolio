import { readChannelContent } from '../../lib/channelContent';
import AboutContent from './AboutContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';

// Use ISR with 1 hour revalidation for better performance
export const revalidate = 3600;

export async function generateMetadata() {
  return await getMetadata('about');
}

export async function generateViewport() {
  return await generateViewportData('about');
}

export default async function AboutPage() {
  const { about } = await readChannelContent();

  return <AboutContent initialContent={about} />;
}
