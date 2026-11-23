import fs from 'node:fs';
import path from 'node:path';
import { loadSite } from '../src/shared/content/loader';
import { generateHeadersConfig } from '../src/shared/utils/csp';

const site = loadSite(process.cwd());
const headersContent = generateHeadersConfig(site);

// Write to public/_headers
const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(path.join(publicDir, '_headers'), headersContent);

// Also write to out/_headers if out/ exists after build
const outDir = path.resolve(process.cwd(), 'out');
if (fs.existsSync(outDir)) {
  fs.writeFileSync(path.join(outDir, '_headers'), headersContent);
}

console.log('✅ Generated _headers security configuration.');

