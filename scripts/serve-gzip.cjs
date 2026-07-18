const http = require('http');
const fs = require('fs');
const path = require('path');
const { createGzip } = require('zlib');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 4180;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  const data = fs.readFileSync(filePath);

  const accept = req.headers['accept-encoding'] || '';
  if (accept.includes('gzip') && (ext === '.js' || ext === '.css' || ext === '.html' || ext === '.json')) {
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Encoding': 'gzip',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    const gzip = createGzip();
    gzip.end(data);
    gzip.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(data);
  }
});

server.listen(PORT, () => console.log(`Gzip server on http://localhost:${PORT}`));
