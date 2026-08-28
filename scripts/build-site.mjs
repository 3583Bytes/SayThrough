// Renders the marketing site from templates + per-language content into the
// build output at the root, alongside the Expo app under dist/app/. Runs last
// in `npm run build`.
//
// §19.7 — the site ships in the same four languages as the app. The pages are
// GENERATED rather than hand-authored per language: four languages × six pages
// is twenty-four files, and keeping those in sync by hand guarantees drift.
// Same shape as the app's i18n — `_content/en.json` is canonical and the build
// fails on a key that any language is missing.
//
// URL structure is a path prefix per language (`/`, `/es/`, `/pl/`, `/pt/`),
// each a real static file with its own canonical, hreflang and OG tags. That
// is what makes them crawlable; GitHub Pages cannot vary a response by
// Accept-Language, and a JS redirect on `/` would hide the localised pages
// from search entirely. Detection is a SUGGESTION only — see site/lang.js.

import { cp, copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const site = join(root, 'site')
const dist = join(root, 'dist')
const ORIGIN = 'https://saythrough.com'

// Language code → URL prefix and the `<html lang>` / hreflang value. English
// is unprefixed because it was there first and its URLs are already indexed.
const LANGUAGES = [
  { code: 'en', prefix: '', htmlLang: 'en', hreflang: 'en', label: 'English', short: 'EN' },
  { code: 'es', prefix: '/es', htmlLang: 'es', hreflang: 'es', label: 'Español', short: 'ES' },
  { code: 'pl', prefix: '/pl', htmlLang: 'pl', hreflang: 'pl', label: 'Polski', short: 'PL' },
  { code: 'pt', prefix: '/pt', htmlLang: 'pt-BR', hreflang: 'pt-BR', label: 'Português', short: 'PT' },
]

// template file → output path (relative, no language prefix) and sitemap weight
// `meta` names the content-key prefix holding this page's title/description,
// which the shared <head> partial renders — pages differ there and nowhere else.
const PAGES = [
  { template: 'index.html', out: 'index.html', url: '/', meta: 'meta.index', changefreq: 'weekly', priority: '1.0' },
  { template: 'contact.html', out: 'contact/index.html', url: '/contact/', meta: 'meta.contact', changefreq: 'yearly', priority: '0.5' },
  { template: 'guides-index.html', out: 'guides/index.html', url: '/guides/', meta: 'meta.guides', changefreq: 'monthly', priority: '0.7' },
  { template: 'guides-quick-start.html', out: 'guides/quick-start/index.html', url: '/guides/quick-start/', meta: 'meta.quickStart', changefreq: 'monthly', priority: '0.8' },
  { template: 'guides-what-is-aac.html', out: 'guides/what-is-aac/index.html', url: '/guides/what-is-aac/', meta: 'meta.whatIsAac', changefreq: 'monthly', priority: '0.8' },
  // 404 is served by GitHub Pages from the root only, so it is English-only
  // and carries the switcher for anyone who lands there in another language.
  { template: '404.html', out: '404.html', url: null, meta: 'meta.notFound' },
]

// ---- content ---------------------------------------------------------------

const content = {}
for (const { code } of LANGUAGES) {
  content[code] = JSON.parse(
    await readFile(join(site, '_content', `${code}.json`), 'utf8'),
  )
}

// English is canonical: a key missing from another language would render as a
// literal `{{key}}` on a live page, so fail the build instead.
const canonicalKeys = Object.keys(content.en).filter((k) => !k.startsWith('_'))
const missing = []
for (const { code } of LANGUAGES) {
  if (code === 'en') continue
  for (const key of canonicalKeys) {
    if (typeof content[code][key] !== 'string') missing.push(`${code}: ${key}`)
  }
  for (const key of Object.keys(content[code])) {
    if (!key.startsWith('_') && !canonicalKeys.includes(key)) {
      missing.push(`${code}: ${key} (not in en.json)`)
    }
  }
}
if (missing.length) {
  console.error(`build-site: content keys missing or unknown:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}

// ---- templating ------------------------------------------------------------

const partials = {}
for (const file of await readdir(join(site, '_templates', '_partials'))) {
  partials[file.replace(/\.html$/, '')] = await readFile(
    join(site, '_templates', '_partials', file),
    'utf8',
  )
}

/**
 * `{{> partial}}` includes, then `{{key}}` substitutions. Content is authored
 * in this repo, so values are inserted raw — the copy contains deliberate HTML
 * entities and inline markup.
 */
function render(template, vars) {
  let out = template
  for (let depth = 0; depth < 4 && out.includes('{{>'); depth++) {
    out = out.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
      if (!(name in partials)) throw new Error(`Unknown partial: ${name}`)
      return partials[name]
    })
  }
  return out.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key) => {
    if (key in vars) return vars[key]
    throw new Error(`Unknown key: ${key}`)
  })
}

/** Reciprocal hreflang set, plus x-default pointing at English. */
function hreflangFor(pageUrl) {
  if (!pageUrl) return ''
  const links = LANGUAGES.map(
    (l) =>
      `    <link rel="alternate" hreflang="${l.hreflang}" href="${ORIGIN}${l.prefix}${pageUrl}" />`,
  )
  links.push(`    <link rel="alternate" hreflang="x-default" href="${ORIGIN}${pageUrl}" />`)
  return `\n${links.join('\n')}`
}

/**
 * The always-visible switcher. Real links, so it works with no JavaScript.
 *
 * Each entry carries BOTH the endonym and a short code, and CSS shows one or
 * the other. Four full names ("English Español Polski Português") are about
 * 250px, which is enough to overflow the header on a laptop — the nav links
 * wrapped to three lines and the call-to-action was pushed off the edge. The
 * full name stays the accessible name either way.
 */
function switcherFor(language, pageUrl) {
  if (!pageUrl) pageUrl = '/'
  const inner = (l) =>
    `<span class="lang-full">${l.label}</span><span class="lang-short" aria-hidden="true">${l.short}</span>`
  const items = LANGUAGES.map((l) => {
    const href = `${l.prefix}${pageUrl}`
    return l.code === language.code
      ? `<span class="lang-current" aria-current="true" aria-label="${l.label}">${inner(l)}</span>`
      : `<a href="${href}" hreflang="${l.hreflang}" lang="${l.htmlLang}" aria-label="${l.label}">${inner(l)}</a>`
  })
  return `<div class="lang-switch" data-lang-switch>${items.join('')}</div>`
}

// ---- build -----------------------------------------------------------------

await mkdir(dist, { recursive: true })

let written = 0
for (const language of LANGUAGES) {
  const strings = content[language.code]
  for (const page of PAGES) {
    const template = await readFile(join(site, '_templates', page.template), 'utf8')
    // 404 exists once, at the root, because that is the only path Pages serves
    // it from — skip it for the prefixed languages.
    if (!page.url && language.code !== 'en') continue

    const canonical = `${ORIGIN}${language.prefix}${page.url ?? '/'}`
    const html = render(template, {
      ...strings,
      title: strings[`${page.meta}.title`],
      description: strings[`${page.meta}.description`],
      ogTitle: strings[`${page.meta}.ogTitle`],
      ogDescription: strings[`${page.meta}.ogDescription`],
      lang: language.htmlLang,
      langCode: language.code,
      // Every in-page link has to stay inside the language, so templates write
      // `{{p}}/guides/` rather than a bare path.
      p: language.prefix,
      canonical,
      hreflang: hreflangFor(page.url),
      switcher: switcherFor(language, page.url),
      ogLocale: language.htmlLang.replace('-', '_'),
      // Hand the language to the app so onboarding does not ask again.
      appHref: `${language.prefix ? `/app/?lang=${language.code}` : '/app/'}`,
      year: '2026',
    })

    const outPath = join(dist, language.prefix.replace(/^\//, ''), page.out)
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, html)
    written++
  }
}

// ---- sitemap ---------------------------------------------------------------

const urls = []
for (const language of LANGUAGES) {
  for (const page of PAGES) {
    if (!page.url) continue
    urls.push(
      `  <url><loc>${ORIGIN}${language.prefix}${page.url}</loc>` +
        `<changefreq>${page.changefreq}</changefreq>` +
        `<priority>${page.priority}</priority></url>`,
    )
  }
}
urls.push(
  `  <url><loc>${ORIGIN}/app/</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
)
await writeFile(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
)

// ---- static assets ---------------------------------------------------------

for (const file of ['styles.css', 'analytics.js', 'lang.js', 'CNAME', 'robots.txt']) {
  await copyFile(join(site, file), join(dist, file)).catch(() => {})
}

const tryCopy = (from, to) => copyFile(from, to).catch(() => {})
await tryCopy(join(root, 'public', 'icons', 'og-image.png'), join(dist, 'og-image.png'))
await tryCopy(join(dist, 'app', 'favicon.ico'), join(dist, 'favicon.ico'))

console.log(
  `build-site: ${written} pages in ${LANGUAGES.length} languages + sitemap (${urls.length} urls) → dist/`,
)
