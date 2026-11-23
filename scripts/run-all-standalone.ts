import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const ROOT_DIR = path.resolve(__dirname, '..');
const SYNC_CONFIG_PATH = path.join(ROOT_DIR, 'sync.config.json');
const syncConfig = JSON.parse(fs.readFileSync(SYNC_CONFIG_PATH, 'utf-8'));
const slugs = Object.keys(syncConfig);

interface StandaloneResult {
  slug: string;
  install: 'PASS' | 'FAIL';
  test: 'PASS' | 'FAIL';
  build: 'PASS' | 'FAIL';
  standalone: 'PASS' | 'FAIL';
  durationSeconds: number;
  error?: string;
}

async function verifySlug(slug: string): Promise<StandaloneResult> {
  const projectDir = path.join(ROOT_DIR, slug);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `standalone-${slug}-`));
  const isolatedProjectDir = path.join(tempDir, slug);
  const startTime = Date.now();

  const res: StandaloneResult = {
    slug,
    install: 'FAIL',
    test: 'FAIL',
    build: 'FAIL',
    standalone: 'FAIL',
    durationSeconds: 0,
  };

  try {
    fs.cpSync(projectDir, isolatedProjectDir, {
      recursive: true,
      filter: (src) => {
        const name = path.basename(src);
        return name !== 'node_modules' && name !== '.next' && name !== 'out';
      },
    });

    // 1. pnpm install in isolation
    await execAsync('pnpm install --frozen-lockfile', { cwd: isolatedProjectDir });
    res.install = 'PASS';

    // 2. pnpm test in isolation
    await execAsync('pnpm test', { cwd: isolatedProjectDir });
    res.test = 'PASS';

    // 3. pnpm build in isolation
    await execAsync('pnpm build', { cwd: isolatedProjectDir });
    res.build = 'PASS';

    // 4. Verify out/index.html
    const outHtml = path.join(isolatedProjectDir, 'out', 'index.html');
    if (!fs.existsSync(outHtml)) {
      throw new Error(`Build finished but out/index.html is missing.`);
    }
    res.standalone = 'PASS';
  } catch (err: any) {
    res.error = err.message?.slice(0, 300) || String(err);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    res.durationSeconds = Math.round((Date.now() - startTime) / 1000);
  }

  return res;
}

async function runPool(concurrency: number) {
  console.log(`Starting standalone verification of all ${slugs.length} folders with concurrency ${concurrency}...`);
  const results: StandaloneResult[] = [];
  const queue = [...slugs];

  async function worker(workerId: number) {
    while (queue.length > 0) {
      const slug = queue.shift();
      if (!slug) break;
      console.log(`[Worker ${workerId}] Starting: ${slug}`);
      const res = await verifySlug(slug);
      console.log(`[Worker ${workerId}] Finished: ${slug} -> ${res.standalone} (${res.durationSeconds}s)`);
      results.push(res);
    }
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  // Sort by slug
  results.sort((a, b) => a.slug.localeCompare(b.slug));

  console.log('\n========================================================================================');
  console.log('🏆 G1 STANDALONE ISOLATION & BUILD AUDIT RESULTS (ALL 23 FOLDERS)');
  console.log('========================================================================================');
  console.table(
    results.map((r) => ({
      Slug: r.slug,
      'Install --frozen': r.install,
      Tests: r.test,
      Build: r.build,
      'Standalone Out': r.standalone,
      'Time (s)': r.durationSeconds,
    }))
  );

  const allPassed = results.every((r) => r.standalone === 'PASS');
  if (allPassed) {
    console.log(`\n✅ ALL ${results.length} PROJECTS FULLY PASSED STANDALONE INDEPENDENCE VERIFICATION!`);
  } else {
    console.error(`\n❌ SOME PROJECTS FAILED STANDALONE VERIFICATION!`);
    const failed = results.filter((r) => r.standalone !== 'PASS');
    console.error(JSON.stringify(failed, null, 2));
    process.exit(1);
  }
}

runPool(3).catch((err) => {
  console.error('Fatal error running standalone audit:', err);
  process.exit(1);
});

