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
        <div className="entry-grid">
          {entries.map((entry) => (
            <article key={entry.slug} className="entry-card">
              <div className="entry-card__meta">
                {entry.createdAt && <span>{formatDisplayDate(entry.createdAt)}</span>}
                {entry.tags?.length ? <span>{entry.tags.join(' • ')}</span> : null}
              </div>
              <h3>{entry.title}</h3>
              {entry.summary && <p>{entry.summary}</p>}
              <Link href={`/projects/${entry.slug}`} className="entry-card__link">
                View Project
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
