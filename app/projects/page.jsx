import Link from 'next/link';
import { readEntries } from '../../lib/contentStore';
import { formatDisplayDate } from '../../lib/formatters';

export const dynamic = 'force-dynamic';

const PROJECT_TONES = {
  'signal-grid': 'cyan',
  'resonant-atlas': 'amber',
  'signal-bloom': 'magenta'
};

export default async function ProjectsPage() {
  const entries = await readEntries('projects');

  return (
    <section className="channel channel--projects">
      <header className="channel__intro">
        <p className="channel__eyebrow">Project Feed</p>
        <h1 className="channel__title">Selected Builds</h1>
        <p className="channel__lead">
          Explore interactive commissions, touring installations, and responsive tooling. Choose any dossier to open a
          full breakdown with media, credits, and embedded documentation.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="channel__empty">No project entries yet. Add one from the admin console.</p>
      ) : (
        <div className="channel__grid">
          {entries.map((entry, index) => {
            const tone = PROJECT_TONES[entry.slug] ?? 'neutral';
            return (
              <article key={entry.slug} className="project-entry" data-tone={tone}>
                <header className="project-entry__header">
                  <span className="project-entry__index">{String(index + 1).padStart(2, '0')}</span>
                  {entry.createdAt ? (
                    <time className="project-entry__date" dateTime={entry.createdAt}>
                      {formatDisplayDate(entry.createdAt)}
                    </time>
                  ) : null}
                </header>

                <figure className="project-entry__figure" aria-hidden="true">
                  <div className="project-entry__art" />
                </figure>

                <div className="project-entry__body">
                  {entry.tags?.length ? (
                    <p className="project-entry__tags">{entry.tags.join(' • ')}</p>
                  ) : null}
                  <h2 className="project-entry__title">{entry.title}</h2>
                  {entry.summary ? <p className="project-entry__summary">{entry.summary}</p> : null}
                </div>

                <footer className="project-entry__footer">
                  <Link href={`/projects/${entry.slug}`} className="project-entry__link">
                    Open dossier
                  </Link>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
