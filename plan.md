# Rich Text Workflow v3.0 Plan

## 1. Layout & Responsiveness
- [x] Expand the admin editor canvas to span the full width whenever the entry list is collapsed.  
  <!-- Keeps the TipTap surface roomy when authors hide the drawer while still permitting quick toggles back. -->
- [x] Adjust flex/grid rules in `app/globals.css` so the toolbar and editor share a single column above 720 px and gracefully stack below that breakpoint.  
  <!-- Maintains consistent padding on wide displays without forcing horizontal scroll on tablets. -->
- [x] Allow the editor stage to stretch vertically with `flex: 1` plus sensible `min-height` guards.  
  <!-- Prevents short drafts from collapsing while letting long sessions fill the viewport. -->

## 2. Modular State & Upload Pipeline
- [x] Introduce a reducer-driven state machine inside `components/rich-text-editor.jsx` to track selection, pending uploads, modal visibility, and error states.  
  <!-- Centralizes transitions (idle → selecting → uploading → inserting) for predictable behaviour. -->
- [x] Extract a reusable `useUploader` hook that enforces MIME/size rules, limits batch size, dedupes files, supports abort signals, and emits progress.  
  <!-- Shares validation between cover uploader and inline media while keeping concurrency bounded. -->
- [x] Normalize upload responses to `{ url, pathname, meta }` before insertion.  
  <!-- Guarantees downstream consumers receive the same payload shape regardless of API quirks. -->

## 3. Cover Image Uploader v3 Integration
- [x] Refactor `components/cover-image-uploader.jsx` to supply a shared drag/drop zone with keyboard triggers, hover affordances, and MIME guards.  
  <!-- Ensures accessible upload entry points across cover and inline flows. -->
- [x] Upgrade the cropper with zoom controls, 3:2 / 1:1 aspect toggles, live resolution readouts, and a minimum crop guard (≥200×200).  
  <!-- Prevents undersized crops and gives authors precise aspect control. -->
- [x] Add an inline alt-text editor with character counter and non-empty validation prior to completion.  
  <!-- Encourages accessible descriptions without needing a separate modal. -->
- [x] Lazily fetch existing media with search + pagination to avoid rendering massive lists.  
  <!-- Reduces initial payload size and keeps the panel responsive. -->
- [x] Export helper utilities (alt sanitisation, blob creation) for other uploader consumers.  
  <!-- Allows inline media insertion to reuse the same sanitisation primitives. -->

## 4. Inline Media Placement
- [x] Extend TipTap with a custom inline media node carrying `alignment`, `width`, `caption`, `alt`, `src`, and `pathname` attributes.  
  <!-- Stores rich metadata in the document schema instead of relying on DOM queries. -->
- [x] Add toolbar actions for inserting via uploader, alignment toggles (left/center/right), width presets (25/50/100 %), and inline caption editing.  
  <!-- Gives authors deterministic layout controls from the toolbar. -->
- [x] Route drag/drop & paste events through the uploader pipeline, showing actionable errors for unsupported files.  
  <!-- Keeps every entry point consistent while surfacing clear feedback. -->

## 5. Styling & Accessibility
- [x] Create `.editor-media` utility classes to manage floats, max-widths, mobile stacking, and dark-mode shadows.  
  <!-- Normalizes presentation across admin preview and public renderers. -->
- [x] Provide `@supports` fallbacks where `float-gap` is unavailable, falling back to margin spacing.  
  <!-- Preserves layout integrity on legacy browsers. -->
- [x] Reinforce focus states, `aria-modal`, focus trapping, and ESC behaviour for overlays and toolbar buttons.  
  <!-- Ensures keyboard-only and screen-reader users can operate all controls. -->

## 6. Error Handling & Edge Cases
- [x] Present retryable error banners covering cancellations, network failures, and server validation errors.  
  <!-- Prevents silent failure by guiding authors toward recovery actions. -->
- [x] Block completion when crops fall below 200×200 and warn when upscaling exceeds 150 %.  
  <!-- Protects media quality and sets user expectations. -->
- [x] Skip duplicate uploads using file signatures and highlight reuse opportunities.  
  <!-- Avoids redundant storage and keeps the media index tidy. -->
- [x] Remove inline media nodes atomically so no orphan wrappers remain after deletion.  
  <!-- Maintains a valid TipTap document tree and clean markup. -->

## 7. Testing & Verification
- [x] Add targeted unit tests for uploader utilities (signatures, validation) and crop dimension guards.  
  <!-- Locks down critical logic without needing a full test harness yet. -->
- [ ] Perform manual smoke tests covering multi-image uploads, alignment toggles, narrow viewports, and keyboard navigation.  
  <!-- Satisfies repository guidelines given the absence of automated E2E coverage. -->
- [ ] Run `pnpm lint` and capture manual verification notes before completion.  
  <!-- Ensures code quality gates are respected prior to merging. -->

## 8. About Section Enhancements
- [x] Audit the About data model to confirm required English/Japanese fields and note any gaps.  
  <!-- Keeps localisation parity across admin and public surfaces. -->
- [x] Ensure `/administratorrrr` surfaces editable About fields (title, subtitles, rich content, cards, tags) with language tabs.  
  <!-- Gives authors full control inside the admin console. -->
- [x] Update the About page rendering to consume the new admin-managed content while preserving design.  
  <!-- Applies dynamic content without sacrificing existing layout polish. -->
- [ ] Add validation and preview flows so editors can verify layout before publishing.  
  <!-- Reduces the risk of broken content going live. -->
