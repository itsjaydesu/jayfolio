# Repository Guidelines

## Project Structure & Module Organization
- The Next.js app lives under `app/`; route groups include `about`, `projects`, `words`, `sounds`, and `admin`.
- Shared UI in `components/` (e.g., `SiteShell.jsx`, `RetroMenu.jsx`); keep reusable pieces there.
- Domain state and helpers reside in `lib/` (field configuration, CMS text). Update `content/` for static copy and media seeds.
- Global styles live in `app/globals.css`; the three.js scene assets render via `SceneCanvas` and related hooks.

## Build, Test, and Development Commands
- `pnpm install` bootstraps dependencies and aligns the lockfile.
- `pnpm dev` runs `next dev` with hot reload; default URL `http://localhost:3000`.
- `pnpm build` compiles the production bundle and validates environment variables.
- `pnpm start` serves the production build; run after `pnpm build`.
- `pnpm lint` applies the flat ESLint config; add `--fix` before committing formatting tweaks.

## Coding Style & Naming Conventions
- Use modern ES modules, functional components, and React hooks; add `'use client'` at the top for interactive-only components.
- Prefer camelCase for variables/functions, PascalCase for components/files (`RetroMenu.jsx`), and kebab-case routes.
- Two-space indentation and trailing commas are standard; run `pnpm lint --fix` to enforce.
- The project intentionally disables `@next/next/no-img-element`; keep `<img>` usage deliberate and accessible.

## Testing Guidelines
- No automated test suite exists yet; document manual smoke tests across site routes and the admin editor before merging.
- If you introduce automated tests, place them alongside features (`componentName.test.jsx`) and wire them into a future `pnpm test` script.
- Record any fixtures under `content/` and ensure API routes handle mocked data gracefully.

## Commit & Pull Request Guidelines
- Follow Conventional Commit syntax (`feat(admin): add media grid`). Scope to the surface you touched and keep summaries under 72 characters.
- Break large work into focused commits; avoid mixing refactors with feature logic.
- Pull requests should include: concise summary, screenshots or clips for UI tweaks, manual verification notes, and linked issues.

## Admin & Content Tips
- The `/admin` surface reads from `/api/site-text`; keep endpoint changes backward compatible.
- Update default copy within `lib/siteTextDefaults.js` and mirror schema changes in `content/` data to avoid runtime fetch errors.
