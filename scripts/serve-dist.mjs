// Minimal static file server for the exported web build (dist/), used by
// the Playwright E2E suite and for local preview. Node-only, no deps, so
// it runs the same on CI (ubuntu) and locally.
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
}

http
  .createServer(async (req, res) => {
    const rel = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '')
    let path = join(DIST, rel)
    try {
      const body = await readFile(path)
      res.setHeader('Content-Type', TYPES[extname(path)] ?? 'application/octet-stream')
      res.end(body)
    } catch {
      // SPA fallback → index.html (deep links / client routing)
      try {
        res.setHeader('Content-Type', 'text/html')
        res.end(await readFile(join(DIST, 'index.html')))
      } catch {
        res.statusCode = 404
        res.end('not found')
      }
    }
  })
  .listen(PORT, () => console.log(`serving dist/ on http://localhost:${PORT}`))
