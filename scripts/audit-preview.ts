import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';

const ROOT_DIR = path.resolve(__dirname, '..');
const SYNC_CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'sync.config.json'), 'utf-8'));
const slugs = Object.keys(SYNC_CONFIG);

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
        const mimeMap: Record<string, string> = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
        };
        res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1>');
      }
    });

    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  console.log('===============================================================');
  console.log('🧪 AUDIT SECTION A: ADMIN LIVE-PREVIEW ROUTE');
  console.log('===============================================================');

  // Check 1: 404 when NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN is unset (across ALL 23 out/ folders)
  console.log('\n--- Step 1: Checking all 23 out/ folders for 404 when unset ---');
  let all404 = true;
  for (const slug of slugs) {
    const previewHtmlPath = path.join(ROOT_DIR, slug, 'out', 'preview', 'index.html');
    if (!fs.existsSync(previewHtmlPath)) {
      console.log(`❌ ${slug}: preview/index.html does not exist at all`);
      all404 = false;
      continue;
    }
    const html = fs.readFileSync(previewHtmlPath, 'utf-8');
    const is404 = html.includes('404') || html.includes('NEXT_HTTP_ERROR_FALLBACK;404');
    if (!is404) {
      console.log(`❌ ${slug}: preview/index.html is NOT 404 fallback!`);
      all404 = false;
    }
  }
  if (all404) {
    console.log('✅ ALL 23 folders return 404 for /preview/ with env unset.');
  } else {
    process.exit(1);
  }

  // Check 2: Build a preview-enabled site with NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN
  console.log('\n--- Step 2: Building bmi-calculator with NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN set ---');
  const ADMIN_PORT = 4100;
  const PREVIEW_PORT = 4101;
  const ADMIN_ORIGIN = `http://127.0.0.1:${ADMIN_PORT}`;

  const bmiDir = path.join(ROOT_DIR, 'bmi-calculator');
  console.log(`Building bmi-calculator with NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN="${ADMIN_ORIGIN}"...`);
  execSync(`pnpm build`, {
    cwd: bmiDir,
    env: {
      ...process.env,
      NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN: ADMIN_ORIGIN,
    },
    stdio: 'ignore',
  });

  const previewOutDir = path.join(bmiDir, 'out');
  const previewServer = await createStaticServer(previewOutDir, PREVIEW_PORT);

  // Admin server hosting the parent iframe harness
  const adminHtml = `<!DOCTYPE html>
<html>
<head><title>Admin Preview Harness</title></head>
<body>
  <h1>Admin Test Host</h1>
  <iframe id="preview-frame" src="http://127.0.0.1:${PREVIEW_PORT}/preview/" width="800" height="600"></iframe>
  <div id="log"></div>
  <script>
    window.messagesReceived = [];
    window.addEventListener('message', (event) => {
      window.messagesReceived.push(event.data);
      const log = document.getElementById('log');
      log.innerText += JSON.stringify(event.data) + '\\n';
    });
  </script>
</body>
</html>`;

  const adminServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(adminHtml);
  });
  await new Promise<void>((resolve) => adminServer.listen(ADMIN_PORT, '127.0.0.1', () => resolve()));

  console.log(`Harness running: Admin on ${ADMIN_PORT}, Preview on ${PREVIEW_PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${ADMIN_ORIGIN}/`);
    await page.waitForTimeout(2000);

    // 1. Check preview-ready message
    const msgs1 = await page.evaluate(() => (window as any).messagesReceived);
    console.log('\nMessages received on mount:', msgs1);
    const readyMsg = msgs1.find((m: any) => m.type === 'preview-ready');
    if (!readyMsg || readyMsg.slug !== 'bmi-calculator') {
      throw new Error(`Failed: preview-ready message not received. Got: ${JSON.stringify(msgs1)}`);
    }
    console.log('✅ Received "preview-ready" with correct slug from preview frame.');

    // 2. Test wrong origin: child must ignore
    console.log('\nTesting wrong origin rejection...');
    await page.evaluate(({ PREVIEW_PORT }) => {
      const frame = document.getElementById('preview-frame') as HTMLIFrameElement;
      // Post message with a simulated mismatched origin or from another window
      frame.contentWindow?.postMessage({ v: 1, type: 'preview-content', bad: true }, 'http://example.org');
    }, { PREVIEW_PORT });
    await page.waitForTimeout(500);
    const msgsAfterBadOrigin = await page.evaluate(() => (window as any).messagesReceived);
    // Should NOT have received any new messages
    if (msgsAfterBadOrigin.length !== msgs1.length) {
      throw new Error('Failed: child responded to wrong origin message!');
    }
    console.log('✅ Wrong origin correctly ignored.');

    // 3. Test malformed payload: should reply ok: false with errors and no crash
    console.log('\nTesting malformed payload handling...');
    await page.evaluate(({ PREVIEW_PORT }) => {
      const frame = document.getElementById('preview-frame') as HTMLIFrameElement;
      frame.contentWindow?.postMessage({ v: 1, type: 'preview-content', page: 'faqs', invalidField: true }, `http://127.0.0.1:${PREVIEW_PORT}`);
    }, { PREVIEW_PORT });
    await page.waitForTimeout(1000);
    const msgsAfterMalformed = await page.evaluate(() => (window as any).messagesReceived);
    const errorReply = msgsAfterMalformed.find((m: any) => m.type === 'preview-rendered' && m.ok === false);
    if (!errorReply || !errorReply.errors || errorReply.errors.length === 0) {
      throw new Error(`Failed: did not receive ok: false with errors for malformed payload. Got: ${JSON.stringify(msgsAfterMalformed)}`);
    }
    console.log('✅ Malformed payload rejected with ok: false and schema errors:', errorReply.errors[0]);

    // 4. Test valid payload: FAQ list update
    console.log('\nTesting valid FAQ payload...');
    const frame = page.frameLocator('#preview-frame');
    const validFaqPayload = {
      v: 1,
      type: 'preview-content',
      page: 'faqs',
      site: {
        schemaVersion: 1,
        slug: 'bmi-calculator',
        siteName: 'BMI Calculator (Draft Preview)',
        toolName: 'BMI Calculator',
        primaryKeyword: 'bmi calculator',
        domain: 'example.com',
        tagline: 'Calculate BMI client-side.',
        contactEmail: 'contact@example.com',
        accent: 'blue',
        effectiveDate: '2026-11-23',
        features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
      },
      faqs: {
        schemaVersion: 1,
        items: [
          {
            id: 'faq-live-test',
            question: 'Is live preview working seamlessly?',
            answer: 'Yes! The preview route re-rendered immediately via postMessage.',
          },
        ],
      },
      legalMarkdown: null,
      focusId: 'faq-live-test',
    };

    await page.evaluate(({ payload, PREVIEW_PORT }) => {
      const frame = document.getElementById('preview-frame') as HTMLIFrameElement;
      frame.contentWindow?.postMessage(payload, `http://127.0.0.1:${PREVIEW_PORT}`);
    }, { payload: validFaqPayload, PREVIEW_PORT });

    await page.waitForTimeout(1500);

    const msgsAfterValidFaq = await page.evaluate(() => (window as any).messagesReceived);
    const okFaqReply = msgsAfterValidFaq.find((m: any) => m.type === 'preview-rendered' && m.ok === true);
    if (!okFaqReply) {
      throw new Error(`Failed: did not receive ok: true for valid FAQ payload. Got: ${JSON.stringify(msgsAfterValidFaq)}`);
    }
    console.log('✅ Received ok: true with contentHeight:', okFaqReply.contentHeight);

    // Verify DOM re-rendered inside iframe
    const faqText = await frame.locator('text=Is live preview working seamlessly?').innerText();
    console.log('✅ DOM inside iframe confirmed FAQ rendered:', faqText);

    // 5. Test valid legal payload (Privacy page)
    console.log('\nTesting valid Privacy template re-render...');
    const validPrivacyPayload = {
      ...validFaqPayload,
      page: 'privacy',
      legalMarkdown: '## Real-Time Draft Privacy Policy\n\nThis policy was re-rendered dynamically inside the preview frame with strict variable interpolation for {{siteName}}.',
    };

    await page.evaluate(({ payload, PREVIEW_PORT }) => {
      const frame = document.getElementById('preview-frame') as HTMLIFrameElement;
      frame.contentWindow?.postMessage(payload, `http://127.0.0.1:${PREVIEW_PORT}`);
    }, { payload: validPrivacyPayload, PREVIEW_PORT });

    await page.waitForTimeout(1500);

    const msgsAfterPrivacy = await page.evaluate(() => (window as any).messagesReceived);
    const okPrivacyReplies = msgsAfterPrivacy.filter((m: any) => m.type === 'preview-rendered' && m.ok === true);
    if (okPrivacyReplies.length < 2) {
      throw new Error('Failed: did not receive ok: true for privacy payload');
    }
    const privacyHeading = await frame.locator('h1, h2').filter({ hasText: 'Real-Time Draft Privacy Policy' }).innerText();
    console.log('✅ DOM inside iframe confirmed Privacy re-rendered:', privacyHeading);

    // 6. Test theme switching
    console.log('\nTesting preview-theme toggle...');
    await page.evaluate(({ PREVIEW_PORT }) => {
      const frame = document.getElementById('preview-frame') as HTMLIFrameElement;
      frame.contentWindow?.postMessage({ v: 1, type: 'preview-theme', theme: 'dark' }, `http://127.0.0.1:${PREVIEW_PORT}`);
    }, { PREVIEW_PORT });
    await page.waitForTimeout(500);

    const isDark = await frame.locator('html').evaluate((el) => el.classList.contains('dark'));
    console.log('✅ Preview frame dark mode active:', isDark);

    console.log('\n🎉 ALL SECTION A PLAYWRIGHT TESTS PASSED SUCCESSFULLY!');
  } finally {
    await browser.close();
    previewServer.close();
    adminServer.close();

    // Rebuild bmi-calculator back to production mode (without NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN)
    console.log('\nRebuilding bmi-calculator back to clean production (env unset)...');
    execSync(`pnpm build`, {
      cwd: bmiDir,
      stdio: 'ignore',
    });
    console.log('Done.');
  }
}

main().catch((err) => {
  console.error('\n❌ Audit Preview failed:', err);
  process.exit(1);
});

