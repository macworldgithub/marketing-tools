import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { syncAll } from './sync';

const ROOT_DIR = path.resolve(__dirname, '..');
const TEMPLATE_PROJECT_DIR = path.join(ROOT_DIR, '_template', 'project');
const SHARED_DIR = path.join(ROOT_DIR, '_shared');

const REMAINING_SLUGS = [
  'background-image',
  'base64-encoder',
  'fake-name-generator',
  'image-compressor',
  'image-to-pdf',
  'jpg-to-png',
  'json-formatter',
  'lorem-ipsum-generator',
  'strong-password-generator',
  'address-generator',
  'alphabetical-order-sorter',
  'emi-calculator',
  'wifi-qr-code-generator',
  'word-and-character-counter',
];

function toTitleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function scaffoldSites() {
  console.log(`Scaffolding ${REMAINING_SLUGS.length} sites...`);

  for (const slug of REMAINING_SLUGS) {
    const targetDir = path.join(ROOT_DIR, slug);
    if (!fs.existsSync(targetDir)) {
      console.log(`Creating directory for ${slug}...`);
      fs.cpSync(TEMPLATE_PROJECT_DIR, targetDir, { recursive: true });

      // Update package.json name
      const pkgPath = path.join(targetDir, 'package.json');
      let pkgContent = fs.readFileSync(pkgPath, 'utf-8');
      pkgContent = pkgContent.replace('"{{slug}}"', `"${slug}"`);
      fs.writeFileSync(pkgPath, pkgContent, 'utf-8');

      // Copy golden pnpm-lock.yaml
      const goldenLock = path.join(TEMPLATE_PROJECT_DIR, 'pnpm-lock.yaml');
      if (fs.existsSync(goldenLock)) {
        fs.copyFileSync(goldenLock, path.join(targetDir, 'pnpm-lock.yaml'));
      }

      // Copy privacy and terms baselines
      fs.copyFileSync(
        path.join(SHARED_DIR, 'privacy.master.md'),
        path.join(targetDir, 'content', 'privacy.md')
      );
      fs.copyFileSync(
        path.join(SHARED_DIR, 'terms.master.md'),
        path.join(targetDir, 'content', 'terms.md')
      );

      // Create initial site.json placeholder
      const title = toTitleCase(slug);
      const siteConfig = {
        schemaVersion: 1,
        slug,
        siteName: title,
        toolName: title,
        primaryKeyword: slug.replace(/-/g, ' '),
        domain: 'TODO-set-domain.com',
        tagline: `Fast and reliable ${slug.replace(/-/g, ' ')} running completely in your browser.`,
        contactEmail: 'TODO@TODO-set-domain.com',
        accent: 'blue',
        effectiveDate: '2026-11-23',
        features: {
          ads: false,
          analytics: 'none',
          localStorageKeys: ['theme'],
        },
      };
      fs.writeFileSync(
        path.join(targetDir, 'content', 'site.json'),
        JSON.stringify(siteConfig, null, 2),
        'utf-8'
      );
    }
  }

  // Delete root pnpm-workspace.yaml if created accidentally
  const rootWorkspace = path.join(ROOT_DIR, 'pnpm-workspace.yaml');
  if (fs.existsSync(rootWorkspace)) {
    fs.unlinkSync(rootWorkspace);
  }

  console.log('Running syncAll across all 23 sites...');
  syncAll();
  console.log('✅ All sites scaffolded and synced!');
}

scaffoldSites();
