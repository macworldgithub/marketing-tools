import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Discover site domains from parent tools repository if available
const PARENT_DIR = path.resolve(ROOT_DIR, '..');
const siteOrigins: string[] = ['http://localhost:*', 'http://127.0.0.1:*'];

try {
  const syncConfigPath = path.join(PARENT_DIR, 'sync.config.json');
  if (fs.existsSync(syncConfigPath)) {
    const syncConfig = JSON.parse(fs.readFileSync(syncConfigPath, 'utf-8'));
    for (const slug of Object.keys(syncConfig)) {
      const siteJsonPath = path.join(PARENT_DIR, slug, 'content', 'site.json');
      if (fs.existsSync(siteJsonPath)) {
        const site = JSON.parse(fs.readFileSync(siteJsonPath, 'utf-8'));
        if (site.domain && !site.domain.includes('TODO')) {
          siteOrigins.push(`https://${site.domain}`);
        }
      }
    }
  }
} catch {}

const frameSrc = Array.from(new Set(siteOrigins)).join(' ');

const headersContent = `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.github.com; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; frame-src 'self' ${frameSrc};
`;

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
fs.writeFileSync(path.join(PUBLIC_DIR, '_headers'), headersContent);

if (fs.existsSync(OUT_DIR)) {
  fs.writeFileSync(path.join(OUT_DIR, '_headers'), headersContent);
}

console.log('✅ Generated sites-admin _headers security configuration.');

