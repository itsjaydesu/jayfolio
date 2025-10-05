export default function AboutPage() {
  return (
    <section className="channel channel--about">
      <header className="channel__intro">
        <p className="channel__eyebrow">Profile Capsule</p>
        <h1 className="channel__title">Jay Winder</h1>
        <p className="channel__lead">
          Creative technologist guiding teams through ambient operating systems, tactile exhibition tooling, and
          cinematic web soundscapes. This dossier carries the studio ethos, collaborators, and signals shaping each
          commission. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua.
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
                steer spatial storytelling. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua.
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

            <div className="about-capsule">
              <section className="about-capsule__panel about-capsule__panel--overview">
                <h3>General Overview</h3>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Jay Winder weaves tactile computing, kinetic
                  lighting, and sonic cartography into experiential systems that feel warmly sentient. Suspendisse
                  potenti. Vestibulum vitae arcu eget sapien scelerisque aliquet quis sed justo. Maecenas egestas lacus
                  eu vulputate bibendum, gravida risus euismod.
                </p>
                <p>
                  Phasellus euismod mi a nibh hendrerit, sit amet dapibus ipsum faucibus. Pellentesque in tempor nibh.
                  Integer malesuada lorem ipsum dolor sit amet technologist auctor, malesuada augue quis, fermentum
                  magna. Curabitur blandit, metus ac iaculis vulputate, est magna luctus risus, vitae posuere elit
                  lectus quis augue.
                </p>
              </section>

              <section className="about-capsule__panel about-capsule__panel--history">
                <h3>Signal History</h3>
                <ul>
                  <li>
                    <span className="about-capsule__year">2024</span>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Jay Winder launched a resonant lab for
                      touring installations, experimenting with ambient operating systems that listen as performers move.
                    </p>
                  </li>
                  <li>
                    <span className="about-capsule__year">2021</span>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Crafted WebGL observatories for civic
                      archives, translating sensor data into luminous sonic gradients for public play.
                    </p>
                  </li>
                  <li>
                    <span className="about-capsule__year">2017</span>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Embedded with research theaters to build
                      responsive stage controls that blend composer gestures with adaptive lighting.
                    </p>
                  </li>
                  <li>
                    <span className="about-capsule__year">2012</span>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Began as a systems artist translating
                      modular synthesis workflows into interactive exhibition tooling and haptic audio consoles.
                    </p>
                  </li>
                </ul>
              </section>

              <section className="about-capsule__panel about-capsule__panel--signals">
                <h3>Studio Signals</h3>
                <dl>
                  <div>
                    <dt>Primary Mediums</dt>
                    <dd>Lorem ipsum interfaces, ambient OS prototypes, spatial sound choreography.</dd>
                  </div>
                  <div>
                    <dt>Operating Doctrine</dt>
                    <dd>
                      Lorem ipsum dolor sit amet technologist dictum—craft the atmosphere, prototype with hospitality,
                      and release tools that invite co-authorship.
                    </dd>
                  </div>
                  <div>
                    <dt>Open Invitations</dt>
                    <dd>
                      Lorem ipsum residencies, collaborative field recordings, and sensor-driven storytelling research.
                    </dd>
                  </div>
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
