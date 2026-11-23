import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');
const SYNC_CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'sync.config.json'), 'utf-8'));
const slugs = Object.keys(SYNC_CONFIG);

let crossImports = 0;

for (const slug of slugs) {
  const srcDir = path.join(ROOT_DIR, slug, 'src');
  function scan(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(full, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Check for imports or requires reaching outside the folder
          if ((line.includes('import ') || line.includes('require(')) && (line.includes('../../') || line.includes('_template'))) {
            // Note: within src/shared/components, a relative import '../../' might still be inside src!
            // Let's resolve the target path to see if it escapes slug/
            const match = line.match(/from\s+['"]([^'"]+)['"]/);
            if (match) {
              const relPath = match[1];
              if (relPath.startsWith('.')) {
                const resolved = path.resolve(dir, relPath);
                const projectRoot = path.join(ROOT_DIR, slug);
                if (!resolved.startsWith(projectRoot)) {
                  console.log(`❌ Cross-folder import in ${slug}: ${entry.name}:${i+1} -> ${line.trim()}`);
                  crossImports++;
                }
              } else if (relPath.includes('_template')) {
                console.log(`❌ _template import in ${slug}: ${entry.name}:${i+1} -> ${line.trim()}`);
                crossImports++;
              }
            }
          }
        }
      }
    }
  }
  scan(srcDir);
}

console.log(`\nTotal cross-folder or _template imports detected: ${crossImports}`);

