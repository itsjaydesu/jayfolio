http://plan.md

# Performance & Responsiveness Optimization Plan

**Overall Progress:** `88%`

## Tasks

- [x] 🟩 **Step 1: Restore static optimization and home‑first canvas**
  - [x] 🟩 Remove server admin check from `app/layout.jsx`; rely on client admin hook
  - [x] 🟩 Render `SceneCanvas` only on home; remove from subpages
  - [x] 🟩 Idle prefetch home from subpages (`router.prefetch('/')`)
  - [x] 🟩 Idle preload `SceneCanvas` chunk on subpages and on brand/nav hover

- [x] 🟩 **Step 2: Font loading adjustments**
  - [x] 🟩 Centralize Inter & IBM Plex Mono imports via `app/globals.css`
  - [x] 🟩 Ensure critical styles reference the shared font stack

- [x] 🟩 **Step 3: CSS organization clean-up**
  - [x] 🟩 Isolate major component style blocks within `app/globals.css`
  - [x] 🟩 Ensure `app/styles/{reset,base,tokens,utilities}.css` stay canonical
  - [x] 🟩 Remove unused global imports and prep for future modularization

- [x] 🟩 **Step 4: Footer data flow (eliminate client fetch)**
  - [x] 🟩 Fetch channel content server-side (layout or per-route)
  - [x] 🟩 Pass footer config via props/context to `SiteFooter`
  - [x] 🟩 Remove `fetch('/api/channel-content')` from `components/SiteFooter.jsx`

- [x] 🟩 **Step 5: Route pre-rendering and caching**
  - [x] 🟩 Add `generateStaticParams` for `[slug]` pages (projects/content/sounds/art)
  - [x] 🟩 Convert index pages to SSG; drop route-level `revalidate` unless required
  - [x] 🟩 Keep admin routes protected via middleware

- [x] 🟩 **Step 6: Asset and API caching**
  - [x] 🟩 Add `next.config.js` header for `/sounds/:path*` (immutable, 1y)
  - [x] 🟩 Ensure no audio preloading: set `<audio preload="none">`
  - [x] 🟩 Retain image caching; verify OG image handling

- [x] 🟩 **Step 7: Navigation prefetch and UX**
  - [x] 🟩 Ensure `Link prefetch` enabled on nav and cards
  - [x] 🟩 Prefetch `/` and warm `SceneCanvas` after idle on subpages
  - [x] 🟩 Respect reduced motion: skip scene mount entirely

- [ ] 🟥 **Step 8: Manual QA**
  - [ ] 🟥 Smoke‑test all public routes and `/administratorrrr`
  - [ ] 🟥 Verify instant home load from subpages
  - [ ] 🟥 Confirm footer makes no client network calls
  - [ ] 🟥 Confirm audio fetch occurs only on play
