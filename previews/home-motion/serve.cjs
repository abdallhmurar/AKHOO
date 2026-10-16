/* global __dirname */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.AKHOO_PREVIEW_PORT || 4178);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.ttf': 'font/ttf', '.mp4': 'video/mp4' };
const mapAssets = new Set(['maplibre-gl.mjs', 'maplibre-gl-shared.mjs', 'maplibre-gl-worker.mjs', 'maplibre-gl.css']);
const mapRoot = path.resolve(root, '../../node_modules/maplibre-gl/dist');
const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end(); return; }
  if (['/requester', '/helper', '/activity'].includes(pathname)) { response.writeHead(302, { Location: `${pathname}/` }); response.end(); return; }
  const relative = pathname === '/' ? 'index.html' : ['/requester/', '/helper/', '/activity/'].includes(pathname) ? `${pathname.slice(1)}index.html` : pathname.slice(1);
  const vendorName = relative.startsWith('vendor/') ? relative.slice(7) : '';
  const isMapAsset = mapAssets.has(vendorName);
  const file = isMapAsset ? path.join(mapRoot, vendorName) : path.resolve(root, relative);
  const withinRoot = path.relative(root, file);
  const allowed = ['index.html', 'styles.css', 'preview.js', 'requester/index.html', 'requester/styles.css', 'requester/preview.js', 'requester/location-map.js', 'helper/index.html', 'helper/styles.css', 'helper/preview.js', 'helper/map.js', 'activity/index.html', 'activity/styles.css', 'activity/preview.js'].includes(relative)
    || relative.startsWith('assets/') || relative.startsWith('requester/assets/') || relative.startsWith('helper/assets/') || relative.startsWith('activity/assets/');
  if (!isMapAsset && (withinRoot.startsWith('..') || path.isAbsolute(withinRoot) || !allowed)) {
    response.writeHead(404); response.end(); return;
  }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { response.writeHead(404); response.end(); return; }
    const mapPage = relative.startsWith('requester/') || relative.startsWith('helper/') || isMapAsset;
    const policy = mapPage
      ? "default-src 'self'; img-src 'self' blob: data: https://tiles.openfreemap.org; media-src 'self'; font-src 'self'; style-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self' https://tiles.openfreemap.org; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
      : "default-src 'self'; img-src 'self' blob:; media-src 'self'; font-src 'self'; style-src 'self'; script-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
    const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': policy };
    let start = 0;
    let end = stat.size - 1;
    let status = 200;
    if (request.method === 'GET' && request.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (match && (match[1] || match[2])) {
        start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
        end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
      } else start = stat.size;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) {
        response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); response.end(); return;
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
      headers['Content-Length'] = end - start + 1;
    }
    response.writeHead(status, headers);
    if (request.method === 'HEAD') { response.end(); return; }
    fs.createReadStream(file, { start, end }).on('error', () => response.destroy()).pipe(response);
  });
});
server.listen(port, '127.0.0.1', () => console.log(`AKHOO local preview: http://127.0.0.1:${port}`));
