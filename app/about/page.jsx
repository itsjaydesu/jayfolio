import { readChannelContent } from '../../lib/channelContent';
import AboutContent from './AboutContent';
import { generateMetadata as getMetadata } from '../../lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return await getMetadata('about');
}

export default async function AboutPage() {
  const { about } = await readChannelContent();

  return <AboutContent initialContent={about} />;
}
