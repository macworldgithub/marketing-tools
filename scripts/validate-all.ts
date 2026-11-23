import fs from 'node:fs';
import path from 'node:path';
import { validateContent } from '../_template/core/content/validator';

const ROOT_DIR = path.resolve(__dirname, '..');
const SYNC_CONFIG_PATH = path.join(ROOT_DIR, 'sync.config.json');

export function validateAll(): boolean {
  if (!fs.existsSync(SYNC_CONFIG_PATH)) {
    console.error('❌ sync.config.json not found');
    return false;
  }

  const syncConfig = JSON.parse(fs.readFileSync(SYNC_CONFIG_PATH, 'utf-8'));
  let hasErrors = false;

  console.log('📋 Validating content across all sites...\n');

  for (const slug of Object.keys(syncConfig)) {
    const projectDir = path.join(ROOT_DIR, slug);
    if (!fs.existsSync(projectDir)) continue;

    const result = validateContent(projectDir);
    if (!result.valid) {
      hasErrors = true;
      console.error(`❌ [${slug}] Content validation failed:`);
      for (const issue of result.issues) {
        if (issue.type === 'error') {
          console.error(`    - (${issue.file}) ${issue.message}`);
        }
      }
    } else {
      console.log(`  ✓ [${slug}] Valid`);
    }

    // Print warnings
    for (const issue of result.issues) {
      if (issue.type === 'warning') {
        console.warn(`    ⚠️  [${slug}] (${issue.file}) ${issue.message}`);
      }
    }
  }

  if (hasErrors) {
    console.error('\n❌ Content validation failed for one or more sites.');
    return false;
  }

  console.log('\n✅ All sites passed content validation.');
  return true;
}

if (require.main === module || process.argv[1]?.endsWith('validate-all.ts')) {
  const ok = validateAll();
  process.exit(ok ? 0 : 1);
}

