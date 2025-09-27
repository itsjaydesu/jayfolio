export default function ProjectsPage() {
  return (
    <>
      <span className="badge">Project Feed</span>
      <h2>Selected Builds</h2>
      <p>
        Each entry here can expand into imagery, credits, and the interactive story behind the work. For now we stage a
        trio of placeholders outlining the tone, collaborators, and medium.
      </p>
      <ul>
        <li>Project Alpha — immersive WebGL wavefield powering a launch event, adaptive to live tempo shifts.</li>
        <li>Signal Bloom — modular installation linking light pillars to sensor-driven melodic gestures.</li>
        <li>Resonant Atlas — browser-based instrument that orchestrates field recordings with gestural input.</li>
      </ul>
      <section>
        <h3>Next In Queue</h3>
        <p>
          Queue descriptions for works-in-progress: prototypes for spatial browsers, collaborative instruments, or
          real-time typography experiments. Use this slot for teasers or calls for collaborators.
        </p>
      </section>
    </>
  );
}
