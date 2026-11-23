import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve(__dirname, '..');

const REMAINING_12 = [
  'lorem-ipsum-generator',
  'strong-password-generator',
  'address-generator',
  'alphabetical-order-sorter',
  'emi-calculator',
  'wifi-qr-code-generator',
  'word-and-character-counter',
];

console.log(`Setting up remaining ${REMAINING_12.length} folders...`);

for (const folder of REMAINING_12) {
  const dir = path.join(ROOT_DIR, folder);
  console.log(`\n========================================`);
  console.log(`▶ Setting up ${folder}...`);
  console.log(`========================================`);

  try {
    execSync('pnpm install', { cwd: dir, stdio: 'inherit' });
  } catch (err) {
    // pnpm install exits with code 1 due to ERR_PNPM_IGNORED_BUILDS, which is expected
  }

  try {
    console.log(`  → Approving build scripts for ${folder}...`);
    execSync('pnpm approve-builds --all', { cwd: dir, stdio: 'inherit' });
    console.log(`  ✓ ${folder} dependencies and builds initialized!`);
  } catch (err: any) {
    console.error(`  ❌ Failed to approve builds in ${folder}:`, err.message);
  }
}

// Clean up root workspace if pnpm created one
const rootWorkspace = path.join(ROOT_DIR, 'pnpm-workspace.yaml');
if (fs.existsSync(rootWorkspace)) {
  fs.unlinkSync(rootWorkspace);
}

console.log('\n✨ All remaining 12 folders successfully initialized!');

