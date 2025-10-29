http://plan.md

# Language Crossover Animation Plan

**Overall Progress:** `88%`

## Tasks

- [x] 🟩 **Step 1: Centralize timing + debounce in LanguageContext**
  - [x] 🟩 Introduce `LANGUAGE_TRANSITION_MS ≈ 800` and unified easing.
  - [x] 🟩 Extend `changeLanguage(newLang, opts?)` to accept `{ originX, originY, from, to }`.
  - [x] 🟩 Set CSS vars on `body` for click origin (`--lang-origin-x`, `--lang-origin-y`).
  - [x] 🟩 Add debounce (ignore re-entry during the active transition window).
  - [x] 🟩 Dispatch `languagechange:start` CustomEvent with `{ from, to, originX, originY }`.

- [x] 🟩 **Step 2: Global radial overlay (public routes only)**
  - [x] 🟩 Implement a subtle radial “wash” via CSS (scoped to `.site-shell` tree), non-blocking (`pointer-events: none`).
  - [x] 🟩 Animate opacity + scale from click origin using the CSS vars; use polished cubic-bezier easing.
  - [x] 🟩 Color: neutral light wash with tiny warmth and low opacity (≤ 0.12).
  - [x] 🟩 Ensure no effect on admin routes (scope to public layout only).

- [x] 🟩 **Step 3: Wire toggles to pass click origin**
  - [x] 🟩 Update `components/LanguageSwitcher.jsx` to pass click coordinates to `changeLanguage`.
  - [x] 🟩 Update `components/RetroMenu.jsx` toggle to also pass coordinates (keep existing ripple call).
  - [x] 🟩 Keep tooltips/aria unchanged.

- [x] 🟩 **Step 4: Home ripple on header toggle**
  - [x] 🟩 In `SiteShell`, listen for `languagechange:start`; if on Home, call `sceneRef.current?.addRipple(...)`.
  - [x] 🟩 Convert screen coords to field space (simple normalization around center; moderate strength).

- [x] 🟩 **Step 5: Unify durations/easing (clean + reliable)**
  - [x] 🟩 Align `BrandWordmark.jsx` transition duration/easing with `LANGUAGE_TRANSITION_MS`.
  - [x] 🟩 Align text crossfade CSS blocks in `app/globals.css` to the same values.
  - [x] 🟩 Remove any mismatched timings that could desync the crossover.

- [ ] 🟥 **Step 6: Manual QA (public routes)**
  - [ ] 🟥 Home: toggle via header and RetroMenu; overlay originates from click; ripple triggers on both.
  - [ ] 🟥 About, Projects (list + detail), Content (list + detail), Sounds, Art: clean crossover, no layout shift.
  - [ ] 🟥 Rapid toggles are debounced during animation; no stuck states.
  - [ ] 🟥 Mobile tap origin feels centered on the tap; no blocking interactions.

- [ ] 🟥 **Step 7: Diagnose + enhance text crossover**
  - [x] 🟩 Enumerate potential causes; instrument LanguageContext/SiteShell for runtime diagnostics. *(Comment: ensures we know the triggers fire on time.)*
  - [x] 🟩 Validate via logging that transition flags fire in sync with renders. *(Comment: confirmed infra works; issue lies in render pipeline.)*
  - [x] 🟩 Stage outgoing text layer (keep last language visible during transition). *(Comment: fade-through holds prior text until swap.)*
  - [x] 🟩 Drive staggered opacity/blur animations via CSS variables (reuse existing duration/easing). *(Comment: ensures polish and consistency with overlay.)*
  - [x] 🟩 Update key components (headings, nav, cards, detail views) to consume staged layers without duplication. *(Comment: centralized via LanguageTransitionRoot wrapper.)*
  - [x] 🟩 Provide reliable cleanup once animation completes to avoid lingering DOM nodes. *(Comment: timers clear + state resets post-animation.)*
  - [ ] 🟥 Re-run smoke tests on Home + primary routes to confirm smooth visual swap. *(Comment: validates the new layering end-to-end.)*

- [ ] 🟥 **Step 8: Timing polish & overlay refinement**
  - [x] 🟩 Extend shared duration by 25% (update constants + CSS fallbacks). *(Comment: matches desired slower cadence.)*
  - [x] 🟩 Recalculate language swap delay to stay aligned with longer animation. *(Comment: keeps fade-through midpoint in sync.)*
  - [x] 🟩 Remove radial glow overlay while retaining ripple + body markers. *(Comment: addresses request to drop white wash.)*
  - [ ] 🟥 Quick smoke test: header + retro menu toggle verify slower crossover sans glow. *(Comment: ensures refinement behaves as expected.)*

- [ ] 🟥 **Step 9: Home dotfield/menu separation**
  - [x] 🟩 Relocate `LanguageTransitionRoot` so the scene canvas stays outside the fade scope on `/`. *(Comment: preserves continuous dotfield motion.)*
  - [x] 🟩 Wrap the retro menu overlay with the fade root for graceful language swaps. *(Comment: keeps crossfade focused on navigation chrome.)*
  - [x] 🟩 Ensure non-home layouts still receive fade coverage (wrap shell structure). *(Comment: avoids regressions on subpages.)*

Notes:
- Reduced motion: no new handling required (existing CSS already disables heavy transitions under system preference).
- Admin: excluded by scoping overlay to public `.site-shell` surface.
