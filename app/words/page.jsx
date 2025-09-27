import Link from 'next/link';
import { readEntries } from '../../lib/contentStore';
import { formatDisplayDate } from '../../lib/formatters';

export const dynamic = 'force-dynamic';

export default async function WordsPage() {
  const entries = await readEntries('words');

  return (
    <div className="section-screen">
      <header className="section-screen__header">
        <span className="badge">Editorial Log</span>
        <h2>Words & Essays</h2>
        <p>
          Essays, dispatches, and glossaries documenting the studio process. Open any log to read the full rich-text
          entry with embedded media and references.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="section-empty">No editorial entries yet. Draft one in the admin console.</p>
      ) : (
        <div className="entry-grid">
          {entries.map((entry) => (
            <article key={entry.slug} className="entry-card">
              <div className="entry-card__meta">
                {entry.createdAt && <span>{formatDisplayDate(entry.createdAt)}</span>}
                {entry.tags?.length ? <span>{entry.tags.join(' • ')}</span> : null}
              </div>
              <h3>{entry.title}</h3>
              {entry.summary && <p>{entry.summary}</p>}
              <Link href={`/words/${entry.slug}`} className="entry-card__link">
                Read Entry
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
