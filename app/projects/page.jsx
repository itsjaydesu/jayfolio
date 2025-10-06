import Image from 'next/image';
import Link from 'next/link';
import EntryReturnFocus from '../../components/EntryReturnFocus';
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
        <EntryReturnFocus type="projects">
          <div className="channel__grid">
            {entries.map((entry) => {
              const tone = PROJECT_TONES[entry.slug] ?? 'neutral';
              const href = `/projects/${entry.slug}`;
              return (
                <article
                  key={entry.slug}
                  className="project-entry"
                  data-tone={tone}
                  data-entry-slug={entry.slug}
                >
                  <Link
                    href={href}
                    className="project-entry__surface"
                    aria-label={`Open dossier for ${entry.title}`}
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

                      <span className="project-entry__cta">Open dossier ↗</span>
                    </div>

                    <figure className="project-entry__figure">
                      {entry.coverImage?.url ? (
                        <Image
                          src={entry.coverImage.url}
                          alt={entry.coverImage.alt || `${entry.title} cover image`}
                          fill
                          sizes="(max-width: 900px) 100vw, 420px"
                          className="project-entry__image"
                        />
                      ) : (
                        <div className="project-entry__art" aria-hidden="true" />
                      )}
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
