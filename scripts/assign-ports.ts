import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');
const PORTS_PATH = path.join(ROOT_DIR, 'PORTS.json');

if (!fs.existsSync(PORTS_PATH)) {
  console.error('PORTS.json not found!');
  process.exit(1);
}

const ports: Record<string, number> = JSON.parse(fs.readFileSync(PORTS_PATH, 'utf-8'));

console.log('--- Assigning dedicated ports (1500-1550) across all projects ---');

for (const [slug, port] of Object.entries(ports)) {
  const pkgPath = path.join(ROOT_DIR, slug, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.dev = `next dev -p ${port}`;
    pkg.scripts.start = `npx serve -s out -l ${port}`;
    pkg.scripts.serve = `npx serve -s out -l ${port}`;

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    console.log(`✅ ${slug.padEnd(28)} -> port ${port}`);
  } else {
    console.warn(`⚠️ Folder ${slug} has no package.json`);
  }
}

// Copy PORTS.json to sites-admin/src/lib/ports.json
const adminPortsPath = path.join(ROOT_DIR, 'sites-admin', 'src', 'lib', 'ports.json');
fs.copyFileSync(PORTS_PATH, adminPortsPath);
console.log(`✅ Copied PORTS.json to ${adminPortsPath}`);

