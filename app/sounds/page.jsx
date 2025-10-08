import Link from 'next/link';
import EntryReturnFocus from '../../components/EntryReturnFocus';
import { readEntries } from '../../lib/contentStore';
import { formatDisplayDate } from '../../lib/formatters';
import { readChannelContent } from '../../lib/channelContent';

export const dynamic = 'force-dynamic';

const SOUND_TONES = {
  'chromatic-drones': 'violet',
  'pulse-sketches': 'amber',
  'archive-reworks': 'teal'
};

export default async function SoundsPage() {
  const [entries, channelContent] = await Promise.all([
    readEntries('sounds'),
    readChannelContent()
  ]);
  const hero = channelContent.sounds;

  return (
    <section className="channel channel--sounds">
      <header className="channel__intro">
        <h1 className="channel__title">{hero.title}</h1>
        <p className="channel__lead">{hero.lead}</p>
      </header>

      {entries.length === 0 ? (
        <p className="channel__empty">No sound entries yet. Upload one via the admin console.</p>
      ) : (
        <EntryReturnFocus type="sounds">
          <div className="channel__grid">
            {entries.map((entry) => {
              const tone = SOUND_TONES[entry.slug] ?? 'neutral';
              return (
                <article
                  key={entry.slug}
                  className="project-entry project-entry--sounds"
                  data-tone={tone}
                  data-entry-slug={entry.slug}
                >
                  <Link
                    href={`/sounds/${entry.slug}`}
                    className="project-entry__surface"
                    aria-label={`Open sound archive ${entry.title}`}
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

                      <span className="project-entry__cta">Open archive ↗</span>
                    </div>

                    <figure className="project-entry__figure project-entry__figure--sounds" aria-hidden="true">
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
