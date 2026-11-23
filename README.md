# Standalone Static Tools Monorepo

A production-grade repository containing **23 completely separate, self-contained Next.js static utility websites**.

Every project folder (`<slug>/`) is fully autonomous: it possesses its own `package.json`, its own `pnpm-lock.yaml`, its own isolated build configuration, and its own static export (`out/`). Any project folder can be lifted out of this repository into its own Git repo and built independently without any parent files present.

---

## 0. Core Guarantees & Constraints

1. **Zero Backend / 100% Client-Side:** No API routes, no server actions, no middleware, no serverless functions, no database, no runtime calls to external APIs. All tool computation happens in the user's browser.
2. **Next.js App Router (`output: 'export'`):** Every site compiles to static HTML, CSS, and JS (`<slug>/out`), with `trailingSlash: true` and `images.unoptimized: true`.
3. **No Workspace:** Enforced strict separation with no `pnpm-workspace.yaml` and no cross-folder imports.
4. **Zero External Runtime Requests:** Privacy-first design with self-hosted Inter font, no Google CDNs, no tracking scripts, and user data that never leaves the browser.
5. **Standardized Anatomy:** Every site includes `/` (tool + explainer + FAQs + related info), `/faqs/` (with `FAQPage` JSON-LD and deep anchors), `/privacy/`, `/terms/`, `/about/`, `/contact/` (`mailto:` only), and `/preview/` (sandboxed `postMessage` live-preview for admin iframe).
6. **Mathematical Precision:** All financial calculations, GPA calculations, and percentage formulas are powered by `decimal.js` with 100% passing test coverage against known-answer vectors.

---

## 1. Project Directory Layout

```
tools/                                  # Repository Root
  _template/                            # SOURCE OF TRUTH for shared code (Never deployed)
    core/                               # Layout, components, content loader, Zod schemas, preview client
    engines/                            # 17 pure math, string, and media engines with Vitest suites
    project/                            # Scaffolding template for new sites
  _shared/                              # Master legal templates (privacy.master.md, terms.master.md)
  scripts/
    new-site.ts                         # Scaffolds a new tool from _template
    sync.ts                             # Syncs _template/core & configured engines into project folders
    check-sync.ts                       # Fails CI if any synced file differs from source manifest
    validate-all.ts                     # Validates content schemas, word counts, and FAQ counts
    verify-standalone.ts                # Copies project to clean temp dir and runs install, test & build
    each.ts                             # Runs arbitrary commands across all 23 project folders
  sync.config.json                      # Mapping of which engines each site uses
  DECISIONS.md                          # Single-line log of architectural and design decisions
  
  # 23 Independent Tool Projects:
  address-generator/
  age-calculator/
  alphabetical-order-sorter/
  background-image/
  base64-encoder/
  bmi-calculator/
  character-counter/
  emi-calculator/
  fake-name-generator/
  gpa-calculator/
  image-compressor/
  image-resizer/
  image-to-pdf/
  jpg-to-png/
  json-formatter/
  loan-calculator/
  lorem-ipsum-generator/
  password-generator/
  percentage-calculator/
  qr-code-generator/
  strong-password-generator/
  wifi-qr-code-generator/
  word-and-character-counter/
```

---

## 2. Tool Catalog (23 Standalone Projects)

| # | Slug | Primary Keyword | Accent | Engine(s) Used |
|---|------|-----------------|--------|----------------|
| 1 | `bmi-calculator` | BMI Calculator | `blue` | `bmi` |
| 2 | `age-calculator` | Age Calculator | `teal` | `age` |
| 3 | `character-counter` | Character Counter | `indigo` | `text-stats` |
| 4 | `gpa-calculator` | GPA Calculator | `emerald` | `gpa` |
| 5 | `image-resizer` | Image Resizer | `slate` | `image-io` |
| 6 | `loan-calculator` | Loan Calculator | `blue` | `loan` |
| 7 | `password-generator` | Password Generator | `teal` | `password` |
| 8 | `percentage-calculator` | Percentage Calculator | `indigo` | `percentage` |
| 9 | `qr-code-generator` | QR Code Generator | `emerald` | `qr` |
| 10 | `background-image` | Background Image Generator | `blue` | `background` |
| 11 | `base64-encoder` | Base64 Encoder & Decoder | `teal` | `base64` |
| 12 | `fake-name-generator` | Fake Name Generator | `indigo` | `fake-data` |
| 13 | `image-compressor` | Image Compressor | `emerald` | `image-io` |
| 14 | `image-to-pdf` | Image to PDF Converter | `slate` | `pdf` |
| 15 | `jpg-to-png` | JPG to PNG Converter | `blue` | `image-io` |
| 16 | `json-formatter` | JSON Formatter & Validator | `teal` | `json` |
| 17 | `lorem-ipsum-generator` | Lorem Ipsum Generator | `indigo` | `lorem` |
| 18 | `strong-password-generator` | Strong Password Generator | `emerald` | `password` |
| 19 | `address-generator` | Fake Address Generator | `slate` | `address` |
| 20 | `alphabetical-order-sorter` | Alphabetical Order Sorter | `blue` | `sorter` |
| 21 | `emi-calculator` | EMI Calculator | `teal` | `loan` |
| 22 | `wifi-qr-code-generator` | WiFi QR Code Generator | `indigo` | `qr` |
| 23 | `word-and-character-counter` | Word and Character Counter | `emerald` | `text-stats` |

