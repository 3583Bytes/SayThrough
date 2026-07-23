// Post-processes the Expo web export (dist/) into an installable PWA:
// 1. Injects manifest + iOS meta tags into index.html (plain-metro Expo
//    has no HTML template hook)
// 2. Injects the hashed bundle paths into sw.js's precache list
// 3. Copies index.html → 404.html (SPA fallback for GitHub Pages)
// Runs as part of `npm run build`.

import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const dist = 'dist'

// 1. index.html head injection
const headTags = [
  '<link rel="manifest" href="manifest.json">',
  '<meta name="theme-color" content="#4CAF50">',
  '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="SayThrough">',
].join('')
const htmlPath = join(dist, 'index.html')
let html = await readFile(htmlPath, 'utf8')
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${headTags}</head>`)
  await writeFile(htmlPath, html)
}

// 2. sw.js precache list — shell + hashed JS bundles + PWA statics
const jsDir = join(dist, '_expo', 'static', 'js', 'web')
const bundles = (await readdir(jsDir)).map((f) => `_expo/static/js/web/${f}`)
const precache = [
  'index.html',
  'manifest.json',
  'favicon.ico',
  'icons/icon-192.png',
  'icons/icon-512.png',
  ...bundles,
]
const swPath = join(dist, 'sw.js')
let sw = await readFile(swPath, 'utf8')
sw = sw.replace(
  '/*__PRECACHE__*/',
  `, ${precache.map((url) => JSON.stringify(url)).join(', ')}`,
)
await writeFile(swPath, sw)

// 3. SPA fallback
await copyFile(htmlPath, join(dist, '404.html'))

console.log(`postbuild-web: manifest injected, ${precache.length} precache URLs, 404.html written`)
