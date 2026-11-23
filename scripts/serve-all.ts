import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve(__dirname, '..');
const PORTS_FILE = path.join(ROOT_DIR, 'PORTS.json');

if (!fs.existsSync(PORTS_FILE)) {
  console.error('PORTS.json not found!');
  process.exit(1);
}

const ports: Record<string, number> = JSON.parse(fs.readFileSync(PORTS_FILE, 'utf-8'));
const HOST = process.env.HOST || '0.0.0.0';
const AUTO_BUILD = process.argv.includes('--build');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function createStaticServer(slug: string, outDir: string, port: number): http.Server {
  const server = http.createServer((req, res) => {
    let reqUrl = decodeURI(req.url?.split('?')[0] || '/');
    if (reqUrl.endsWith('/')) reqUrl += 'index.html';

    let filePath = path.join(outDir, reqUrl);

    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      }
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      // Basic caching headers
      let cacheControl = 'public, max-age=3600';
      if (ext === '.html') {
        cacheControl = 'no-cache, must-revalidate';
      } else if (filePath.includes('/_next/static/') || ext === '.png' || ext === '.svg') {
        cacheControl = 'public, max-age=31536000, immutable';
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
      });

      fs.createReadStream(filePath).pipe(res);
    } else {
      // 404 handler
      const notFoundPath = path.join(outDir, '404.html');
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(notFoundPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style="font-family:sans-serif;padding:40px;text-align:center;"><h1>404 Not Found</h1><p>The requested static file was not found on ${slug}.</p></body></html>`);
      }
    }
  });

  server.listen(port, HOST, () => {
    console.log(`🚀 [${slug.padEnd(28)}] -> http://${HOST}:${port}`);
  });

  return server;
}

async function main() {
  console.log(`========================================================================`);
  console.log(`  SERVE-ALL: Running all 24 projects on dedicated ports 1500-1550       `);
  console.log(`  Host binding: ${HOST}                                                 `);
  console.log(`========================================================================\n`);

  const servers: http.Server[] = [];

  for (const [slug, port] of Object.entries(ports)) {
    const projectDir = path.join(ROOT_DIR, slug);
    const outDir = path.join(projectDir, 'out');

    if (!fs.existsSync(projectDir)) {
      console.warn(`⚠️ Project directory not found: ${projectDir}`);
      continue;
    }

    if (!fs.existsSync(outDir) || !fs.existsSync(path.join(outDir, 'index.html'))) {
      if (AUTO_BUILD) {
        console.log(`📦 [${slug}] out/ folder missing. Running build...`);
        try {
          execSync('pnpm build', { cwd: projectDir, stdio: 'inherit' });
        } catch (err: any) {
          console.error(`❌ Build failed for ${slug}:`, err.message);
          continue;
        }
      } else {
        console.warn(`⚠️ [${slug.padEnd(28)}] out/ missing. (Run 'pnpm build' in ${slug} or use --build)`);
        // Still bind server to serve informative 404 placeholder
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(
          path.join(outDir, 'index.html'),
          `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;"><h1>${slug}</h1><p>Static build not yet generated. Run <code>pnpm build</code> in this folder.</p></body></html>`,
          'utf-8'
        );
      }
    }

    const server = createStaticServer(slug, outDir, port);
    servers.push(server);
  }

  console.log(`\n✅ All ${servers.length} projects successfully serving on ports 1500-1550!`);
  console.log(`Press Ctrl+C to terminate all servers.\n`);

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nGracefully shutting down all servers...');
    for (const s of servers) {
      s.close();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error in serve-all:', err);
  process.exit(1);
});
