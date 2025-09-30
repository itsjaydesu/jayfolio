import Link from 'next/link';
import EntryReturnFocus from '../../components/EntryReturnFocus';
import { readEntries } from '../../lib/contentStore';
import { formatDisplayDate } from '../../lib/formatters';

export const dynamic = 'force-dynamic';

const WORD_TONES = {
  'slow-scan-memo': 'violet',
  'field-lexicon': 'teal',
  'dispatch-09': 'magenta'
};

export default async function WordsPage() {
  const entries = await readEntries('words');

  return (
    <section className="channel channel--words">
      <header className="channel__intro">
        <p className="channel__eyebrow">Editorial Log</p>
        <h1 className="channel__title">Words &amp; Essays</h1>
        <p className="channel__lead">
          Essays, dispatches, and glossaries documenting the studio process. Open any log to read the full rich-text
          entry with embedded media and references.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="channel__empty">No editorial entries yet. Draft one in the admin console.</p>
      ) : (
        <EntryReturnFocus type="words">
          <div className="channel__grid">
            {entries.map((entry) => {
              const tone = WORD_TONES[entry.slug] ?? 'neutral';
              return (
                <article
                  key={entry.slug}
                  className="project-entry project-entry--words"
                  data-tone={tone}
                  data-entry-slug={entry.slug}
                >
                  <Link
                    href={`/words/${entry.slug}`}
                    className="project-entry__surface"
                    aria-label={`Open essay ${entry.title}`}
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

                      <span className="project-entry__cta">Open log ↗</span>
                    </div>

                    <figure className="project-entry__figure project-entry__figure--words" aria-hidden="true">
                      <div className="project-entry__art" />
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
