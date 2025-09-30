import Link from 'next/link';
import EntryReturnFocus from '../../components/EntryReturnFocus';
import { readEntries } from '../../lib/contentStore';
import { formatDisplayDate } from '../../lib/formatters';

export const dynamic = 'force-dynamic';

const SOUND_TONES = {
  'chromatic-drones': 'violet',
  'pulse-sketches': 'amber',
  'archive-reworks': 'teal'
};

export default async function SoundsPage() {
  const entries = await readEntries('sounds');

  return (
    <section className="channel channel--sounds">
      <header className="channel__intro">
        <p className="channel__eyebrow">Audio Vault</p>
        <h1 className="channel__title">Sound Experiments</h1>
        <p className="channel__lead">
          Loops, drone suites, and live performance sketches. Dive into each archive entry to access liner notes and
          embedded media players.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="channel__empty">No sound entries yet. Upload one via the admin console.</p>
      ) : (
        <EntryReturnFocus type="sounds">
          <div className="channel__grid">
            {entries.map((entry, index) => {
              const tone = SOUND_TONES[entry.slug] ?? 'neutral';
              return (
                <article
                  key={entry.slug}
                  className="channel-card channel-card--sound"
                  data-tone={tone}
                  data-entry-slug={entry.slug}
                >
                  <div className="channel-card__meta">
                    <span className="channel-card__index">{String(index + 1).padStart(2, '0')}</span>
                    {entry.createdAt ? (
                      <time className="channel-card__date" dateTime={entry.createdAt}>
                        {formatDisplayDate(entry.createdAt)}
                      </time>
                    ) : null}
                    {entry.tags?.length ? <p className="channel-card__tags">{entry.tags.join(' • ')}</p> : null}
                  </div>

                  <div className="channel-card__body">
                    <figure className="channel-card__figure" aria-hidden="true">
                      <div className="channel-card__wave" />
                    </figure>
                    <h2 className="channel-card__title">{entry.title}</h2>
                    {entry.summary ? <p className="channel-card__summary">{entry.summary}</p> : null}
                    <Link href={`/sounds/${entry.slug}`} className="channel-card__link">
                      Listen in
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </EntryReturnFocus>
      )}
    </section>
  );
}
