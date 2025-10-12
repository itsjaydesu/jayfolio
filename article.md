# The Dot Field's Hidden Choreography

Imagine stepping into a planetarium where the constellations ignore the ceiling and instead orbit around you, whispering every tweak in gravity through graceful motion. It’s equal parts murmuration of starlings and midnight fountain show, and that’s the feeling the homepage’s dot field aims to deliver. It is a performance that blends shader math, responsive choreography, and a surprising amount of empathy for the viewer—from the first pixel that fades in to the last ripple that bows out.

## The Cast Behind the Curtain

- **SceneCanvas** (`components/SceneCanvas.jsx`) is the stage manager and lighting designer rolled into one. It creates a 70 × 70 lattice of points (4,900 total) spaced 90 units apart, then hands their motion to a custom `THREE.Points` shader. Each dot draws itself as a soft disc using `gl_PointCoord`, additive blending, and uniforms for brightness and size so the field gleams without hard edges.
- **FIELD_DEFAULT_BASE** (`lib/fieldDefaults.js`) establishes the “house band” settings: wave frequencies, ripple decay, swirl strength, point size, fog density, and more. These values are the baseline mood the animation eases back to whenever an effect finishes.
- **FIELD_DEFAULT_INFLUENCES** tweaks that baseline per channel. Navigating to `/projects` or `/sounds` doesn’t swap the animation wholesale; it simply nudges parameters so the grid feels tailored to the content.
- **SceneCanvas` state machine** keeps track of pointer energy, queued ripples, mode-specific data, and even mobile vs. desktop camera profiles. Think of it as a conductor’s score that knows which section should come in next, or a theme park ride manual that ensures every seat belts in at the right moment.

## How the Motion Flows

At its core, the dot field layers three sinusoids: one that marches along the X axis, another offset along Y, and a radial swirl that wraps the grid into gentle spirals. This base motion gives the field a tide-like cadence—part ocean swell, part breathing dragon. On top of that:

- Pointer movement is translated into “world” coordinates and stored with a live energy meter. Sudden moves spike the energy; inactivity lets it decay (`pointer.energy = pointer.energy * 0.92 - 0.002`), so the dots never lurch when you stop interacting. It’s the same feedback loop you feel on a well-tuned skateboard where momentum rewards gentle carving.
- Clicks enqueue ripples that expand outward with exponential falloff. Each ripple tracks its age, distance, and strength, then fades after eight seconds—like dropping a pebble into an infinite koi pond and watching the rings dissolve, or striking a gong and hearing the shimmer soften into silence.
- The camera orbits on a subtle autopilot and lerps toward pointer offsets. Instead of an instant jump, it glides with coefficients around `0.04–0.045`, echoing the way a steadicam operator anticipates the next beat or a hot-air balloon drifts toward a new thermal.

## Effect Library: Nine Alternate Universes

The animation stores a library of effect definitions—Zen, Jitter, Reaction Diffusion, Starfield, Harmonic Pendulum, Mandelbrot Zoom, and more. Triggering an effect executes four passages:

1. **init** seeds per-effect memory (double pendulum angles, Gray-Scott buffers, etc.).
2. **start** retunes the global settings (brightness, amplitude, ripple behaviour).
3. **update** evolves the custom state frame to frame.
4. **perPoint** injects per-particle offsets, scales, and lighting.

Each effect is like inviting a guest conductor to reinterpret the score, or letting a guest chef borrow the kitchen for a one-night tasting menu. The Harmonic Pendulum mode sums the influence of three real-time double pendulums for chaotic waves. River Run steers sine currents diagonally while layering fractal noise to conjure eddies. Starfield lifts the dots into a faux z-axis, interpolating twinkle phases so the grid dissolves into a nebula before gracefully landing. Even Mandelbrot Zoom computes 32 iterations per point, letting the dots map the fractal boundary as they breathe in and out like accordion bellows.

## The Secret Sauce of Smoothness

Smoothness here comes from a stack of easing decisions:

- **Target vs. live settings.** Rather than flipping values instantly, the animation walks every property toward its target with `settings[key] += (targetSettings[key] - settings[key]) * 0.05`. The result is a mellow glide anytime a mode or menu influence shifts the parameters—think of dimming the lights with a slider instead of a switch.
- **Envelope functions everywhere.** Effects lean on `smoothStep` and custom `computeEffectEase` helpers for ramping in and out. Even fade-outs square the progress curve to keep endings soft, like a choir sustaining its final note until the room exhales.
- **Pointer damping.** Energy builds quickly but bleeds away exponentially, so motion feels alive while dragging yet settles like sand the moment you pause.
- **Deferred effect clearing.** When a timed effect ends, it triggers a 2.5-second fade where the per-point contributions shrink while the UI synchronizes its own transition. Nothing snaps off-stage.
- **Responsive camera profiles.** Desktop and mobile have tailored orbits, and `matchMedia('(max-width: 640px)')` swaps profiles instantly when viewports change—no layout jolts when rotating a phone.

Taken together, the animation feels more like a jazz quartet warming up than a deterministic loop. Transitions are phrases, not toggles.

## Visual Polish and Reader Comfort

- The shader discards fragments outside a quarter-radius circle, then applies a `smoothstep` falloff. That feathered edge is the difference between retro CRT glow and a blocky pixel artifact—more vinyl record warmth than bitcrushed MP3 fatigue.
- Colors stay grayscale, but contrast and brightness stretch dynamically with height. Dots closer to the crest grow larger and brighter, mimicking stage lights following a dancer.
- Additive blending plus Reinhard tone mapping pushes bright peaks without blowing out the midtones; it’s the visual equivalent of compressing a track so whispers and shouts coexist.
- Accessibility is baked in. The scene respects `prefers-reduced-motion`, jumping straight to a stable state with `requestAnimationFrame`-synced readiness to avoid flashes during load.

## Picture Prompts

- Snapshot the default grid from a high angle, annotating the X/Y wave layers like a topographic map, to show how sinusoids interleave.
- Capture a GIF of ripple propagation, overlaying concentric circles like a water droplet diagram.
- Render the effect menu as a “guest conductor” lineup poster, pairing each mode with its signature waveform icon.
- Split-screen a standard view and the `prefers-reduced-motion` fallback to illustrate the empathetic loading path.

## Technical Tidbits Worth Sharing

- The Perlin permutation table is precomputed into a 512-entry lookup. That noise powers flowing effects like River Run without allocating intermediate arrays every frame.
- Ripple queues cap at 20 entries to prevent runaway accumulation, and old ones are culled after eight seconds, keeping perf flat over long sessions.
- The grid is marked `frustumCulled = false` so the renderer keeps it alive even when the camera pushes deep into the orbit—no accidental pop-out at extreme angles.
- Stats.js hooks stay hidden unless toggled via admin controls, but they’re ready for experimentation when dialing new modes.
- The scene toggles a `.is-ready` class one frame after initialization (or immediately for reduced-motion users), letting CSS coordinate entrance animations with WebGL readiness.

## Why It Feels So Good

The magic of the dot field isn’t in any single waveform. It’s the way every system—pointer energy, ripple queues, effect envelopes, camera interpolation—leans toward empathy. The animation listens to you, interprets your inputs like a jazz pianist riffing on a theme, and gives each mode a chance to shine without crowding the stage.

Or, to borrow an analogy from the kitchen: this piece is less a recipe and more a well-seasoned cast iron skillet. Each layer of math and polish is a seasoning that makes the next performance taste better. Whether you’re dropping into Zen Mode for meditative drift or firing up Jitter for fireworks, the pan is ready, warm, and welcoming—like a trusted family instrument that only gets sweeter with each jam.

## Future Improvisations (Tech Notes)

- **GPU instancing for richer sprites.** Experiment with instanced quads and a tiny texture atlas so certain modes can introduce comet tails or hex particles without tanking fill rate.
- **WebGL 2 framebuffers.** Render secondary simulations (reaction diffusion, velocity fields) into framebuffers once per frame, then sample them in the main shader to reduce CPU-to-GPU chatter.
- **Audio-reactive hooks.** Pipe Web Audio API FFT data into the influence map so bass hits can trigger ripple bursts or modulation envelopes.
- **Adaptive grid density.** Scale `AMOUNTX`/`AMOUNTY` and `SEPARATION` based on device performance metrics, keeping low-power hardware smooth while letting desktops enjoy denser fields.
- **Gesture memories.** Record recent pointer paths in a trailing buffer so the field can replay your last 10 seconds of interaction as a ghost overlay when you go idle.
- **Editor UX polish.** Extend the admin presets with inline sparklines previewing waveforms so curators can “hear” the mode before it plays.

So enjoy the show, and when you craft the next effect, remember—you’re not just moving pixels. You’re inviting the dots to dance.
