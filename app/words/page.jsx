import Link from 'next/link';
import { readEntries } from '../../lib/contentStore';
import { formatDisplayDate } from '../../lib/formatters';

export const dynamic = 'force-dynamic';

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
        <div className="channel__grid">
          {entries.map((entry, index) => (
            <article key={entry.slug} className="channel-card">
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
                <h2 className="channel-card__title">{entry.title}</h2>
                {entry.summary ? <p className="channel-card__summary">{entry.summary}</p> : null}
                <Link href={`/words/${entry.slug}`} className="channel-card__link">
                  Read essay
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
