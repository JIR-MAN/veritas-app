// Minimal static server for the exported web build (SPA fallback to index.html).
const http = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { join, extname, normalize } = require('node:path');
const root = join(__dirname, '..', 'dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.wasm': 'application/wasm' };
function start(port = 8089) {
  const server = http.createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let p = normalize(join(root, url));
    if (!p.startsWith(root)) return res.writeHead(403).end();
    try {
      if ((await stat(p)).isDirectory()) p = join(p, 'index.html');
    } catch {
      p = join(root, 'index.html');
    }
    try {
      const body = await readFile(p);
      res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}
module.exports = { start };
if (require.main === module) start(+process.argv[2] || 8089).then(() => console.log('serving dist'));
