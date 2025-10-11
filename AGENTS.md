# Repository Guidelines

## Project Structure & Module Organization
The Next.js app lives under `app/`, with route groups for `about`, `projects`, `words`, `sounds`, and `admin`. Shared UI and layout primitives sit in `components/` (for example, `RetroMenu.jsx`, `SiteShell.jsx`, and the `SceneCanvas` helpers). Domain logic, field config, and CMS defaults belong in `lib/`; mirror any schema changes by updating the paired content seeds in `content/`. Static assets, favicons, and media uploads live in `public/`, while global styling is centralized in `app/globals.css`.

## Build, Test, and Development Commands
- `pnpm install` — install dependencies and sync the lockfile.
- `pnpm dev` — run `next dev` at `http://localhost:3000` with hot reload.
- `pnpm lint` — execute the flat ESLint config; add `--fix` before committing formatting updates.
- `pnpm build` — compile the production bundle and validate required environment variables.
- `pnpm start` — serve the built app; run only after a successful `pnpm build`.

## Coding Style & Naming Conventions
Write modern ES modules and functional React components; add `'use client'` for any interactive-only entry point. Use camelCase for variables and helper functions, PascalCase for components and files, and kebab-case for route segments. Keep indentation at two spaces, prefer trailing commas, and let ESLint surface deviations. `<img>` elements are permitted—always include accessible alt text.

## Testing Guidelines
There is no automated suite yet, so document manual smoke tests across every public route and the `/admin` editor before merging. When adding automated coverage, colocate files such as `SceneCanvas.test.jsx` beside their subjects and wire future scripts through `pnpm test`. Store fixtures under `content/` and ensure API handlers can read mocked data without network calls.

## Commit & Pull Request Guidelines
Follow Conventional Commit syntax (`feat(admin): add media grid`) and keep summaries under 72 characters. Break large efforts into focused commits that separate refactors from feature logic. Pull requests should include a concise summary, screenshots or clips for UI-visible changes, manual verification notes, and linked issues or TODOs.

## Configuration & Admin Tips
The `/admin` surface reads from `/api/site-text`; keep that endpoint backward compatible when adjusting content flows. Manage environment variables in `.env.local` (excluded from version control) and verify them with `pnpm build`. Update `lib/siteTextDefaults.js` in tandem with any edits to `content/` seeds to avoid runtime fetch errors.
