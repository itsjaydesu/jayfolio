import { readChannelContent } from '../../lib/channelContent';
import AboutContent from './AboutContent';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const { about } = await readChannelContent();

  return <AboutContent initialContent={about} />;
}
