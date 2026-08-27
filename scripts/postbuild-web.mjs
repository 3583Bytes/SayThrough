// Post-processes the Expo web export into an installable PWA. The app is
// exported under dist/app/ (it lives at the /app/ URL); the marketing site
// at the root is authored separately in site/ and copied by build-site.mjs.
//   1. Injects manifest + iOS meta tags into the app's index.html
//   2. Injects the hashed bundle paths into sw.js's precache list
// The app page is marked noindex — the marketing pages at / are the indexed,
// crawlable entry points (with the rich SEO + share tags).
// Runs as part of `npm run build`.

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const dist = 'dist/app'
const APP_URL = 'https://saythrough.com/app/'

const headTags = [
  '<link rel="manifest" href="manifest.json">',
  '<meta name="theme-color" content="#4CAF50">',
  '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="SayThrough">',
  '<meta name="description" content="The SayThrough app — a free, open AAC communication tool.">',
  `<link rel="canonical" href="${APP_URL}">`,
  // The bare app shell is a tool, not a content page — index the marketing
  // pages at / instead so they aren't out-competed by an empty SPA.
  '<meta name="robots" content="noindex">',
].join('')

// Minimal no-JS fallback that points to the marketing site.
const noscript =
  'You need to enable JavaScript to use the SayThrough app. Learn more at ' +
  '<a href="https://saythrough.com/">saythrough.com</a>.'

const htmlPath = join(dist, 'index.html')
let html = await readFile(htmlPath, 'utf8')
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${headTags}</head>`)
}
html = html.replace('You need to enable JavaScript to run this app.', noscript)
await writeFile(htmlPath, html)

// sw.js precache — shell + hashed JS bundles + PWA statics (paths are
// relative, so they resolve under /app/ automatically).
const jsDir = join(dist, '_expo', 'static', 'js', 'web')
const bundles = (await readdir(jsDir)).map((f) => `_expo/static/js/web/${f}`)

// Fonts must be precached, not left to stale-while-revalidate. App.tsx will
// not render until useFonts resolves, so a font missing from the cache means
// the app sits on its splash screen offline — which is exactly what happened
// once storage pressure evicted them.
async function findFonts(dir, prefix = '') {
  const found = []
  for (const entry of await readdir(join(dist, dir), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) found.push(...(await findFonts(join(dir, entry.name), rel)))
    else if (entry.name.endsWith('.ttf')) found.push(`assets/${rel}`)
  }
  return found
}
const fonts = await findFonts('assets').catch(() => [])
const precache = [
  'index.html',
  'manifest.json',
  'favicon.ico',
  'icons/icon-192.png',
  'icons/icon-512.png',
  ...bundles,
  ...fonts,
]
const swPath = join(dist, 'sw.js')
let sw = await readFile(swPath, 'utf8')
sw = sw.replace(
  '/*__PRECACHE__*/',
  `, ${precache.map((url) => JSON.stringify(url)).join(', ')}`,
)
await writeFile(swPath, sw)

console.log(`postbuild-web: app under dist/app — manifest injected, ${precache.length} precache URLs (${fonts.length} fonts)`)
