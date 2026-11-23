import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve(__dirname, '..');
const SYNC_CONFIG_PATH = path.join(ROOT_DIR, 'sync.config.json');

export function verifyStandalone(targetSlug?: string): boolean {
  const syncConfig = JSON.parse(fs.readFileSync(SYNC_CONFIG_PATH, 'utf-8'));
  const slugs = targetSlug ? [targetSlug] : Object.keys(syncConfig);

  for (const slug of slugs) {
    const projectDir = path.join(ROOT_DIR, slug);
    if (!fs.existsSync(projectDir)) {
      console.error(`❌ Project folder "${slug}" does not exist.`);
      return false;
    }

    console.log(`\n🧪 Testing standalone independence for: ${slug}`);

    // Create an isolated temporary directory completely outside the repo
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `standalone-${slug}-`));
    const isolatedProjectDir = path.join(tempDir, slug);

    try {
      console.log(`  → Copying ${slug} to clean isolated environment: ${isolatedProjectDir}`);
      fs.cpSync(projectDir, isolatedProjectDir, {
        recursive: true,
        filter: (src) => {
          const name = path.basename(src);
          return name !== 'node_modules' && name !== '.next' && name !== 'out';
        },
      });

      console.log(`  → Running pnpm install in isolation...`);
      execSync('pnpm install --frozen-lockfile', {
        cwd: isolatedProjectDir,
        stdio: 'inherit',
      });

      console.log(`  → Running pnpm test in isolation...`);
      execSync('pnpm test', {
        cwd: isolatedProjectDir,
        stdio: 'inherit',
      });

      console.log(`  → Running pnpm build in isolation...`);
      execSync('pnpm build', {
        cwd: isolatedProjectDir,
        stdio: 'inherit',
      });

      // Verify that out/index.html was produced
      const outHtml = path.join(isolatedProjectDir, 'out', 'index.html');
      if (!fs.existsSync(outHtml)) {
        throw new Error(`Build finished but out/index.html is missing.`);
      }

      console.log(`  ✅ Successfully verified ${slug} standalone build!`);
    } catch (err: any) {
      console.error(`\n❌ Standalone verification failed for ${slug}: ${err.message}`);
      return false;
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
  }

  return true;
}

const target = process.argv[2];
if (require.main === module || process.argv[1]?.endsWith('verify-standalone.ts')) {
  const ok = verifyStandalone(target);
  process.exit(ok ? 0 : 1);
}

