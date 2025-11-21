# Gemini Project Context: Jayfolio

## Project Overview
**Jayfolio** is a personal portfolio and content site built with **Next.js 15** and **React 19**, featuring a retro-futuristic aesthetic (3D field background via Three.js) and a custom JSON-based CMS. It supports multilingual content (English/Japanese) and includes an administrative interface for content management.

## Architecture & Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** JavaScript (ES Modules)
- **Frontend Library:** React 19
- **3D Graphics:** Three.js
- **Rich Text Editor:** TipTap
- **Data Storage:** Local JSON files (development) / Vercel Blob (production assets)
- **Styling:** CSS Modules / Global CSS (`app/globals.css`, `styles/`)
- **Localization:** Custom `LanguageProvider` context

## Key Directories

- **`app/`**: Next.js App Router pages and layouts.
  - `(admin-secure)/`: Secured admin routes.
  - `api/`: Backend API routes for the CMS.
- **`components/`**: Reusable React components (UI, Layouts, 3D scenes).
- **`content/`**: JSON files serving as the database for the CMS.
- **`lib/`**: Utility functions, CMS logic (`contentStore.js`), and configuration.
- **`public/`**: Static assets (images, fonts).
- **`styles/`**: Global CSS tokens and utility classes.

## Development Workflow

### Prerequisites
- Node.js (Latest LTS recommended)
- pnpm

### Commands
- **Start Development Server:**
  ```bash
  pnpm dev
  ```
  Runs at `http://localhost:3000`.

- **Build for Production:**
  ```bash
  pnpm build
  ```

- **Lint Code:**
  ```bash
  pnpm lint
  ```

### Environment Variables
Create a `.env.local` file with the following keys (see `README.md` for details):
- `ADMIN_SECRET`
- `BLOB_READ_WRITE_TOKEN`

## Coding Conventions

- **Module System:** ES Modules (`import`/`export`).
- **Path Aliases:** `@/*` maps to the project root `./*`.
- **Component Naming:** PascalCase for components (e.g., `SiteShell.jsx`).
- **File Naming:**
  - Components: PascalCase (`MyComponent.jsx`)
  - Utilities/Scripts: camelCase (`contentStore.js`)
  - Routes: kebab-case (`app/my-route/page.jsx`)
- **Indentation:** 2 spaces.
- **Strict Mode:** `'use client'` directive required for interactive components.

## CMS Structure
Content is stored in `content/*.json` files. The `lib/contentStore.js` module handles CRUD operations.
- **Content Types:** `projects`, `content` (formerly 'words'), `sounds`, `art`.
- **Admin Panel:** Accessible at `/administratorrrr`.
