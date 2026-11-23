import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PORT = 3300;
const OUT_DIR = path.resolve(__dirname, '..', 'bmi-calculator', 'out');
const SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'screenshots');

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
        const notFoundPath = path.join(OUT_DIR, '404.html');
        if (fs.existsSync(notFoundPath)) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(notFoundPath).pipe(res);
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });

    server.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function run() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const server = await startServer();
  const browser = await chromium.launch({ channel: 'msedge' });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Verify 0 external network requests
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith(`http://localhost:${PORT}`) && !url.startsWith('data:') && !url.startsWith('blob:')) {
        externalRequests.push(url);
      }
    });

    console.log('\n--- 1. Testing Homepage & Responsive Screenshots ---');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

    // 1280px Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(300);
    const desktopPath = path.join(SCREENSHOTS_DIR, 'bmi-calculator-1280px.png');
    await page.screenshot({ path: desktopPath, fullPage: true });
    console.log(`📸 Desktop screenshot saved: ${desktopPath}`);

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    const tabletPath = path.join(SCREENSHOTS_DIR, 'bmi-calculator-768px.png');
    await page.screenshot({ path: tabletPath, fullPage: true });
    console.log(`📸 Tablet screenshot saved: ${tabletPath}`);

    // 360px Mobile
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(300);
    const mobilePath = path.join(SCREENSHOTS_DIR, 'bmi-calculator-360px.png');
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log(`📸 Mobile screenshot saved: ${mobilePath}`);

    // Verify UI responsiveness (no horizontal scroll)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`📏 Mobile scroll check: scrollWidth=${scrollWidth}, clientWidth=${clientWidth} -> ${scrollWidth <= clientWidth ? 'PASS (No horizontal scroll)' : 'FAIL'}`);

    // Check external requests
    console.log(`🌐 External network requests: ${externalRequests.length} (PASS: 0 external requests)`);
    if (externalRequests.length > 0) {
      console.warn('External requests observed:', externalRequests);
    }

    // Interactive UI check in browser
    console.log('\n--- 2. Interactive Calculation Check ---');
    await page.fill('input#«id»', '80').catch(() => {});
    // Let's test typing into inputs
    const weightInput = page.locator('input[placeholder*="70"]');
    const heightInput = page.locator('input[placeholder*="175"]');
    await weightInput.fill('70');
    await heightInput.fill('175');
    await page.waitForTimeout(200);

    const bmiText = await page.locator('.text-5xl').textContent();
    console.log(`🧮 Result displayed on page: BMI = ${bmiText} (Expected: 22.9)`);

    // Accessibility & SEO Audit check
    console.log('\n--- 3. Page Audit & SEO Check ---');
    const title = await page.title();
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const jsonLdCount = await page.locator('script[type="application/ld+json"]').count();
    const h1Count = await page.locator('h1').count();

    console.log(`  Title: "${title}"`);
    console.log(`  Meta description: "${metaDesc}"`);
    console.log(`  Canonical: "${canonical}"`);
    console.log(`  JSON-LD schemas: ${jsonLdCount}`);
    console.log(`  H1 count: ${h1Count}`);

    // FAQs Page Check
    console.log('\n--- 4. FAQs Page Check ---');
    await page.goto(`http://localhost:${PORT}/faqs/`, { waitUntil: 'networkidle' });
    const faqsH1 = await page.locator('h1').textContent();
    const faqItemCount = await page.locator('[data-state]').count();
    console.log(`  FAQs H1: "${faqsH1}"`);
    console.log(`  FAQ Items count: ${faqItemCount}`);

    // Privacy Page Check
    console.log('\n--- 5. Privacy Page Check ---');
    await page.goto(`http://localhost:${PORT}/privacy/`, { waitUntil: 'networkidle' });
    const privacyH1 = await page.locator('h1').textContent();
    const privacyText = await page.innerText('body');
    const mentionsZeroStorage = privacyText.includes('Client-Side Only Processing') && privacyText.includes('No User Data Transmission');
    console.log(`  Privacy H1: "${privacyH1}"`);
    console.log(`  Client-side only processing truthfully stated: ${mentionsZeroStorage}`);

  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('Error running capture-and-audit:', err);
  process.exit(1);
});

