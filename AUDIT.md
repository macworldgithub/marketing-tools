# Complete Spec Audit Report (PROMPT 3)

Conducted on: 2026-11-23  
Target: 23 Standalone Frontend-Only Tool Websites  
Scope: Sections 0–11 of Original Specification (Audit Items A1 through G4)  

---

## 1. Audit Summary Matrix (A1 – G4)

| Item | Result | Evidence (Command & Key Output Line) | Fix Applied |
| :--- | :--- | :--- | :--- |
| **A1** | **PASS** | `node -e "const fs=require('fs'); console.log(Object.keys(JSON.parse(fs.readFileSync('sync.config.json'))).every(s => fs.existsSync(s + '/app/preview/page.tsx')))"` → `true` | Standardized `app/preview/page.tsx` across all 23 projects. |
| **A2** | **PASS** | `node -e "..."` reading `out/preview/index.html` across all 23 folders → `✅ ALL 23 folders return 404 for /preview/ with env unset.` | Dynamic `notFound()` call when `NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN` is undefined at build time. |
| **A3** | **PASS** | `npx tsx scripts/audit-preview.ts` → `✅ Received "preview-ready" with correct slug` & `✅ Wrong origin correctly ignored` & `✅ Malformed payload rejected with ok: false and schema errors: site: Required` | Enforced strict `event.origin === adminOrigin && event.source === window.parent` check and Zod parsing in `PreviewClient.tsx`. |
| **A4** | **PASS** | Grep robots/sitemap → `out/robots.txt` contains `Disallow: /preview/` & `Disallow: /preview/*`; 0 sitemap entries; 0 internal links. | Added explicit robots disallow rules and excluded `/preview` from static sitemap generation. |
| **A5** | **FAIL→FIXED** | `grep -E "frame-ancestors" */public/_headers` → preview route framed only by admin origin; `frame-ancestors 'none'` on `/*`. | Fixed multiple-CSP header conflict by negating base CSP headers on `/preview*` (`! X-Frame-Options`, `! Content-Security-Policy`) in `_template/core/utils/csp.ts` and syncing. |
| **A6** | **PASS** | `npx tsx scripts/audit-preview.ts` → `🎉 ALL SECTION A PLAYWRIGHT TESTS PASSED SUCCESSFULLY!` (DOM verified: FAQ & Privacy updated; Dark mode active). | Adjusted test payload heading level to `##` matching strict sanitization policy (`h1` reserved for page title). |
| **B1** | **PASS** | Read `_shared/privacy.master.md` and `terms.master.md` → verified browser-only processing, exact localStorageKeys, 0 cookies, hosting server log disclosure. | Authored truthful privacy and terms master templates. |
| **B2** | **PASS** | `pnpm each "node -e '...'"` checking `site.json`, `faqs.json`, `explainer.md`, `privacy.md`, `terms.md` → `23/23 folders have all 5 files.` | Populated all 5 required content files in every tool repository. |
| **B3** | **PASS** | `grep -rn "privacyMode\|termsMode" */content/` → 0 hits. `find . -name "*.override.md"` → 0 files found. | Removed legacy mode fields from schema and files. |
| **B4** | **PASS** | `pnpm validate-all` → `✅ All 23 sites have valid content.` (valid accents, schemaVersion 1, valid features block). | Resolved all Zod content validation warnings. |
| **B5** | **FAIL→FIXED** | `bmi-calculator/content/privacy.md` broken test: `Unknown variable in template: '{{unknownVar}}'` and `Unbalanced conditional blocks: found 2 '{{#if}}' tags and 1 '{{/if}}' tags` triggered build failures. | Fixed template parser in `_template/core/content/legal-template.ts` to strictly validate allowed variables and balanced tags before compilation. |
| **C** | **FAIL→FIXED** | `npx tsx scripts/audit-formulas.ts` → All 15 known-answer vectors match specification exactly (BMI 22.9/22.7, Age leap years, GPA 3.18/3.36, Loan 304.22/1580.17, EMI 20758.36/24166.67, Percentages, Counters 37/32/6/1, Base64 RFC 4648, Password entropy, Natural sort, Lossless JSON, Image resizer/compressor, PDF geometry, WiFi QR escaping). Grep: 0 `Math.random` in password engine, `decimal.js` used for currency/percentages/GPA, 0 `btoa` on raw text. | Fixed fast-check unicode generator, lossless JSON number sorting, lorem sentence starting offset, fake data PRNG typo, WiFi QR escaping, and explicit typing on EMI calculator. |
| **D1** | **PASS** | `grep -rn "fetch(\|XMLHttpRequest\|sendBeacon\|WebSocket\|EventSource" */src/ */app/` → 0 hits. Grep for external HTTP URLs returned 0 unwhitelisted network endpoints. | Client-side only architecture strictly adhered to. |
| **D2** | **PASS** | `npx tsx scripts/audit-ui-and-screenshots.ts` with Playwright network listener across all 23 sites (`/`, `/faqs/`, `/privacy/`) → 0 external network requests detected during tool usage. | Verified tool isolation in browser. |
| **D3** | **PASS** | `grep -rn "localStorage" */src/ */app/` → Only `'theme'` key accessed across code, matching `features.localStorageKeys: ['theme']` in `site.json` and privacy policy text. | Ensured complete parity between storage usage, metadata, and disclosures. |
| **D4** | **PASS** | Inspected `_headers` in `bmi-calculator` and `image-resizer` → `default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'` confirmed on `/*`. | Enforced standard restrictive CSP headers. |
| **E1** | **PASS** | `npx tsx scripts/audit-all-metrics.ts` evaluating mobile `/`, `/faqs/`, `/privacy/` across all 23 sites → All scores ≥ 95 (Performance: 100, Accessibility: 95–100, Best Practices: 100, SEO: 100). | Fixed interactive touch target min-dimensions (≥ 44px) and form labels across all core UI templates. |
| **E2** | **PASS** | `npx tsx scripts/audit-ui-and-screenshots.ts` at 360px, 768px, and 1280px viewports → `document.documentElement.scrollWidth <= window.innerWidth` returned `true` for all 23 sites (0 horizontal scroll). Screenshots saved to `screenshots/<slug>/`. | Added responsive overflow wrapping and flex/grid collapsing on mobile viewports. |
| **E3** | **PASS** | Automated WCAG contrast check on dark mode backgrounds → Contrast ratio 20.17:1 on slate-950, exceeding WCAG AA 4.5:1 requirement across all 23 homepages. | Applied neutral dark palette `text-slate-100` on `bg-slate-950`. |
| **E4** | **FAIL→FIXED** | Design system review → Neutral slate palette + 1 designated accent per site; 0 gradients outside `background-image` output canvas; 0 emoji in UI chrome. | Created custom interactive canvas UI for `background-image` tool with resolution presets, CSS copy, and image exports. |
| **F1** | **FAIL→FIXED** | `npx tsx scripts/audit-content.ts` → All 23 `explainer.md` files strictly between 250 and 400 words (range: 253 to 329 words). All 23 `faqs.json` contain 8–10 items within length bounds. | Expanded 14 brief explainers with in-depth technical explanations of client-side algorithms, precision, and privacy. |
| **F2** | **PASS** | Jaccard 5-word shingle similarity across overlapping pairs: `character-counter` vs `word-and-character-counter` = 0.0177; `password-generator` vs `strong-password-generator` = 0.0196; `loan-calculator` vs `emi-calculator` = 0.0032; `qr-code-generator` vs `wifi-qr-code-generator` = 0.0121 (all < 0.35 limit). | Authored distinct question sets and dedicated explanatory prose per tool. |
| **F3** | **FAIL→FIXED** | Duplicate sentence check across all 23 sites → 0 exact duplicate sentences detected. | Rephrased overlapping FAQ question in `word-and-character-counter`. |
| **F4** | **FAIL→FIXED** | Line checks on `bmi-calculator`, `gpa-calculator`, `loan-calculator`, `emi-calculator` → Informational-only disclaimers present in both UI explainer and legal documentation. | Added explicit financial disclaimer callout to `emi-calculator`. |
| **F5** | **PASS** | `npx tsx scripts/read-sample-faqs.ts` → Read 5 FAQs per site group (Calculators, Text Tools, Generators, Image Tools); verified factual correctness of client-side operations. | Verified technical accuracy of explanations. |
| **F6** | **PASS** | `grep -rn "TODO" */content/` → The only remaining occurrences are `TODO-set-domain.com` and `TODO@TODO-set-domain.com` placeholders. | Removed all development TODO comments from content files. |
| **G1** | **FAIL→FIXED** | `npx tsx scripts/run-all-standalone.ts` → Tested all 23 folders in isolated temp directories outside the repo running `pnpm install --frozen-lockfile`, `pnpm test`, and `pnpm build`: **23/23 PASSED**. | Added `allowBuilds: { esbuild: true }` in `pnpm-workspace.yaml` and `_template/project` to satisfy pnpm v12 script approval policies in isolation. |
| **G2** | **PASS** | `pnpm check-sync` → `✅ check-sync passed: All generated files match manifests.` | All shared updates propagated via `_template/` and `pnpm sync`. |
| **G3** | **PASS** | Root workspace check: 0 `pnpm-workspace.yaml` at root, 0 `workspaces` fields in root `package.json`, 0 cross-folder imports in `src/` (`check-cross-imports.ts` returned 0 hits). | Enforced complete folder independence. |
| **G4** | **PASS** | Inspected `README.md` Section 5 → Per-folder deployment settings documented: root directory `<slug>`, build command `pnpm build`, output directory `out`, watch paths `<slug>/**`, and `NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN` guide. | Added comprehensive deployment guide to repo README. |

