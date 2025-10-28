# About Page Refactor Plan

**Overall Progress:** `67%`

## Tasks

- [x] 🟩 **Step 1: Stabilize header layering on subpages**
  - [x] 🟩 Ensure header sits above page content on initial load and navigation
  - [x] 🟩 Revisit `.site-shell__top-fade` so it never obscures nav/content
  - [x] 🟩 Verify `site-shell__main` offset keeps content below the fixed header

- [x] 🟩 **Step 2: Rebuild the About page layout**
  - [x] 🟩 Remove cinematic/hero background and extra gradients from About
  - [x] 🟩 Keep only: title, subtitle, lead text, and body text
  - [x] 🟩 Align typography, spacing, and width with site theme (shell/channel)
  - [x] 🟩 Preserve admin-only “Edit About” action

- [x] 🟩 **Step 3: Simplify About styles**
  - [x] 🟩 Trim `.clean-about-page*` CSS to avoid new stacking contexts
  - [x] 🟩 Ensure mobile readability (scale type/spacing responsibly)

- [x] 🟩 **Step 4: Footer image behavior (mobile optimization)**
  - [x] 🟩 Keep existing footer background logic and fades
  - [x] 🟩 Use Next.js `<Image>` on mobile for responsive/smaller payloads
  - [x] 🟩 Maintain visual parity on desktop

- [ ] 🟨 **Step 5: Manual smoke tests**
  - [ ] 🟥 Desktop: `/about` then navigate to `/projects`, `/content`, `/sounds`, `/art` (including detail views) to confirm no overlay issues
  - [ ] 🟥 Mobile viewport: header visibility/scroll, footer responsiveness/perf
  - [ ] 🟥 Admin: confirm “Edit About” shows only for admin and `/administratorrrr` remains unaffected

- [ ] 🟨 **Step 6: Lint and documentation**
  - [ ] 🟥 Run `pnpm lint` and fix trivial formatting *(blocked by existing `SceneCanvas.jsx` lint errors)*
  - [ ] 🟥 Update README or notes only if behavior/usage changes
