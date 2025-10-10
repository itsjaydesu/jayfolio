import { readChannelContent } from '../../lib/channelContent';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const { about } = await readChannelContent();

  return (
    <section className="channel channel--about channel--simplified">
      <div className="channel__container">
        {about.aboutTitle ? <h1 className="channel__title">{about.aboutTitle}</h1> : <h1 className="channel__title">About</h1>}
        <div className="channel__content">
          <p className="channel__text">{about.aboutContent || about.lead}</p>
        </div>
      </div>
    </section>
  );
}