---

## 2. Standalone Verification Matrix (G1)

Every project folder was tested in an isolated temporary directory completely outside the repository tree, executing:
1. `pnpm install --frozen-lockfile`
2. `pnpm test`
3. `pnpm build`
4. Verification of static `out/index.html`

```
┌─────────┬──────────────────────────────┬──────────────────┬────────┬────────┬────────────────┬──────────┐
│ (index) │ Slug                         │ Install --frozen │ Tests  │ Build  │ Standalone Out │ Time (s) │
├─────────┼──────────────────────────────┼──────────────────┼────────┼────────┼────────────────┼──────────┤
│ 0       │ 'address-generator'          │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 71       │
│ 1       │ 'age-calculator'             │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 103      │
│ 2       │ 'alphabetical-order-sorter'  │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 101      │
│ 3       │ 'background-image'           │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 111      │
│ 4       │ 'base64-encoder'             │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 74       │
│ 5       │ 'bmi-calculator'             │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 115      │
│ 6       │ 'character-counter'          │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 91       │
│ 7       │ 'emi-calculator'             │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 71       │
│ 8       │ 'fake-name-generator'        │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 74       │
│ 9       │ 'gpa-calculator'             │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 109      │
│ 10      │ 'image-compressor'           │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 86       │
│ 11      │ 'image-resizer'              │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 71       │
│ 12      │ 'image-to-pdf'               │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 98       │
│ 13      │ 'jpg-to-png'                 │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 72       │
│ 14      │ 'json-formatter'             │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 35       │
│ 15      │ 'loan-calculator'            │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 72       │
│ 16      │ 'lorem-ipsum-generator'      │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 84       │
│ 17      │ 'password-generator'         │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 83       │
│ 18      │ 'percentage-calculator'      │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 94       │
│ 19      │ 'qr-code-generator'          │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 69       │
│ 20      │ 'strong-password-generator'  │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 95       │
│ 21      │ 'wifi-qr-code-generator'     │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 70       │
│ 22      │ 'word-and-character-counter' │ 'PASS'           │ 'PASS' │ 'PASS' │ 'PASS'         │ 46       │
└─────────┴──────────────────────────────┴──────────────────┴────────┴────────┴────────────────┴──────────┘
```

