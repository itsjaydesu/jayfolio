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
        <div className="entry-grid">
          {entries.map((entry) => (
            <article key={entry.slug} className="entry-card">
              <div className="entry-card__meta">
                {entry.createdAt && <span>{formatDisplayDate(entry.createdAt)}</span>}
                {entry.tags?.length ? <span>{entry.tags.join(' • ')}</span> : null}
              </div>
              <h3>{entry.title}</h3>
              {entry.summary && <p>{entry.summary}</p>}
              <Link href={`/sounds/${entry.slug}`} className="entry-card__link">
                Open Archive
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
