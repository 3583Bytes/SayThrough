// Minimal static file server for the build output (dist/), used by the
// Playwright E2E suite and for local preview. Node-only, no deps, so it runs
// the same on CI (ubuntu) and locally. Serves the marketing site at the root
// and the Expo app under /app/, resolving directory URLs to index.html.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist')
const PORT = Number(process.env.PORT ?? 8090)
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.css': 'text/css',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
}

async function resolve(rawUrl) {
  let r = normalize(decodeURIComponent(rawUrl))
    .replace(/^(\.\.[/\\])+/, '')
    .replace(/^\/+/, '')
  if (r === '') r = 'index.html'
  else if (r.endsWith('/')) r += 'index.html'
  const candidates = [
    join(DIST, r),
    join(DIST, r, 'index.html'),
    // fall back: /app/* → the app SPA shell; everything else → marketing 404
    r.startsWith('app/') ? join(DIST, 'app', 'index.html') : join(DIST, '404.html'),
  ]
  for (const path of candidates) {
    try {
      return { path, body: await readFile(path) }
    } catch {}
  }
  return null
}

http
  .createServer(async (req, res) => {
    const hit = await resolve((req.url ?? '/').split('?')[0])
    if (!hit) {
      res.statusCode = 404
      res.end('not found')
      return
    }
    res.setHeader('Content-Type', TYPES[extname(hit.path)] ?? 'application/octet-stream')
    res.end(hit.body)
  })
  .listen(PORT, () => console.log(`serving dist/ on http://localhost:${PORT}`))