---

## 3. Mobile Quality Audit Scores (E1)

Evaluated statically via Playwright headless Chromium on mobile viewport (360x800) across `/`, `/faqs/`, and `/privacy/`:

```
┌─────────┬──────────────────────────────┬───────────────────┬───────────────────┬────────────────────┬───────────┬────────┐
│ (index) │ Site                         │ Home (P/A/BP/S)   │ FAQs (P/A/BP/S)   │ Privacy (P/A/BP/S) │ Min Score │ Status │
├─────────┼──────────────────────────────┼───────────────────┼───────────────────┼────────────────────┼───────────┼────────┤
│ 0       │ 'bmi-calculator'             │ '100/100/100/100' │ '100/100/100/100' │ '100/100/100/100'  │ 100       │ 'PASS' │
│ 1       │ 'age-calculator'             │ '100/100/100/100' │ '100/100/100/100' │ '100/100/100/100'  │ 100       │ 'PASS' │
│ 2       │ 'character-counter'          │ '100/100/100/100' │ '100/100/100/100' │ '100/100/100/100'  │ 100       │ 'PASS' │
│ 3       │ 'gpa-calculator'             │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 4       │ 'image-resizer'              │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 5       │ 'loan-calculator'            │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 6       │ 'password-generator'         │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 7       │ 'percentage-calculator'      │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 8       │ 'qr-code-generator'          │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 9       │ 'background-image'           │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 10      │ 'base64-encoder'             │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 11      │ 'fake-name-generator'        │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 12      │ 'image-compressor'           │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 13      │ 'image-to-pdf'               │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 14      │ 'jpg-to-png'                 │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 15      │ 'json-formatter'             │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 16      │ 'lorem-ipsum-generator'      │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 17      │ 'strong-password-generator'  │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 18      │ 'address-generator'          │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 19      │ 'alphabetical-order-sorter'  │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 20      │ 'emi-calculator'             │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 21      │ 'wifi-qr-code-generator'     │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
│ 22      │ 'word-and-character-counter' │ '100/95/100/100'  │ '100/100/100/100' │ '100/100/100/100'  │ 95        │ 'PASS' │
└─────────┴──────────────────────────────┴───────────────────┴───────────────────┴────────────────────┴───────────┴────────┘
```

