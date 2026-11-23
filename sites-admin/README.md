# Sites Admin

A lightweight, internal web application built with **Next.js (App Router, static export)** and **TypeScript strict** to manage FAQs, Privacy Policies, Terms of Service, and Site Configuration across all 23 standalone tool websites in one central place.

Sites Admin has **zero backend, zero server actions, and zero database**. It operates entirely client-side, interacting directly with GitHub's Git Data API to read and commit changes atomically.

---

## 1. Quickstart (Under 10 Steps)

1. Clone or navigate to the repository containing `sites-admin/`:
   ```bash
   cd sites-admin
   ```
2. Ensure Node.js LTS (>= 20) and pnpm (>= 9) are installed:
   ```bash
   pnpm --version
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Run the local development server:
   ```bash
   pnpm dev
   ```
5. Open your browser and visit:
   ```
   http://localhost:3000
   ```
6. (Optional) Run the test suite:
   ```bash
   pnpm test
   ```
7. (Optional) Build static export:
   ```bash
   pnpm build
   ```

---

## 2. GitHub Token Configuration

Sites Admin communicates directly from your browser to `https://api.github.com` (which natively supports CORS).

### Generating a Fine-Grained Personal Access Token (PAT)
1. Go to **GitHub Settings** → **Developer Settings** → **Personal Access Tokens** → **Fine-grained tokens**.
2. Click **Generate new token**.
3. **Repository access:** Select *Only select repositories* and choose your tools repository (`marketing-tools` or your repo).
4. **Permissions:**
   - **Repository permissions** → **Contents**: Select **Read and write**.
   - Leave all other permissions unset (no Administration, no Workflows, no Metadata write).
5. Generate and copy the token (`github_pat_...`).

### Security & In-Browser Vault
- **In-Memory Default:** By default, your token is kept strictly in volatile browser memory and cleared when the browser tab closes.
- **Encrypted Local Storage (Optional):** If you choose "Remember on this device", your token is encrypted using **WebCrypto AES-GCM (256-bit)** with an encryption key derived from your master passphrase via **PBKDF2 (600,000 iterations)** with a cryptographic salt, and persisted in browser IndexedDB. Plaintext tokens are **never** stored in `localStorage` and never leave your browser.

---

## 3. Deployment Guidelines

Sites Admin compiles to pure static files (`sites-admin/out/`).

### Recommended Deployment Platforms
- **Cloudflare Pages:** Set build command `pnpm build` and output directory `sites-admin/out`.
- **Vercel:** Static deployment with root directory `sites-admin`.
- **Netlify:** Static publishing with publish directory `sites-admin/out`.

### Access Control (Mandatory)
Because Sites Admin is an internal administrative interface with client-side credential management, deploy it behind zero-trust access control:
- **Cloudflare Zero Trust / Cloudflare Access:** Protect the domain using Google / GitHub OAuth or corporate email OTPs.
- **Vercel Password Protection / Deployment Protection:** Restrict access to authenticated team members.

---

## 4. Host Rebuilds Per Folder

To prevent unnecessary builds across all 23 static sites whenever content changes:
1. In Cloudflare Pages / Vercel / Netlify, create **23 separate projects**, one for each tool.
2. In each project's settings:
   - **Root directory:** `<slug>` (e.g. `bmi-calculator`).
   - **Watch paths / Build filters:** `<slug>/**` (e.g. `bmi-calculator/**`).
3. When Sites Admin pushes an atomic commit modifying `bmi-calculator/content/faqs.json`, only the `bmi-calculator` project rebuilds and redeploys.

---

## 5. Architecture & Key Features

- **Storage Adapter Pattern (`ContentStore`):** All operations (`listSites`, `readFile`, `readSiteContent`, `readBaselines`, `commitBatch`, `history`, `restore`) go through the `ContentStore` interface. Currently ships with `GitHubStore` and offline `MockStore`.
- **Query-String Routing:** Uses `/site?slug=...` instead of dynamic server paths, guaranteeing 100% compatibility with static Next.js exports.
- **Strict Pre-Commit Linting & Validation:**
  - Real-time linting for forbidden `h1` titles (reserved for layout headers), heading depth (only `h2` and `h3`), required privacy sections, and conditional clauses.
  - Commits are strictly disabled if any site has validation errors.
- **Real-Time Live Preview:** Embedded split-screen iframe communicating via PostMessage Protocol v1 with responsive viewport switching (390px, 768px, 1280px), theme toggling, and fallback to local Markdown rendering on timeout.
- **Bulk Content Operations:** Find & Replace across sites, batch field updates, uniform FAQ insertion, and baseline propagation.
- **Atomic Multi-File Commits:** Commits changes across multiple files and sites as a single atomic Git commit using GitHub's Git Data API (`blobs` → `trees` → `commits` → `refs`).

---

## 6. Troubleshooting

- **Token Permissions Error:** Ensure token has `Contents: Read and write`. If private repo metadata cannot be read, verify the token has access to that specific repository.
- **CORS Issues:** GitHub's public API (`https://api.github.com`) natively supports CORS. If using GitHub Enterprise Server behind a firewall, configure an internal reverse proxy with CORS headers.
- **Merge Conflicts:** If remote changes occur while you are editing, `GitHubStore` automatically fetches the latest tree and rebases cleanly. If an unresolvable collision occurs, a modal offers to branch as a Pull Request.
- **Frame-Ancestors / CSP Errors in Live Preview:** Ensure the target tool site has `NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN` set to your admin origin (e.g. `http://localhost:3000` or `https://admin.yourdomain.com`).
