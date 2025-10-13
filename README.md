# jayfolio

Personal portfolio and content site with retro aesthetic and multilingual support.

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for instant setup.

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 30 seconds
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Full development guide
- **[AGENTS.md](./AGENTS.md)** - Coding conventions and repo guidelines
- **[CHANGELOG.md](./CHANGELOG.md)** - Recent changes and history

## Features

- 🌐 Multilingual (EN/JA) with automatic detection
- 🎨 Retro-futuristic design with 3D field background
- 📝 Content management system
- 🎵 Audio experiments gallery
- 🖼️ Art portfolio
- 🔒 Admin panel with geo-restriction
- ⚡ Built with Next.js 15 + React 19

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19
- **3D**: Three.js
- **Editor**: TipTap
- **Storage**: Vercel Blob
- **Deployment**: Vercel

## Getting Started

```bash
pnpm install
pnpm dev
```

Visit http://localhost:3000

## Environment

Create `.env.local`:
```bash
ADMIN_SECRET="your-secret"
BLOB_READ_WRITE_TOKEN="vercel-blob-token"
```

## License

Private project