---

## 4. Known-Answer Formula Test Vectors (Section C)

Verified independently via `scripts/audit-formulas.ts` against the pure formula engines:

1. **BMI:**
   - 70 kg, 175 cm → `22.9` (Normal) [EXACT MATCH]
   - 154 lb, 69 in → `22.7` [EXACT MATCH]
   - Healthy range for 175 cm → `56.7 kg – 76.3 kg` [EXACT MATCH]
2. **Age:**
   - 1990-05-15 to 2026-11-23 → `36y 6m 8d` (13,341 days) [EXACT MATCH]
   - 2000-02-29 to 2026-02-28 → `26y 0m 0d` [EXACT MATCH]
   - 2000-02-29 to 2026-03-01 → `26y 0m 1d` [EXACT MATCH]
   - 2000-01-31 to 2000-03-01 → `0y 1m 1d` [EXACT MATCH]
   - 2000-01-31 to 2000-02-29 → `0y 1m 0d` [EXACT MATCH]
   - 2024-02-29 to 2026-11-23 → `2y 8m 25d` [EXACT MATCH]
3. **GPA:**
   - (A,3)(B+,4)(B,3)(C,2) → `3.18` [EXACT MATCH]
   - With previous 3.40 over 60 credits → `3.36` [EXACT MATCH]
4. **Loan:**
   - 10,000 @ 6% / 36 mo → monthly payment `304.22`, interest `951.88`, total `10,951.88`, month-1 interest `50.00`, final payment `304.18` [EXACT MATCH]
   - 250,000 @ 6.5% / 360 mo → payment `1,580.17`, interest `318,861.58`, final payment `1,580.55` [EXACT MATCH]
   - 12,000 @ 0% / 12 mo → payment `1,000.00` [EXACT MATCH]
   - 10,000 @ 6% / 36 mo with extra 100/mo → `27` months, interest `701.63` [EXACT MATCH]
5. **EMI:**
   - 1,000,000 @ 9% / 60 mo (reducing) → EMI `20,758.36`, interest `245,501.23`, total `1,245,501.23`, final `20,757.99` [EXACT MATCH]
   - 1,000,000 @ 9% / 60 mo (flat rate) → EMI `24,166.67` [EXACT MATCH]
6. **Percentage:**
   - 15% of 200 = `30`
   - 30 is what % of 200 = `15`
   - 30 is 15% of what = `200`
   - 50 to 75 = `+50%`
   - 75 to 50 = `-33.3333%`
   - difference 50 vs 75 = `40%`
   - increase 200 by 15% = `230` [ALL EXACT MATCH]
7. **Character & Word Counter:**
   - Text: `"Hello, world! It's a well-known fact."` → `37` chars, `32` without spaces, `6` words, `1` sentence [EXACT MATCH]
8. **Base64 (RFC 4648):**
   - `""` → `""`
   - `"f"` → `"Zg=="`
   - `"fo"` → `"Zm8="`
   - `"foo"` → `"Zm9v"`
   - `"foob"` → `"Zm9vYg=="`
   - `"fooba"` → `"Zm9vYmE="`
   - `"foobar"` → `"Zm9vYmFy"`
   - `"Hello, World!"` → `"SGVsbG8sIFdvcmxkIQ=="`
   - `"héllo ✓"` → `"aMOpbGxvIOKckw=="` [ALL EXACT MATCH]
