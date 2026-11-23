import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = path.resolve(__dirname, '..');
const SYNC_CONFIG_PATH = path.join(ROOT_DIR, 'sync.config.json');

function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}

export function checkSync(): boolean {
  if (!fs.existsSync(SYNC_CONFIG_PATH)) {
    console.error('❌ sync.config.json not found');
    return false;
  }

  const syncConfig = JSON.parse(fs.readFileSync(SYNC_CONFIG_PATH, 'utf-8'));
  let hasErrors = false;

  console.log('🔍 Checking sync integrity against manifests...');

  for (const [slug, config] of Object.entries(syncConfig) as [string, { engines: string[] }][]) {
    const projectDir = path.join(ROOT_DIR, slug);
    if (!fs.existsSync(projectDir)) {
      console.error(`❌ Project folder "${slug}" is listed in sync.config.json but does not exist.`);
      hasErrors = true;
      continue;
    }

    const checkDirAgainstManifest = (dirPath: string, label: string) => {
      const manifestPath = path.join(dirPath, '.sync-manifest.json');
      if (!fs.existsSync(manifestPath)) {
        console.error(`❌ Missing .sync-manifest.json in ${label} (${dirPath})`);
        hasErrors = true;
        return;
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      for (const [relFile, expectedHash] of Object.entries(manifest.files) as [string, string][]) {
        const fullFilePath = path.join(dirPath, relFile);
        if (!fs.existsSync(fullFilePath)) {
          console.error(`❌ File missing in ${label}: ${relFile}`);
          hasErrors = true;
          continue;
        }

        const currentContent = fs.readFileSync(fullFilePath, 'utf-8');
        const currentHash = calculateHash(currentContent);
        if (currentHash !== expectedHash) {
          console.error(`❌ File modified or out of date in ${label}: ${relFile}`);
          hasErrors = true;
        }
      }
    };

    // Check shared
    const sharedDir = path.join(projectDir, 'src', 'shared');
    checkDirAgainstManifest(sharedDir, `${slug}/src/shared`);

    // Check engines
    for (const engine of config.engines) {
      const engineDir = path.join(projectDir, 'src', 'engines', engine);
      checkDirAgainstManifest(engineDir, `${slug}/src/engines/${engine}`);
    }
  }

  if (hasErrors) {
    console.error('\n❌ check-sync failed: Drifts or manual edits detected. Run `pnpm sync` to re-sync.');
    return false;
  }

  console.log('\n✅ check-sync passed: All generated files match manifests.');
  return true;
}

if (require.main === module || process.argv[1]?.endsWith('check-sync.ts')) {
  const ok = checkSync();
  process.exit(ok ? 0 : 1);
}

