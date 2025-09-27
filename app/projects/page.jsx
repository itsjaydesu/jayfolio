import Link from 'next/link';
import { readEntries } from '../../lib/contentStore';
import { formatDisplayDate } from '../../lib/formatters';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const entries = await readEntries('projects');

  return (
    <div className="section-screen">
      <header className="section-screen__header">
        <span className="badge">Project Feed</span>
        <h2>Selected Builds</h2>
        <p>
          Explore interactive commissions, touring installations, and responsive tooling. Choose any dossier to open a
          full-screen breakdown with media, credits, and embedded documentation.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="section-empty">No project entries yet. Add one from the admin console.</p>
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
              <Link href={`/projects/${entry.slug}`} className="entry-ledger__cta">
                View Project
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
