import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve(__dirname, '..');
const SYNC_CONFIG_PATH = path.join(ROOT_DIR, 'sync.config.json');

const command = process.argv[2];
if (!command) {
  console.error('❌ Usage: pnpm each "<command>"');
  process.exit(1);
}

const syncConfig = JSON.parse(fs.readFileSync(SYNC_CONFIG_PATH, 'utf-8'));

for (const slug of Object.keys(syncConfig)) {
  const projectDir = path.join(ROOT_DIR, slug);
  if (!fs.existsSync(projectDir)) continue;

  console.log(`\n========================================`);
  console.log(`▶ Running in ${slug}: ${command}`);
  console.log(`========================================`);

  try {
    execSync(command, {
      cwd: projectDir,
      stdio: 'inherit',
      shell: process.platform === 'win32' ? 'powershell' : '/bin/sh',
    });
  } catch (err: any) {
    console.error(`❌ Command failed in ${slug}: ${err.message}`);
    process.exit(1);
  }
}

