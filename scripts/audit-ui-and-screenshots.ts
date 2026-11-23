import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium, Browser, Page } from 'playwright';

const ROOT_DIR = path.resolve(__dirname, '..');
const SYNC_CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'sync.config.json'), 'utf-8'));
const slugs = Object.keys(SYNC_CONFIG);

const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function createStaticServer(siteSlug: string): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const outDir = path.join(ROOT_DIR, siteSlug, 'out');
    const server = http.createServer((req, res) => {
      let reqPath = req.url?.split('?')[0] || '/';
      if (reqPath.endsWith('/')) reqPath += 'index.html';
      const filePath = path.join(outDir, reqPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const mimeMap: Record<string, string> = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.ico': 'image/x-icon',
          '.woff2': 'font/woff2',
        };
        res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        const notFoundPath = path.join(outDir, '404.html');
        if (fs.existsSync(notFoundPath)) {
          fs.createReadStream(notFoundPath).pipe(res);
        } else {
          res.end('<h1>404 Not Found</h1>');
        }
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port;
      resolve({ server, port });
    });
  });
}

function getRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgb(str: string): [number, number, number] {
  const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  return [0, 0, 0];
}

async function runAudit() {
  console.log('=== STARTING UI, NETWORK BOUNDARY & CONTRAST AUDIT ===\n');

  const browser = await chromium.launch({ headless: true });
  const results: any[] = [];

  for (const slug of slugs) {
    const { server, port } = await createStaticServer(slug);
    const siteUrl = `http://127.0.0.1:${port}`;
    const slugScreenshotDir = path.join(SCREENSHOTS_DIR, slug);
    if (!fs.existsSync(slugScreenshotDir)) {
      fs.mkdirSync(slugScreenshotDir, { recursive: true });
    }

    const page = await browser.newPage();
    const externalRequests: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith(siteUrl) && !url.startsWith('data:') && !url.startsWith('blob:')) {
        externalRequests.push(url);
      }
    });

    try {
      // 1. Check Home at 1280px, 768px, 360px
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${siteUrl}/`, { waitUntil: 'networkidle' });
      const hasHorizontalScroll1280 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      await page.screenshot({ path: path.join(slugScreenshotDir, 'home-1280px.png'), fullPage: false });

      await page.setViewportSize({ width: 768, height: 1024 });
      const hasHorizontalScroll768 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      await page.screenshot({ path: path.join(slugScreenshotDir, 'home-768px.png'), fullPage: false });

      await page.setViewportSize({ width: 360, height: 740 });
      const hasHorizontalScroll360 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      await page.screenshot({ path: path.join(slugScreenshotDir, 'home-360px.png'), fullPage: false });

      // 2. Interact with tool once
      try {
        const interactive = page.locator('main input:visible, main textarea:visible, main button:visible').first();
        if (await interactive.count() > 0) {
          await interactive.click({ timeout: 1500 });
        }
      } catch {
        // Element click not required to block audit
      }

      // 3. Visit /faqs/ and /privacy/
      await page.goto(`${siteUrl}/faqs/`, { waitUntil: 'networkidle' });
      await page.goto(`${siteUrl}/privacy/`, { waitUntil: 'networkidle' });

      // 4. Check dark mode contrast
      await page.goto(`${siteUrl}/`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.documentElement.classList.add('dark'));

      const contrastRatio = await page.evaluate(() => {
        const body = document.body;
        const h1 = document.querySelector('h1') || document.body;
        const fg = window.getComputedStyle(h1).color;
        const bg = window.getComputedStyle(body).backgroundColor;
        return { fg, bg };
      });

      const fgRgb = parseRgb(contrastRatio.fg);
      const bgRgb = parseRgb(contrastRatio.bg);
      const contrast = getContrastRatio(fgRgb, bgRgb);

      results.push({
        slug,
        hScroll360: hasHorizontalScroll360 ? 'FAIL' : 'PASS',
        hScroll768: hasHorizontalScroll768 ? 'FAIL' : 'PASS',
        hScroll1280: hasHorizontalScroll1280 ? 'FAIL' : 'PASS',
        darkModeContrast: contrast.toFixed(2),
        contrastPass: contrast >= 4.5 ? 'PASS' : 'FAIL',
        externalRequestsCount: externalRequests.length,
        networkPass: externalRequests.length === 0 ? 'PASS' : 'FAIL',
      });
    } catch (err: any) {
      results.push({
        slug,
        error: err.message,
      });
    } finally {
      await page.close();
      await new Promise<void>((res) => server.close(() => res()));
    }
  }

  await browser.close();
  console.table(results);
}

runAudit().catch(console.error);

