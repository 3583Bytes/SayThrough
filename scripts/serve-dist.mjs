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
  // Only extension-less paths under /app/ are client-side routes worth handing
  // the SPA shell. A missing asset must 404 rather than come back as the shell
  // with the asset's own content type — that turns a missing symbol or bundle
  // into a passing request, which is exactly the failure a test is looking for.
  const isApp = r.startsWith('app/') && extname(r) === ''
  const candidates = [
    { path: join(DIST, r), status: 200 },
    { path: join(DIST, r, 'index.html'), status: 200 },
    // fall back: /app/* → the app SPA shell; everything else → marketing 404.
    // GitHub Pages serves 404.html with a real 404 status, so mirror that —
    // answering 200 here would hide a missing page from any test that checks.
    isApp
      ? { path: join(DIST, 'app', 'index.html'), status: 200 }
      : { path: join(DIST, '404.html'), status: 404 },
  ]
  for (const { path, status } of candidates) {
    try {
      return { path, status, body: await readFile(path) }
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
    res.statusCode = hit.status
    res.setHeader('Content-Type', TYPES[extname(hit.path)] ?? 'application/octet-stream')
    res.end(hit.body)
  })
  .listen(PORT, () => console.log(`serving dist/ on http://localhost:${PORT}`))
