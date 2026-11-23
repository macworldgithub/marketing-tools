import fs from 'node:fs';
import path from 'node:path';
import { syncAll } from './sync';

const ROOT_DIR = path.resolve(__dirname, '..');
const TEMPLATE_PROJECT_DIR = path.join(ROOT_DIR, '_template', 'project');
const SHARED_DIR = path.join(ROOT_DIR, '_shared');
const SYNC_CONFIG_PATH = path.join(ROOT_DIR, 'sync.config.json');

function toTitleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function newSite(slug: string, options: { engine?: string; accent?: string } = {}) {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    console.error('❌ Error: slug must be a valid kebab-case string.');
    process.exit(1);
  }

  const targetDir = path.join(ROOT_DIR, slug);
  if (fs.existsSync(targetDir)) {
    console.error(`❌ Error: directory "${slug}" already exists.`);
    process.exit(1);
  }

  console.log(`🚀 Creating new site: ${slug}...`);

  // 1. Copy _template/project to targetDir
  fs.cpSync(TEMPLATE_PROJECT_DIR, targetDir, { recursive: true });

  // 2. Customize package.json
  const pkgPath = path.join(targetDir, 'package.json');
  let pkgContent = fs.readFileSync(pkgPath, 'utf-8');
  pkgContent = pkgContent.replace('"{{slug}}"', `"${slug}"`);
  fs.writeFileSync(pkgPath, pkgContent, 'utf-8');

  // 3. Customize content/site.json
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
    accent: options.accent || 'blue',
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

  // 4. Copy _shared baselines to content/
  fs.copyFileSync(
    path.join(SHARED_DIR, 'privacy.master.md'),
    path.join(targetDir, 'content', 'privacy.md')
  );
  fs.copyFileSync(
    path.join(SHARED_DIR, 'terms.master.md'),
    path.join(targetDir, 'content', 'terms.md')
  );

  // 5. Create default src/tool/index.tsx placeholder
  const toolDir = path.join(targetDir, 'src', 'tool');
  if (!fs.existsSync(toolDir)) {
    fs.mkdirSync(toolDir, { recursive: true });
  }
  const defaultToolTsx = `'use client';

import React from 'react';

export const Tool: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        ${title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400">
        Tool implementation in progress.
      </p>
    </div>
  );
};
`;
  fs.writeFileSync(path.join(toolDir, 'index.tsx'), defaultToolTsx, 'utf-8');

  // 6. Update sync.config.json
  const syncConfig = JSON.parse(fs.readFileSync(SYNC_CONFIG_PATH, 'utf-8'));
  if (!syncConfig[slug]) {
    syncConfig[slug] = {
      engines: options.engine ? [options.engine] : [],
    };
    fs.writeFileSync(SYNC_CONFIG_PATH, JSON.stringify(syncConfig, null, 2), 'utf-8');
  }

  // 7. Run sync
  syncAll();

  console.log(`\n✨ Site "${slug}" created successfully!`);
}

const argSlug = process.argv[2];
if (require.main === module || (process.argv[1]?.endsWith('new-site.ts') && argSlug)) {
  newSite(argSlug);
}

