import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = path.resolve(__dirname, '..');
const TEMPLATE_CORE_DIR = path.join(ROOT_DIR, '_template', 'core');
const TEMPLATE_ENGINES_DIR = path.join(ROOT_DIR, '_template', 'engines');
const SYNC_CONFIG_PATH = path.join(ROOT_DIR, 'sync.config.json');

interface SyncConfig {
  [slug: string]: {
    engines: string[];
  };
}

function getHeader(filePath: string): string {
  const ext = path.extname(filePath);
  if (ext === '.css') {
    return '/* GENERATED from _template — do not edit here */\n';
  }
  return '// GENERATED from _template — do not edit here\n';
}

function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}

function copyDirectoryWithHeaders(
  sourceDir: string,
  destDir: string,
  sourceRelativePath: string
): { files: Record<string, string>; aggregateHash: string } {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const manifestFiles: Record<string, string> = {};
  const hashCollector: string[] = [];

  function walk(currentSrc: string, currentDest: string, relPath: string) {
    const entries = fs.readdirSync(currentSrc, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.sync-manifest.json') continue;

      const srcEntryPath = path.join(currentSrc, entry.name);
      const destEntryPath = path.join(currentDest, entry.name);
      const entryRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (!fs.existsSync(destEntryPath)) {
          fs.mkdirSync(destEntryPath, { recursive: true });
        }
        walk(srcEntryPath, destEntryPath, entryRelPath);
      } else if (entry.isFile()) {
        const rawContent = fs.readFileSync(srcEntryPath, 'utf-8');
        const header = getHeader(srcEntryPath);
        const outputContent = header + rawContent;
        fs.writeFileSync(destEntryPath, outputContent, 'utf-8');

        const fileHash = calculateHash(outputContent);
        manifestFiles[entryRelPath] = fileHash;
        hashCollector.push(`${entryRelPath}:${fileHash}`);
      }
    }
  }

  walk(sourceDir, destDir, '');

  hashCollector.sort();
  const aggregateHash = calculateHash(hashCollector.join('\n'));

  const manifest = {
    source: sourceRelativePath,
    timestamp: new Date().toISOString(),
    files: manifestFiles,
    aggregateHash,
  };

  fs.writeFileSync(
    path.join(destDir, '.sync-manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  return { files: manifestFiles, aggregateHash };
}

export function syncAll() {
  if (!fs.existsSync(SYNC_CONFIG_PATH)) {
    throw new Error('sync.config.json not found');
  }

  const syncConfig: SyncConfig = JSON.parse(fs.readFileSync(SYNC_CONFIG_PATH, 'utf-8'));

  console.log('🔄 Starting sync from _template...');

  for (const [slug, config] of Object.entries(syncConfig)) {
    const projectDir = path.join(ROOT_DIR, slug);
    if (!fs.existsSync(projectDir)) {
      console.warn(`Project folder "${slug}" does not exist, skipping.`);
      continue;
    }

    console.log(`\n📦 Syncing ${slug}...`);

    // 1. Sync _template/core -> <slug>/src/shared
    const sharedDestDir = path.join(projectDir, 'src', 'shared');
    copyDirectoryWithHeaders(TEMPLATE_CORE_DIR, sharedDestDir, '_template/core');
    console.log(`  ✓ Synced _template/core -> src/shared`);

    // 2. Sync listed engines -> <slug>/src/engines/<name>
    for (const engineName of config.engines) {
      const engineSrcDir = path.join(TEMPLATE_ENGINES_DIR, engineName);
      if (!fs.existsSync(engineSrcDir)) {
        throw new Error(`Engine "${engineName}" not found in _template/engines/`);
      }
      const engineDestDir = path.join(projectDir, 'src', 'engines', engineName);
      copyDirectoryWithHeaders(engineSrcDir, engineDestDir, `_template/engines/${engineName}`);
      console.log(`  ✓ Synced _template/engines/${engineName} -> src/engines/${engineName}`);
    }
  }

  console.log('\n✅ Sync complete.');
}

if (require.main === module || process.argv[1]?.endsWith('sync.ts')) {
  syncAll();
}

