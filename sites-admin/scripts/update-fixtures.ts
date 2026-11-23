import fs from 'node:fs';
import path from 'node:path';

const SITES_ADMIN_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SITES_ADMIN_DIR, '..');
const FIXTURES_DIR = path.join(SITES_ADMIN_DIR, 'tests', 'fixtures');

function replaceH1(filePath: string) {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  
  if (content.startsWith('# Privacy Policy for {{siteName}}')) {
    content = '## Privacy Policy for {{siteName}}' + content.slice('# Privacy Policy for {{siteName}}'.length);
    changed = true;
  }
  if (content.startsWith('# Terms of Service for {{siteName}}')) {
    content = '## Terms of Service for {{siteName}}' + content.slice('# Terms of Service for {{siteName}}'.length);
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated h1 -> h2 in: ${filePath}`);
    return true;
  }
  return false;
}

// 1. Update fixtures
function walkDir(dir: string, cb: (file: string) => void) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'out' && entry.name !== '.next') {
        walkDir(full, cb);
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      cb(full);
    }
  }
}

console.log('--- Updating fixtures ---');
walkDir(FIXTURES_DIR, replaceH1);

console.log('--- Updating _shared in repo root ---');
replaceH1(path.join(REPO_ROOT, '_shared', 'privacy.master.md'));
replaceH1(path.join(REPO_ROOT, '_shared', 'terms.master.md'));

console.log('--- Updating tool sites content in repo root ---');
walkDir(REPO_ROOT, (filePath) => {
  if (filePath.includes('sites-admin') || filePath.includes('.git') || filePath.includes('node_modules')) return;
  if (filePath.endsWith('privacy.md') || filePath.endsWith('terms.md')) {
    replaceH1(filePath);
  }
});

// 2. Regenerate default-fixtures.ts
console.log('--- Regenerating default-fixtures.ts ---');
const filesToBundle: Record<string, string> = {};

function collectFixtures(dir: string, baseDir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFixtures(full, baseDir);
    } else if (entry.isFile()) {
      const relPath = path.relative(baseDir, full).replace(/\\/g, '/');
      const content = fs.readFileSync(full, 'utf-8');
      filesToBundle[relPath] = content;
    }
  }
}

collectFixtures(FIXTURES_DIR, FIXTURES_DIR);

const tsContent = `export const DEFAULT_MOCK_FILES: Record<string, string> = ${JSON.stringify(filesToBundle, null, 2)};\n`;
fs.writeFileSync(path.join(SITES_ADMIN_DIR, 'src', 'lib', 'store', 'default-fixtures.ts'), tsContent, 'utf-8');
console.log(`Generated default-fixtures.ts with ${Object.keys(filesToBundle).length} files.`);
