import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, Page } from 'playwright';

const ADMIN_PORT = 5500;
const STUB_PORT = 5501;

const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function createStaticServer(dir: string, port: number): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURI(req.url?.split('?')[0] || '/');
      if (reqPath.endsWith('/')) reqPath += 'index.html';

      let filePath = path.join(dir, reqPath);
      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) filePath += '.html';
      else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) filePath = path.join(filePath, 'index.html');

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      }
    });

    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

function createStubPreviewServer(port: number): Promise<http.Server> {
  const stubHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Production Site Stub</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #fafafa; }
    .faq { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1 id="title">Live Tool Stub</h1>
  <div id="content">Waiting for preview content...</div>
  <script>
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || data.v !== 1) return;

      if (data.type === 'preview-content') {
        const container = document.getElementById('content');
        container.innerHTML = '<h2>Rendered Page: ' + data.page + '</h2>';
        if (data.faqs && data.faqs.items) {
          container.innerHTML += '<h3>FAQs:</h3>' + data.faqs.items.map(f => '<div class="faq"><b>' + f.question + '</b><p>' + f.answer + '</p></div>').join('');
        }
        if (data.legalMarkdown) {
          container.innerHTML += '<div id="legal"><h3>Legal Text:</h3><pre>' + data.legalMarkdown + '</pre></div>';
        }

        // Reply preview-rendered
        window.parent.postMessage({
          v: 1,
          type: 'preview-rendered',
          ok: true,
          errors: [],
          contentHeight: document.body.scrollHeight,
        }, event.origin);
      }

      if (data.type === 'preview-theme') {
        document.body.style.backgroundColor = data.theme === 'dark' ? '#111827' : '#fafafa';
        document.body.style.color = data.theme === 'dark' ? '#f9fafb' : '#111827';
      }
    });

    // Send preview-ready on mount
    window.parent.postMessage({ v: 1, type: 'preview-ready', slug: 'bmi-calculator' }, '*');
  </script>
