import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, 'dist');
const host = '127.0.0.1';
const port = 4173;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function send(response, statusCode, body, contentType) {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

async function resolveFile(urlPath) {
  const safePath = decodeURIComponent(urlPath.split('?')[0]);
  const relativePath = safePath === '/' ? '/index.html' : safePath;
  const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(rootDir, normalizedPath);

  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch {
    filePath = path.join(rootDir, 'index.html');
  }

  return filePath;
}

const server = http.createServer(async (request, response) => {
  try {
    const filePath = await resolveFile(request.url || '/');
    const fileBuffer = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extension] || 'application/octet-stream';

    send(response, 200, fileBuffer, contentType);
  } catch (error) {
    send(response, 500, `Server error: ${error.message}`, 'text/plain; charset=utf-8');
  }
});

server.listen(port, host, () => {
  console.log(`Preview server running at http://${host}:${port}/`);
});
