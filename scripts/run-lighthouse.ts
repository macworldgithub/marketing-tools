import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PORT = 3300;
const OUT_DIR = path.resolve(__dirname, '..', 'bmi-calculator', 'out');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function startServer(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURI(req.url?.split('?')[0] || '/');
      if (reqPath.endsWith('/')) {
        reqPath += 'index.html';
      }

      let filePath = path.join(OUT_DIR, reqPath);
      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function runAudit() {
  const server = await startServer();
  const routes = ['/', '/faqs/', '/privacy/'];
  const results: Record<string, { performance: number; accessibility: number; bestPractices: number; seo: number }> = {};

  try {
    for (const route of routes) {
      console.log(`\n⏳ Running Lighthouse mobile audit on ${route}...`);
      const tempReport = path.resolve(__dirname, `lh-report-${route.replace(/\//g, '') || 'home'}.json`);
      
      const cmd = `npx lighthouse http://localhost:${PORT}${route} --output=json --output-path="${tempReport}" --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile=true --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu" --quiet`;

      execSync(cmd, {
        env: {
          ...process.env,
          CHROME_PATH,
        },
        stdio: 'inherit',
      });

      if (fs.existsSync(tempReport)) {
        const reportJson = JSON.parse(fs.readFileSync(tempReport, 'utf-8'));
        const cats = reportJson.categories;
        results[route] = {
          performance: Math.round((cats.performance?.score || 0) * 100),
          accessibility: Math.round((cats.accessibility?.score || 0) * 100),
          bestPractices: Math.round((cats['best-practices']?.score || 0) * 100),
          seo: Math.round((cats.seo?.score || 0) * 100),
        };
        fs.unlinkSync(tempReport);
      }
    }

    console.log('\n======================================================');
    console.log('🏆 LIGHTHOUSE MOBILE AUDIT RESULTS (Target: ≥ 95)');
    console.log('======================================================');
    console.table(results);

  } finally {
    server.close();
  }
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});

