# Rich Text Workflow v3.0 Plan

## 1. Layout & Responsiveness
- [ ] Expand the admin editor card so the rich text surface spans the full width when the entry list is collapsed.
- [ ] Adjust flex/grid rules in `app/globals.css` so the toolbar and editor share one column while keeping generous padding on wide screens and collapsing gracefully under 720 px.
- [ ] Allow the editor to stretch vertically with `flex: 1` while keeping sensible minimum heights for short drafts.

## 2. Modular State & Upload Pipeline
- [ ] Introduce a reducer-based state machine in `components/rich-text-editor.jsx` to manage file selection, cropping, placement, and error states.
- [ ] Extract a reusable `useUploader` hook that validates MIME/size, limits batch uploads, supports abort signals, and surfaces progress updates.
- [ ] Normalise upload responses so downstream components receive consistent `{ url, pathname, meta }` payloads.

## 3. Cover Image Uploader v3 Integration
- [ ] Refactor `components/cover-image-uploader.jsx` into a shared component providing:
  - [ ] Drag/drop support with keyboard triggers and hover feedback.
  - [ ] Cropping modal backed by `react-image-crop`, including zoom, aspect toggle (3:2 & 1:1), and live resolution readouts.
  - [ ] Inline alt-text editor with character count and validation.
  - [ ] Existing-media selector with search, pagination, and lazy fetching to avoid long render queues.
- [ ] Export helper utilities (alt sanitisation, blob creation) for inline media insertion flows.

## 4. Inline Media Placement
- [ ] Extend the TipTap configuration with custom image node attributes (`data-alignment`, `data-width`, optional captions).
- [ ] Provide toolbar controls so authors can insert images via the new uploader, toggle alignment (left/center/right), choose width presets (25%, 50%, 100%), and edit captions inline.
- [ ] Ensure pasted/dropped files use the same pipeline, surfacing actionable error messages for unsupported formats.

## 5. Styling & Accessibility
- [ ] Add `.editor-media` CSS classes for floated alignment, max-width constraints, mobile stacking, and dark-mode-friendly shadows.
- [ ] Supply `@supports` fallbacks to preserve spacing on browsers without float-gap support.
- [ ] Harden focus states so toolbar buttons, modals, and media thumbnails remain keyboard accessible; maintain `aria-modal`, focus trapping, and ESC handling in overlays.

## 6. Error Handling & Edge Cases
- [ ] Recover gracefully from cancelled uploads, network failures, and server validation errors with clear retry options.
- [ ] Guard the cropper against tiny selections (minimum 200×200) and warn about significant upscaling.
- [ ] Prevent duplicate uploads by comparing file signatures and surface reuse notifications.
- [ ] Ensure removing inline media cleans up wrapper markup without orphaned nodes.

## 7. Testing & Verification
- [ ] Add unit tests for uploader utilities and crop conversions; expand integration coverage for drag/drop and alignment controls.
- [ ] Perform manual smoke tests (multi-image uploads, varied alignments, narrow viewport wraps, keyboard-only modal navigation).
- [ ] Run `pnpm lint` and document manual verification results before merging.

## 8. About Section Enhancements
- [ ] Audit current About page data model to confirm required fields for English/Japanese content.
- [ ] Ensure `/administratorrrr` surfaces editable fields for About (title, subtitles, rich content, cards, tags) with localisation support.
- [ ] Update About page rendering to respect new admin-managed content while preserving existing design.
- [ ] Add validation and previews in the admin console so editors can confirm layout before publishing.
