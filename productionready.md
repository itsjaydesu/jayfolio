# Production Readiness Playbook

Ordered checklist to take the site from the current state to a secure, reliable launch at `https://jay.winder.io`.

---

## 0. Pre‑flight (today)

- [ ] Confirm Vercel project, environment branches, and CI/CD flow.
- [ ] Add required secrets to Vercel (`BLOB_READ_WRITE_TOKEN`, future auth secrets, analytics keys as needed).
- [ ] Snapshot current `/content/*.json` files so nothing is lost during storage work.

---

## 1. Lock Down the Admin Surface (P0)

1. **Select an auth strategy**
   - ✅ Simple passphrase stored in `ADMIN_SECRET` with middleware gating `/administratorrrr` and `/api/*` writes. Implemented login page, session cookie, and CSRF token propagation for all admin fetches.
   - ✅ Custom CSRF header (`X-Admin-CSRF`) now required for write verbs; middleware validates token per session.
2. **Gate routes**
   - ✅ Middleware enforces authentication on `/administratorrrr` route group (moved to `(admin-secure)`), `/api/content/*`, `/api/media`, `/api/field-settings`, `/api/channel-content`, `/api/site-text`, `/api/seo`, and `/api/upload` for non-GET methods; unauthenticated users are redirected to `/administratorrrr/login` or receive `401/403` JSON. Production traffic is additionally geo-restricted to Japan-based IPs with 403 responses for out-of-region requests.
   - ⏭️ Add branded unauthorized screen / animation to polish the failure path and expand geo-fail messaging.
3. **Harden uploads**
   - ⏭️ Still need to associate uploads with user identities, add rate limiting, and close any residual anonymous mutation paths.

---

## 2. Migrate JSON Content to Vercel Blob (P0)

Reuse the existing `@vercel/blob` integration; the goal is to stop writing to the ephemeral filesystem.

1. **Design object layout**
   - Store each collection at `content/<type>.json`, settings under `settings/*`, media index under `media/index.json`.
   - Keep the latest version plus optional history (`content/projects-<timestamp>.json`) for manual rollbacks.
2. **Implement blob helpers**
   - Create `lib/blobClient.js` utilities: `readJsonBlob(path, fallback)`, `writeJsonBlob(path, data)`, `listJsonBlobs(prefix)`.
   - Switch `lib/contentStore.js`, `lib/siteText.js`, `lib/channelContent.js`, `lib/fieldSettings.js`, `lib/mediaIndex.js`, and `lib/seoConfig.js` to use blob helpers instead of `fs`.
   - Use `cacheControl: 'no-store'` for mutable JSON writes to avoid stale data from the CDN.
3. **Build migration script**
   - Script reads local `/content/*.json`, uploads to blob storage, verifies byte parity, then optionally deletes local copy.
   - Run once per environment; keep script in `scripts/migrate-content-to-blob.mjs`.
4. **Update build/runtime config**
   - Ensure `BLOB_READ_WRITE_TOKEN` is available during build and runtime (Edge/Web).
   - For Vercel Edge runtimes, use `put`/`del` from `@vercel/blob` with the new `automaticUpload` opt-in.
5. **Add monitoring**
   - Fail fast when blob read/write fails; surface admin banner instructing the user to retry.
   - Emit structured logs instead of `console.log`.

---

## 3. Respect Publishing Status (P0)

1. Filter `readEntries` to return only `status === 'published'` unless the caller explicitly opts into drafts (admin views).
2. In detail routes (`projects/[slug]`, `words/[slug]`, `sounds/[slug]`) return `404` for unpublished entries.
3. Update sitemap/feeds to skip drafts.

---

## 4. Sanitize Rich Text (P0)

1. Add a server-side sanitizer (e.g. `sanitize-html`, `dompurify` via `jsdom`, or a tiptap JSON serializer).
2. Sanitize on write in `normalizeEntry` to keep stored HTML safe.
3. For defense in depth, sanitize again before rendering in `EntryDetail`.

---

## 5. Replace Debug Instrumentation (P1)

1. Remove or guard all `console.log` statements in production (`SceneCanvas`, `RetroMenu`, `EntryDetail`, `QrPage`, `seoConfig`).
2. Replace with `debug`/`pino` or a custom logger that respects `NODE_ENV`.

---

## 6. SEO & Domain Alignment (P1)

1. Update `content/seo-config.json` (new blob variant) with `siteUrl: 'https://jay.winder.io'`, real title template, social images, verification tokens.
2. Add actual favicon, touch icons, and a `public/site.webmanifest` referencing the brand palette.
3. Verify `robots.txt` and `sitemap` pull the blob-based SEO config and publish correct URLs.

---

## 7. Admin UX Iteration (P2)

- Add search/filtering (status, tags, date range) to the entry list.
- Provide inline validation errors for slug conflicts, missing fields.
- Introduce an on-page preview (reuse `EntryDetail` with sanitized markup).
- Implement unsaved changes guard + autosave drafts.
- Enhance media library with search/tag filters and modal delete confirmation.

---

## Current Status

- Admin console now requires `ADMIN_SECRET` login; authenticated sessions issue CSRF tokens shared through the new `AdminSessionProvider` context.
- Middleware (`middleware.js`) enforces auth for protected admin pages and all JSON mutation endpoints while leaving public reads untouched; `/administratorrrr` UI relocated under `(admin-secure)` group.
- All admin clients (`page.jsx`, media library, settings screens, uploaders, rich text editor) use a shared `useAdminFetch` hook to inject the CSRF header on write requests.

## Next Steps

1. Implement rate limiting and ownership tracking in `app/api/upload` and `app/api/media` so uploads tie back to an authenticated user.
2. Build an access denied screen / dotfield animation for unauthorized `/administratorrrr` visits to replace the plain redirect and explain geo restrictions.
3. Extend session management with expiration UX (e.g., logout button, idle timeout) and consider storing hashed secrets.
4. Continue with Section 2 (Blob migration) once storage plan is finalized; script and helper scaffolding still pending.

---

## 8. User Experience Polish (P2)

- Server-render site text/navigation to avoid initial fetch jitter (pass defaults via layout loader or static props).
- Offer a reduced-motion / static background toggle for non-WebGL devices.
- Refine `/qr` to degrade gracefully when WebGL is unavailable.
