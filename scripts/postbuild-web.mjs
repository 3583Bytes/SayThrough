// Post-processes the Expo web export (dist/) into an installable PWA:
// 1. Injects manifest + iOS meta tags into index.html (plain-metro Expo
//    has no HTML template hook)
// 2. Injects the hashed bundle paths into sw.js's precache list
// 3. Copies index.html → 404.html (SPA fallback for GitHub Pages)
// Runs as part of `npm run build`.

import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const dist = 'dist'

// 1. index.html head injection — PWA + SEO. The app is a client-rendered
// SPA, so the shell is what non-JS crawlers and social scrapers see; these
// tags give them a title, description, share preview, and structured data.
const SITE_URL = 'https://saythrough.com'
const TITLE = 'SayThrough — Free AAC Communication App'
const DESCRIPTION =
  'SayThrough is a free, open-source AAC app that lets nonspeaking and ' +
  'minimally verbal people communicate by tapping symbols and words that ' +
  'are spoken aloud. Works offline on any device — no subscription, no account.'
const OG_IMAGE = `${SITE_URL}/icons/icon-512.png`

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SayThrough',
  applicationCategory: 'EducationalApplication',
  applicationSubCategory: 'Augmentative and Alternative Communication (AAC)',
  operatingSystem: 'Web, iOS, Android',
  description: DESCRIPTION,
  url: `${SITE_URL}/`,
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

const headTags = [
  // PWA
  '<link rel="manifest" href="manifest.json">',
  '<meta name="theme-color" content="#4CAF50">',
  '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="SayThrough">',
  // SEO
  `<meta name="description" content="${DESCRIPTION}">`,
  `<link rel="canonical" href="${SITE_URL}/">`,
  '<meta name="robots" content="index, follow">',
  // Open Graph (Facebook, LinkedIn, iMessage, …)
  '<meta property="og:type" content="website">',
  '<meta property="og:site_name" content="SayThrough">',
  `<meta property="og:title" content="${TITLE}">`,
  `<meta property="og:description" content="${DESCRIPTION}">`,
  `<meta property="og:url" content="${SITE_URL}/">`,
  `<meta property="og:image" content="${OG_IMAGE}">`,
  // Twitter/X
  '<meta name="twitter:card" content="summary">',
  `<meta name="twitter:title" content="${TITLE}">`,
  `<meta name="twitter:description" content="${DESCRIPTION}">`,
  `<meta name="twitter:image" content="${OG_IMAGE}">`,
  // Structured data
  `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
].join('')

// Marketing content for crawlers/users without JavaScript (the SPA shell
// is otherwise empty until the bundle mounts).
const noscript = [
  '<h1>SayThrough — Free AAC Communication App</h1>',
  '<p>SayThrough is a free, open-source AAC (Augmentative and Alternative ',
  'Communication) app. It helps people who are nonspeaking or have limited ',
  'speech communicate by tapping symbols and words that are spoken aloud.</p>',
  '<ul>',
  '<li>Completely free — no subscription and no account required</li>',
  '<li>Works offline on any device: phone, tablet, Chromebook, or computer</li>',
  '<li>Symbol-based communication plus a built-in keyboard and text-to-speech</li>',
  '<li>Made for AAC users and the parents, teachers, and speech-language ',
  'pathologists who support them</li>',
  '</ul>',
  '<p>Please enable JavaScript to start using SayThrough.</p>',
].join('')

const htmlPath = join(dist, 'index.html')
let html = await readFile(htmlPath, 'utf8')
if (!html.includes('property="og:title"')) {
  html = html.replace('</head>', `${headTags}</head>`)
}
html = html.replace('<title>SayThrough</title>', `<title>${TITLE}</title>`)
html = html.replace('You need to enable JavaScript to run this app.', noscript)
await writeFile(htmlPath, html)

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
