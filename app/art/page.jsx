import Link from 'next/link';
import EntryReturnFocus from '../../components/EntryReturnFocus';
import { readEntries } from '../../lib/contentStore';
import { formatDisplayDate } from '../../lib/formatters';
import { readChannelContent } from '../../lib/channelContent';
import { generateMetadata as getMetadata, generateViewportData } from '../../lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return await getMetadata('art');
}

export async function generateViewport() {
  return await generateViewportData('art');
}

const ART_TONES = {
  'dot-field': 'violet'
};

export default async function ArtPage() {
  const [entries, channelContent] = await Promise.all([
    readEntries('art'),
    readChannelContent()
  ]);
  const hero = channelContent.art;

  return (
    <section className="channel channel--art">
      <header className="channel__intro">
        <h1 className="channel__title">{hero.title}</h1>
        <p className="channel__lead">{hero.lead}</p>
      </header>

      {entries.length === 0 ? (
        <p className="channel__empty">No art entries yet. Upload one via the admin console.</p>
      ) : (
        <EntryReturnFocus type="art">
          <div className="channel__grid">
            {entries.map((entry) => {
              const tone = ART_TONES[entry.slug] ?? 'neutral';
              return (
                <article
                  key={entry.slug}
                  className="project-entry project-entry--art"
                  data-tone={tone}
                  data-entry-slug={entry.slug}
                >
                  <Link
                    href={`/art/${entry.slug}`}
                    className="project-entry__surface"
                    aria-label={`Open art study ${entry.title}`}
                  >
                    <div className="project-entry__content">
                      {entry.createdAt ? (
                        <time className="project-entry__date" dateTime={entry.createdAt}>
                          {formatDisplayDate(entry.createdAt).toUpperCase()}
                        </time>
                      ) : null}

                      <div className="project-entry__body">
                        {entry.tags?.length ? (
                          <p className="project-entry__tags">{entry.tags.join(' • ')}</p>
                        ) : null}
                        <h2 className="project-entry__title">{entry.title}</h2>
                        {entry.summary ? <p className="project-entry__summary">{entry.summary}</p> : null}
                      </div>

                      <span className="project-entry__cta">View study ↗</span>
                    </div>

                    <figure className="project-entry__figure project-entry__figure--art" aria-hidden="true">
                      <div className="project-entry__art">
                        <span className="project-entry__signal" />
                      </div>
                    </figure>
                  </Link>
                </article>
              );
            })}
          </div>
        </EntryReturnFocus>
      )}
    </section>
  );
}
