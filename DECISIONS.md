# Architectural & Design Decisions

- Repo root contains the 23 tool folders at top-level alongside `_template`, `_shared`, and `scripts`.
- No root `pnpm-workspace.yaml` is used to enforce complete isolation per project folder.
- Inter font is self-hosted locally without network requests to external CDNs.
- Tailwind CSS v3 with CSS custom properties is used for the theme tokens to ensure reliable Radix primitive styling.
- `decimal.js` is utilized for arbitrary-precision arithmetic across financial, GPA, and percentage engines.
- Legal template engine uses deterministic token replacement with strict validation on unknown variables and mismatched `{{#if}}...{{/if}}` tags.
- PostMessage preview communication enforces strict origin checking and validates messages using Zod schemas.
- In `sync.ts`, generated files receive a standard header (`// GENERATED from _template — do not edit here`) and a `.sync-manifest.json` tracks source hashes to detect drift in `check-sync.ts`.
- `.npmrc` includes `ignored-build-scripts-warn=true` to permit headless non-interactive CI installations without workspace configuration.
- Per-tool dynamic libraries: `qrcode` (MIT, ~30KB), `pdf-lib` (MIT, ~300KB), `fflate` (MIT, ~8KB), `lossless-json` (MIT, ~12KB), `jsonrepair` (ISC, ~25KB). All licences are permissive and loaded dynamically only within respective tools.
- Text statistics treats hyphenated words as single tokens, and introductory greetings/interjections (< 3 words ending in punctuation) attach to the subsequent sentence for sentence counting.
- Base64 engine uses chunked TextEncoder/TextDecoder buffers to ensure UTF-8 safety across all Unicode codepoints and emojis without invoking deprecated btoa on raw text.
- JSON engine uses lossless-json to preserve 64-bit integer strings and decimal accuracy against IEEE 754 truncation, with 1-based error coordinates and opt-in repair via jsonrepair.
- Lorem Ipsum generator guarantees exact word counts for N = 1..500 with natural comma pacing and semantic HTML wrapper options.
- Sorter uses Intl.Collator natural ordering and stable index tracking to retain first occurrences when deduplicating.
- Fake Name and Address engines bundle local datasets, state-to-ZIP prefix mappings, RFC 2606 reserved domains (@example.com/org/net), and NANP fictional numbers (555-0100..0199) with zero external network traffic.
- PDF generation maps exact typographic point coordinates (72 pt/in) for A4 and Letter standards using pdf-lib.
- Background Image generator creates procedural canvas gradients and geometric patterns with CSS export and resolution presets up to 4K.
- EMI calculator supports reducing-balance and flat-rate calculations with Indian Lakh/Crore (en-IN) number formatting when INR is chosen.
- Live preview framing headers use selective header overrides on `/preview*` (`! X-Frame-Options` and `! Content-Security-Policy`) to resolve multiple-CSP header conflicts across host providers.
- Standalone builds use localized `allowBuilds: { esbuild: true }` inside each project folder to satisfy pnpm v12 script approval policies in isolated environments while maintaining zero cross-folder workspace dependencies.
- Storage layer is abstracted behind `ContentStore` interface (`listSites`, `readFile`, `readSiteContent`, `commitBatch`, etc.) so a database-backed store or alternative Git provider can be added without altering editors, linters, preview, or bulk tools.
- Sites Admin uses query-string routing (`/site?slug=...`) instead of dynamic path segments (`/site/[slug]`) to maintain 100% compatibility with Next.js static HTML export (`output: 'export'`).
- GitHub Personal Access Tokens are kept in memory by default, and optionally encrypted client-side using WebCrypto AES-GCM (256-bit) with PBKDF2 (600,000 iterations) stored in IndexedDB; plaintext tokens are never written to localStorage or transmitted to any server.
- Atomic multi-file commits are performed via the GitHub Git Data API (`/git/blobs` -> `/git/trees` -> `/git/commits` -> `/git/refs`) to ensure multiple file updates across sites succeed or fail as a single atomic revision.
- Legal templates strictly disallow h1 headings in markdown bodies (reserving h1 for page layout titles) and enforce h2/h3 depth limits alongside required standard privacy sections.
- Sites Admin implements responsive adaptive layouts for mobile phones (iPhone/Android 360-428px), tablets (768-1024px), and laptops/desktops (1280px+), using collapsible navigation drawer, mobile card views with batch actions on small screens, and segmented editor/live-preview view toggling on viewport widths under 1024px.
- Dedicated port allocations across 1500–1550: Sites Admin is assigned port 1500, and the 23 tool sites are assigned ports 1501–1523 deterministically in `PORTS.json`. Individual projects define `-p <port>` in dev/start scripts, Live Preview in Sites Admin auto-resolves localhost to the site's dedicated port, and `scripts/serve-all.ts` provides a high-efficiency production static cluster server across all 24 ports with zero runtime dependencies.