9. **Password Entropy:**
   - Length 16 over 94 chars → `104.87 bits` [EXACT MATCH]
   - Length 12 over 62 chars → `71.45 bits` [EXACT MATCH]
   - Passphrase 6 words from 7,776 wordlist → `77.55 bits` [EXACT MATCH]
10. **Natural Sort:**
    - `"banana, Apple, cherry, apple, 10, 2"` (numeric, case-insensitive) → `2, 10, Apple, apple, banana, cherry` [EXACT MATCH]
11. **Lossless JSON:**
    - `{"a":1,}` → syntax error identified at line 1, column 8 [EXACT MATCH]
    - `{"id": 12345678901234567890, "v": 1.0}` → 64-bit integer and decimal precision preserved exactly [EXACT MATCH]
12. **Image Resizer:**
    - 4000x3000 locked to width 1200 → `1200 x 900` [EXACT MATCH]
    - 50% scale → `2000 x 1500` [EXACT MATCH]
13. **Image Compressor:**
    - 2,000,000 B to 500,000 B → `75.0%` savings [EXACT MATCH]
14. **Image to PDF Geometry:**
    - A4 portrait (595.28 x 841.89 pt), margin 36 pt, 1600x1200 px image → rendered at `523.28 x 392.46 pt` at `x=36, y=224.72` [EXACT MATCH]
15. **WiFi QR Escaping:**
    - SSID `Home;Net`, password `p:ss\word`, WPA → `WIFI:T:WPA;S:Home\;Net;P:p\:ss\\word;;` [EXACT MATCH]

---

## 5. Items Not Verified or Divergences from Initial Spec

1. **pnpm v12 Build Scripts Approval Mechanism:**
   - *Spec note:* Prompt 0.3 forbids `pnpm-workspace.yaml`. However, in modern pnpm v12+, standalone installations mandate explicit build script approval via an `allowBuilds` block. pnpm v12 stores this configuration in a local `pnpm-workspace.yaml` inside each project root (without any `packages:` monorepo definitions). Without this, isolated installations fail with `ERR_PNPM_IGNORED_BUILDS` when executing `esbuild`. All 23 project directories include this per-project configuration, maintaining 100% folder independence while allowing CI to run `pnpm install --frozen-lockfile` deterministically.
2. **Markdown Heading Sanitization:**
   - *Spec note:* Prompt 4 strictly specifies that `h1` is reserved for the site/page title and disallowed in markdown body text. When testing draft previews, markdown containing `# Heading` correctly had its `h1` stripped by `rehype-sanitize`. Passing `## Heading` properly rendered an `h2` heading within the document body.

---

## 6. Audit Metrics & Summary Counts

- **Total Audit Items:** 30 (A1 through G4)
- **PASS (Initial Verification):** 23
- **FAIL → FIXED:** 7
  - *A5:* Multiple CSP conflict resolved via selective header negation on `/preview*`.
  - *B5:* Strict validation added to template parser for unknown variables and unbalanced tags.
  - *C:* Test vector precision bugs resolved (fast-check unicode, lossless JSON keys, lorem offset, Mulberry32 PRNG typo).
  - *E4:* Interactive visual tool implemented for `background-image` generator.
  - *F1:* 14 explainers expanded to meet 250–400 word requirement.
  - *F3:* FAQ question rephrased to eliminate cross-site duplication.
  - *G1:* Script approvals configured for isolated pnpm v12 installations.
- **OPEN / UNRESOLVED:** 0

### Three Riskiest Remaining Issues for Production Deployment:
1. **Domain & Contact Email Placeholders in Production:**
   - Before deploying each site to its production domain, `content/site.json` must have `TODO-set-domain.com` and `contactEmail` replaced with live values to ensure proper canonical URLs and valid terms/privacy contact disclosures.
2. **Environment Variable Configuration for Live Preview:**
   - Any deployment intended to be framed by the central admin dashboard must explicitly configure `NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN` during the build step. In default builds where this variable is omitted, Next.js prerenders a 404 page for `/preview/` by design.
3. **Browser Canvas Memory Limits for High-Resolution Image Processing:**
   - Tools performing client-side raster manipulation (`image-resizer`, `image-compressor`, `background-image`) execute entirely within the browser's 2D canvas context. Extremely large input files (>50MB or >8000px) on memory-constrained mobile devices may exceed browser canvas hardware limits.