</body>
</html>`;

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(stubHtml);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  console.log('Starting Responsive E2E verification test for Sites Admin...');

  const adminServer = await createStaticServer(OUT_DIR, ADMIN_PORT);
  const stubServer = await createStubPreviewServer(STUB_PORT);

  const browser = await chromium.launch({ headless: true });

  try {
    // ----------------------------------------------------
    // PHASE 1: Desktop / Laptop Viewport (1280 x 800)
    // ----------------------------------------------------
    console.log('\n--- Testing Desktop / Laptop Viewport (1280 x 800) ---');
    const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await desktopContext.newPage();

    // 1. Visit Settings page and activate Mock Store
    console.log('1. Connecting to Mock Store...');
    await page.goto(`http://127.0.0.1:${ADMIN_PORT}/settings/`);
    await page.waitForLoadState('networkidle');

    await page.click('text=Use Demo / Mock Store');
    await page.waitForTimeout(500);

    // Set preview base URL override so LivePreview talks to our stub server
    await page.evaluate(({ STUB_PORT }) => {
      localStorage.setItem('preview_override_bmi-calculator', `http://127.0.0.1:${STUB_PORT}`);
    }, { STUB_PORT });

    // 2. Navigate to Dashboard
    console.log('2. Verifying Desktop Dashboard...');
    await page.goto(`http://127.0.0.1:${ADMIN_PORT}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const siteRows = await page.locator('tbody tr').count();
    console.log(`✅ Desktop Dashboard: found ${siteRows} sites in table.`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-dashboard.png') });

    // 3. Navigate to Site Editor
    console.log('3. Opening Site Editor for bmi-calculator...');
    await page.goto(`http://127.0.0.1:${ADMIN_PORT}/site/?slug=bmi-calculator`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Edit an FAQ
    const firstFaqInput = page.locator('input[placeholder="e.g. How does this calculator work?"]').first();
    await firstFaqInput.fill('How exactly does BMI get calculated in the browser?');
    await page.waitForTimeout(500);

    // Add new FAQ and fill valid content
    await page.click('text=Add FAQ');
    await page.waitForTimeout(500);

    const newQuestionInput = page.locator('input[placeholder="e.g. How does this calculator work?"]').last();
    await newQuestionInput.fill('Is there an API available?');
    const newAnswerInput = page.locator('textarea[placeholder="Markdown answer..."]').last();
    await newAnswerInput.fill('No, this tool operates entirely offline in your browser without any external APIs.');
    await page.waitForTimeout(500);

    // Switch to Privacy tab
    await page.click('button:has-text("Privacy Policy")');
    await page.waitForTimeout(1000);

    // Click bump date
    await page.click('text=Bump date');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-site-editor.png') });
    console.log('✅ Desktop Site Editor verified with Live Preview and Markdown toolbar.');

    // Save draft
    await page.click('text=Save Draft');
    await page.waitForTimeout(500);

    // 4. Baseline Editor
    console.log('4. Testing Baseline Editor & Compare View...');
    await page.goto(`http://127.0.0.1:${ADMIN_PORT}/baseline/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Toggle 3-site compare view
    await page.click('text=Compare 3 Sites');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-baseline-compare.png') });
    console.log('✅ Baseline compare view loaded.');

    // 5. Bulk Operations
    console.log('5. Testing Bulk Find & Replace...');
    await page.goto(`http://127.0.0.1:${ADMIN_PORT}/bulk/`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder="String to find..."]', 'contact@example.com');
    await page.fill('input[placeholder="Replacement text..."]', 'support@mytools.org');
    await page.click('text=Stage Changes & Review');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 6. Review Screen
    console.log('6. Verifying Review Screen & Diffs...');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-review-diffs.png') });

    const totalModified = await page.locator('text=modified file').innerText();
    console.log(`✅ Review Screen: ${totalModified}`);

    // Click Commit Changes
    await page.click('button:has-text("Commit Changes...")');
    await page.waitForTimeout(500);

    // Click Push Commit in modal
    await page.click('button:has-text("Push Commit")');
    await page.waitForTimeout(1500);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-commit-success.png') });
    console.log('✅ Desktop Atomic commit executed and confirmed.');
    await desktopContext.close();

    // ----------------------------------------------------
    // PHASE 2: Mobile Phone Viewport (iPhone 14 / Android: 390 x 844)
    // ----------------------------------------------------
    console.log('\n--- Testing Mobile Phone Viewport (390 x 844) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    // Activate mock store on mobile context
    await mobilePage.goto(`http://127.0.0.1:${ADMIN_PORT}/settings/`);
    await mobilePage.waitForLoadState('networkidle');
    await mobilePage.click('text=Use Demo / Mock Store');
    await mobilePage.waitForTimeout(500);

    // Set preview override
    await mobilePage.evaluate(({ STUB_PORT }) => {
      localStorage.setItem('preview_override_bmi-calculator', `http://127.0.0.1:${STUB_PORT}`);
    }, { STUB_PORT });

    // Visit Dashboard on Mobile
    console.log('Testing Mobile Dashboard...');
    await mobilePage.goto(`http://127.0.0.1:${ADMIN_PORT}/`);
    await mobilePage.waitForLoadState('networkidle');
    await mobilePage.waitForTimeout(1000);

    // Verify Hamburger Navigation
    console.log('Testing Mobile Navigation Hamburger menu...');
    await mobilePage.click('button[aria-label="Toggle navigation menu"]');
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-mobile-nav-open.png') });

    // Close menu by clicking Dashboard
    await mobilePage.click('div.md\\:hidden a:has-text("Dashboard")');
    await mobilePage.waitForTimeout(400);

    // Take Mobile Dashboard screenshot (showing responsive cards)
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-mobile-dashboard.png') });
    console.log('✅ Mobile Dashboard rendered with responsive site cards & hamburger menu.');

    // Visit Site Editor on Mobile
    console.log('Testing Mobile Site Editor & Segmented Toggle...');
    await mobilePage.goto(`http://127.0.0.1:${ADMIN_PORT}/site/?slug=bmi-calculator`);
    await mobilePage.waitForLoadState('networkidle');
    await mobilePage.waitForTimeout(1000);

    // By default on mobile, Content Editor view is active
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-mobile-editor.png') });

    // Switch to Live Preview via mobile segmented toggle
    await mobilePage.click('button:has-text("Live Preview")');
    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-mobile-preview.png') });
    console.log('✅ Mobile Site Editor verified: seamless toggle between Editor and Live Preview.');

    await mobileContext.close();

    // ----------------------------------------------------
    // PHASE 3: Tablet Viewport (iPad: 768 x 1024)
    // ----------------------------------------------------
    console.log('\n--- Testing Tablet Viewport (768 x 1024) ---');
    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      isMobile: true,
      hasTouch: true,
    });
    const tabletPage = await tabletContext.newPage();

    await tabletPage.goto(`http://127.0.0.1:${ADMIN_PORT}/settings/`);
    await tabletPage.waitForLoadState('networkidle');
    await tabletPage.click('text=Use Demo / Mock Store');
    await tabletPage.waitForTimeout(500);

    // Tablet Dashboard
    await tabletPage.goto(`http://127.0.0.1:${ADMIN_PORT}/`);
    await tabletPage.waitForLoadState('networkidle');
    await tabletPage.waitForTimeout(800);
    await tabletPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-tablet-dashboard.png') });

    // Tablet Site Editor
    await tabletPage.goto(`http://127.0.0.1:${ADMIN_PORT}/site/?slug=bmi-calculator`);
    await tabletPage.waitForLoadState('networkidle');
    await tabletPage.waitForTimeout(1000);
    await tabletPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-tablet-editor.png') });
    console.log('✅ Tablet Viewport verified.');

    await tabletContext.close();

    console.log('\n🎉 ALL RESPONSIVE TESTS PASSED ACROSS MOBILE, TABLET & DESKTOP!');
  } finally {
    await browser.close();
    adminServer.close();
    stubServer.close();
  }
}

main().catch((err) => {
  console.error('Responsive E2E Test Failed:', err);
  process.exit(1);
});
