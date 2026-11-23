import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve(__dirname, '..');

const FOLDERS = [
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

for (const folder of FOLDERS) {
  const dir = path.join(ROOT_DIR, folder);
  console.log(`\n📦 Initializing dependencies in ${folder}...`);
  try {
    execSync('pnpm install', { cwd: dir, stdio: 'inherit' });
    try {
      execSync('pnpm approve-builds --all', { cwd: dir, stdio: 'inherit' });
    } catch {
      // It might not have unapproved builds
    }
  } catch (err: any) {
    console.error(`Error in ${folder}:`, err.message);
  }
}

// Ensure no root workspace was created
const rootWorkspace = path.join(ROOT_DIR, 'pnpm-workspace.yaml');
if (fs.existsSync(rootWorkspace)) {
  fs.unlinkSync(rootWorkspace);
}

console.log('\n✅ All folders initialized!');