---

## 3. Automation Scripts & CLI Commands

### Sync Code from `_template/`
```bash
pnpm sync
```
Copies `_template/core` into every project's `src/shared` and the engines listed in `sync.config.json` into `src/engines/<name>`. Adds generated headers and creates `.sync-manifest.json` with SHA-256 hashes.

### Verify Sync Integrity
```bash
pnpm check-sync
```
Checks all generated files against their manifests to ensure no project has drifted or been hand-modified.

### Validate Content
```bash
pnpm validate-all
```
Validates `content/site.json`, `content/faqs.json` (8–12 FAQs), and `content/explainer.md` (250+ words) across all 23 sites.

### Test Standalone Independence
```bash
pnpm verify-standalone
# Or test a single site:
npx tsx scripts/verify-standalone.ts bmi-calculator
```
Copies a site to a clean temporary directory outside the repository (without root files or `_template`), and runs `pnpm install --frozen-lockfile && pnpm test && pnpm build` to prove complete independence.

### Run Commands in All Project Folders
```bash
pnpm each "pnpm test"
pnpm each "pnpm build"
```

### Scaffold a New Site (#24)
```bash
pnpm new-site my-new-tool
```
1. Creates `my-new-tool/` from `_template/project`.
2. Registers the site in `sync.config.json`.
3. Runs `pnpm sync` to populate `src/shared` and engines.
4. Generates content stubs in `content/`.

---

## 4. Live Preview Protocol (Admin Integration)

Every site includes a `/preview/?page=home|faqs|privacy|terms` route enabled when `NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN` is configured.
- Embedded by the Admin dashboard via `<iframe>`.
- Zero network requests; communicates strictly via `window.postMessage`.
- Messages carry `{ v: 1 }` and are validated by Zod schemas:
  - Site announces `{ v: 1, type: "preview-ready", slug }`.
  - Admin pushes draft content `{ v: 1, type: "preview-update", page, data }`.
  - Site responds with `{ v: 1, type: "preview-rendered", ok, errors }`.

---

## 5. Deployment & Hosting Configuration per Project

Because each project folder is completely autonomous, each site can be connected directly to Cloudflare Pages, Vercel, Netlify, AWS Amplify, or GitHub Pages from this monorepo or as an independent repository:

| Setting | Value | Notes |
|---------|-------|-------|
| **Root Directory** | `<slug>` (e.g. `bmi-calculator`) | Set in the hosting project settings |
| **Build Command** | `pnpm build` | Executes `pnpm validate && next build && tsx scripts/generate-headers.ts` |
| **Output Directory** | `out` | Static export folder with HTML, JS, CSS, and `_headers` |
| **Watch Paths** | `<slug>/**` | Rebuilds only when files in the designated tool folder change |
| **Node.js Version** | `20.x` or `22.x` (LTS) | Modern Node runtime |
| **Package Manager** | `pnpm` | Uses each project's isolated `pnpm-lock.yaml` |

### Configuring the Live Admin Preview Route in Production
To enable the live iframe draft preview in your hosting environment:
1. Navigate to your host's Environment Variables settings for the project.
2. Add `NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN` with your admin domain (e.g. `https://admin.yourdomain.com` or `http://localhost:3100` for local testing).
3. When set, Next.js generates the preview client and configures `_headers` with `frame-ancestors https://admin.yourdomain.com`.
4. If this variable is omitted, the site automatically compiles `/preview/` as a static 404 page with `frame-ancestors 'none'`.


