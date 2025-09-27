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
        <ul className="entry-ledger">
          {entries.map((entry) => (
            <li key={entry.slug} className="entry-ledger__item">
              <div className="entry-ledger__marker" aria-hidden="true" />
              <div className="entry-ledger__meta">
                {entry.createdAt && <span className="entry-ledger__date">{formatDisplayDate(entry.createdAt)}</span>}
                {entry.tags?.length ? <span className="entry-ledger__tags">{entry.tags.join(' • ')}</span> : null}
              </div>
              <div className="entry-ledger__body">
                <h3>{entry.title}</h3>
                {entry.summary && <p>{entry.summary}</p>}
              </div>
              <Link href={`/words/${entry.slug}`} className="entry-ledger__cta">
                Read Entry
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
