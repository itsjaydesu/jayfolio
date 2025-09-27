import Link from 'next/link';
import { readEntries } from '../../lib/contentStore';
import { formatDisplayDate } from '../../lib/formatters';

export const dynamic = 'force-dynamic';

export default async function SoundsPage() {
  const entries = await readEntries('sounds');

  return (
    <div className="section-screen">
      <header className="section-screen__header">
        <span className="badge">Audio Vault</span>
        <h2>Sound Experiments</h2>
        <p>
          Loops, drone suites, and live performance sketches. Dive into each archive entry to access liner notes and
          embedded media players.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="section-empty">No sound entries yet. Upload one via the admin console.</p>
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
              <Link href={`/sounds/${entry.slug}`} className="entry-ledger__cta">
                Open Archive
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
