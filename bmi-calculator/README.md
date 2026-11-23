# {{toolName}}

A standalone, client-side utility website built with Next.js (App Router, static export), TypeScript, and Tailwind CSS.

## Build and Run Locally

```bash
pnpm install
pnpm dev
```

## Static Production Build

```bash
pnpm build
```

The static HTML/CSS/JS files will be generated into the `out/` directory.

## Standalone Deployment

Deploy this folder independently to Cloudflare Pages, Vercel, or Netlify:
- Root directory: `.` (or project folder path)
- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Output directory: `out`
