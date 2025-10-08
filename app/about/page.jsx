import { readChannelContent } from '../../lib/channelContent';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const { about } = await readChannelContent();

  return (
    <section className="channel channel--about">
      <header className="channel__intro">
        {about.title ? <h1 className="channel__title">{about.title}</h1> : null}
        <p className="channel__lead">{about.lead}</p>
      </header>

      <article className="project-entry project-entry--about">
        <div className="project-entry__surface">
          <div className="project-entry__content">
            <time className="project-entry__date" dateTime={about.statusDate}>
              {about.statusLabel}
            </time>

            <div className="project-entry__body">
              <p className="project-entry__tags">{about.tags}</p>
              <h2 className="project-entry__title">{about.headline}</h2>
              <p className="project-entry__summary">{about.summary}</p>
            </div>

            <div className="project-entry__meta-grid">
              <section>
                <h3>Practice Vectors</h3>
                <p>{about.practiceVectors}</p>
              </section>
              <section>
                <h3>Current Collaborators</h3>
                <ul>
                  {about.currentCollaborators.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Operating Principles</h3>
                <p>{about.operatingPrinciples}</p>
              </section>
            </div>

            <div className="about-capsule">
              <section className="about-capsule__panel about-capsule__panel--overview">
                <h3>General Overview</h3>
                {about.overview.map((paragraph, index) => (
                  <p key={`overview-${index}`}>{paragraph}</p>
                ))}
              </section>

              <section className="about-capsule__panel about-capsule__panel--history">
                <h3>Signal History</h3>
                <ul>
                  {about.history.map((entry) => (
                    <li key={entry.year}>
                      <span className="about-capsule__year">{entry.year}</span>
                      <p>{entry.description}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="about-capsule__panel about-capsule__panel--signals">
                <h3>Studio Signals</h3>
                <dl>
                  {about.signals.map((signal) => (
                    <div key={signal.term}>
                      <dt>{signal.term}</dt>
                      <dd>{signal.description}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </div>

          <figure className="project-entry__figure project-entry__figure--about" aria-hidden="true">
            <div className="project-entry__art project-entry__art--portrait" />
          </figure>
        </div>
      </article>
    </section>
  );
}
