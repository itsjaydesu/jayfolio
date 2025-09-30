export default function AboutPage() {
  return (
    <section className="channel channel--about">
      <header className="channel__intro">
        <p className="channel__eyebrow">Profile Capsule</p>
        <h1 className="channel__title">Jay Desu</h1>
        <p className="channel__lead">
          Creative technologist guiding teams through ambient operating systems, tactile exhibition tooling, and
          cinematic web soundscapes. This dossier carries the studio ethos, collaborators, and signals shaping each
          commission.
        </p>
      </header>

      <article className="project-entry project-entry--about">
        <div className="project-entry__surface">
          <div className="project-entry__content">
            <time className="project-entry__date" dateTime="2024-11-01">
              CURRENT STATUS • AERIAL RESONANCE
            </time>

            <div className="project-entry__body">
              <p className="project-entry__tags">Designer • Composer • Systems Artist</p>
              <h2 className="project-entry__title">Sculpting Interfaces That Listen Back</h2>
              <p className="project-entry__summary">
                Jay prototypes responsive worlds where light, audio, and interface gestures share the same pulse. The
                practice involves building sensing rigs, translating data to lush WebGL canvases, and composing sound to
                steer spatial storytelling.
              </p>
            </div>

            <div className="project-entry__meta-grid">
              <section>
                <h3>Practice Vectors</h3>
                <p>
                  Cinematic UI systems, immersive spatial audio, sensor-driven choreography, and collaborative design
                  research. Each commission blends physical staging with realtime web tooling for performers and
                  exhibition teams.
                </p>
              </section>
              <section>
                <h3>Current Collaborators</h3>
                <ul>
                  <li>Signal Grid Lab — adaptive lighting for touring stages.</li>
                  <li>Archive Atlas — sonic archives with tactile playback consoles.</li>
                  <li>Field Lexicon Collective — language prototypes for future venues.</li>
                </ul>
              </section>
              <section>
                <h3>Operating Principles</h3>
                <p>
                  Lead with listening, prototype in the open, and let every surface emit warmth. Projects hinge on
                  calibrating atmosphere as carefully as code so collaborators feel invited into the signal.
                </p>
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
