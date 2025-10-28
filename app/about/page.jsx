import { readChannelContent } from '../../lib/channelContent';
import AboutContent from './AboutContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';

export const dynamic = 'force-static';

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
