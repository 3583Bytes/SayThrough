// Renders the marketing site from templates + per-language content into the
// build output at the root, alongside the Expo app under dist/app/. Runs last
// in `npm run build`.
//
// §19.7 — the site ships in the same four languages as the app. The pages are
// GENERATED rather than hand-authored per language: four languages × twelve
// pages is forty-eight files, and keeping those in sync by hand guarantees
// drift. Same shape as the app's i18n — `_content/en.json` is canonical and
// the build fails on a key that any language is missing.
//
// URL structure is a path prefix per language (`/`, `/es/`, `/pl/`, `/pt/`),
// each a real static file with its own canonical, hreflang and OG tags. That
// is what makes them crawlable; GitHub Pages cannot vary a response by
// Accept-Language, and a JS redirect on `/` would hide the localised pages
// from search entirely. Detection is a SUGGESTION only — see site/lang.js.

import { cp, copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const site = join(root, 'site')
const dist = join(root, 'dist')
const ORIGIN = 'https://saythrough.com'
const GITHUB = 'https://github.com/3583bytes/saythrough'

// Language code → URL prefix and the `<html lang>` / hreflang value. English
// is unprefixed because it was there first and its URLs are already indexed.
//
// `hreflangs` is the full alternate set for the page. Portuguese declares both
// `pt-BR` (what the copy actually is) and a bare `pt`, so a pt-PT visitor
// matches the page instead of falling through to x-default English. The
// content stays Brazilian either way — this is a matching hint, not a claim.
const LANGUAGES = [
  { code: 'en', prefix: '', htmlLang: 'en', hreflangs: ['en'], label: 'English', short: 'EN' },
  { code: 'es', prefix: '/es', htmlLang: 'es', hreflangs: ['es'], label: 'Español', short: 'ES' },
  { code: 'pl', prefix: '/pl', htmlLang: 'pl', hreflangs: ['pl'], label: 'Polski', short: 'PL' },
  { code: 'pt', prefix: '/pt', htmlLang: 'pt-BR', hreflangs: ['pt-BR', 'pt'], label: 'Português', short: 'PT' },
]

// template file → output path (relative, no language prefix).
//
// `meta` names the content-key prefix holding this page's title/description,
// which the shared <head> partial renders — pages differ there and nowhere else.
//
// `crumbs` mirrors the breadcrumb trail the template renders visibly, so the
// same trail can be emitted as BreadcrumbList JSON-LD without authoring it
// twice. Home is prepended automatically; the last crumb is the current page
// and needs no url.
//
// `article` marks a page as editorial content rather than a product page: it
// gets Article JSON-LD with the dates git already knows.
//
// Sitemaps carry `lastmod` and nothing else. Google has said publicly that it
// ignores `changefreq` and `priority`, and both were guesses anyway; `lastmod`
// it does use, and git knows the real answer.
const PAGES = [
  { template: 'index.html', out: 'index.html', url: '/', meta: 'meta.index' },
  {
    template: 'compare-index.html',
    out: 'compare/index.html',
    url: '/compare/',
    meta: 'meta.compare',
    crumbs: [{ key: 'compare.crumb' }],
  },
  {
    template: 'compare-td-snap.html',
    out: 'compare/td-snap-alternative/index.html',
    url: '/compare/td-snap-alternative/',
    meta: 'meta.tdSnap',
    article: true,
    crumbs: [{ key: 'compare.crumb', url: '/compare/' }, { key: 'tdSnap.crumb' }],
  },
  {
    template: 'compare-proloquo2go.html',
    out: 'compare/proloquo2go-alternative/index.html',
    url: '/compare/proloquo2go-alternative/',
    meta: 'meta.proloquo',
    article: true,
    crumbs: [{ key: 'compare.crumb', url: '/compare/' }, { key: 'proloquo.crumb' }],
  },
  {
    // Poland's dominant paid AAC app, and the one a Polish parent is actually
    // choosing between. Published in Polish only — see `languages`.
    template: 'compare-mowik.html',
    out: 'compare/mowik-alternative/index.html',
    url: '/compare/mowik-alternative/',
    meta: 'meta.mowik',
    article: true,
    languages: ['pl'],
    crumbs: [{ key: 'compare.crumb', url: '/compare/' }, { key: 'mowik.crumb' }],
  },
  {
    template: 'guides-index.html',
    out: 'guides/index.html',
    url: '/guides/',
    meta: 'meta.guides',
    crumbs: [{ key: 'guides.crumb' }],
  },
  {
    template: 'guides-quick-start.html',
    out: 'guides/quick-start/index.html',
    url: '/guides/quick-start/',
    meta: 'meta.quickStart',
    article: true,
    crumbs: [{ key: 'guides.crumb', url: '/guides/' }, { key: 'quickStart.crumb' }],
  },
  {
    template: 'guides-what-is-aac.html',
    out: 'guides/what-is-aac/index.html',
    url: '/guides/what-is-aac/',
    meta: 'meta.whatIsAac',
    article: true,
    crumbs: [{ key: 'guides.crumb', url: '/guides/' }, { key: 'whatIsAac.crumb' }],
  },
  {
    template: 'guides-core-words.html',
    out: 'guides/core-words/index.html',
    url: '/guides/core-words/',
    meta: 'meta.coreWords',
    article: true,
    crumbs: [{ key: 'guides.crumb', url: '/guides/' }, { key: 'coreWords.crumb' }],
  },
  {
    template: 'guides-aac-and-speech.html',
    out: 'guides/aac-and-speech/index.html',
    url: '/guides/aac-and-speech/',
    meta: 'meta.aacSpeech',
    article: true,
    crumbs: [{ key: 'guides.crumb', url: '/guides/' }, { key: 'aacSpeech.crumb' }],
  },
  {
    template: 'guides-access-methods.html',
    out: 'guides/access-methods/index.html',
    url: '/guides/access-methods/',
    meta: 'meta.access',
    article: true,
    crumbs: [{ key: 'guides.crumb', url: '/guides/' }, { key: 'access.crumb' }],
  },
  {
    template: 'guides-install.html',
    out: 'guides/install/index.html',
    url: '/guides/install/',
    meta: 'meta.install',
    article: true,
    crumbs: [{ key: 'guides.crumb', url: '/guides/' }, { key: 'install.crumb' }],
  },
  {
    template: 'guides-modeling.html',
    out: 'guides/modeling/index.html',
    url: '/guides/modeling/',
    meta: 'meta.modeling',
    article: true,
    crumbs: [{ key: 'guides.crumb', url: '/guides/' }, { key: 'modeling.crumb' }],
  },
  {
    template: 'guides-schools.html',
    out: 'guides/schools/index.html',
    url: '/guides/schools/',
    meta: 'meta.schools',
    article: true,
    crumbs: [{ key: 'guides.crumb', url: '/guides/' }, { key: 'schools.crumb' }],
  },
  {
    template: 'guides-arasaac.html',
    out: 'guides/arasaac-symbols/index.html',
    url: '/guides/arasaac-symbols/',
    meta: 'meta.arasaac',
    article: true,
    crumbs: [{ key: 'guides.crumb', url: '/guides/' }, { key: 'arasaac.crumb' }],
  },
  {
    template: 'printable-boards.html',
    out: 'printable-boards/index.html',
    url: '/printable-boards/',
    meta: 'meta.printable',
    article: true,
    crumbs: [{ key: 'printable.crumb' }],
  },
  {
    template: 'contact.html',
    out: 'contact/index.html',
    url: '/contact/',
    meta: 'meta.contact',
    crumbs: [{ key: 'contact.crumb' }],
  },
  {
    // Question-shaped copy is what this field's demand actually looks like,
    // and what AI answers quote. Deliberately NOT marked up as FAQPage —
    // Google restricted those rich results to government and health sites in
    // 2023, so the schema would be pure decoration.
    template: 'faq.html',
    out: 'faq/index.html',
    url: '/faq/',
    meta: 'meta.faq',
    crumbs: [{ key: 'faq.crumb' }],
  },
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

// A market-scoped page's copy lives only in the language files that publish
// it, so those keys are exempt from the parity check below. Every page names
// its keys the same way — `meta.mowik.*` for the head, `mowik.*` for the body
// — so the prefixes can be derived rather than listed a second time.
const marketKeys = new Map() // language code → prefixes allowed only there
for (const page of PAGES) {
  if (!page.languages) continue
  const name = page.meta.replace(/^meta\./, '')
  for (const code of page.languages) {
    if (!marketKeys.has(code)) marketKeys.set(code, [])
    marketKeys.get(code).push(`meta.${name}.`, `${name}.`)
  }
}
const isMarketKey = (code, key) =>
  (marketKeys.get(code) ?? []).some((prefix) => key.startsWith(prefix))

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
    if (!key.startsWith('_') && !canonicalKeys.includes(key) && !isMarketKey(code, key)) {
      missing.push(`${code}: ${key} (not in en.json)`)
    }
  }
}
if (missing.length) {
  console.error(`build-site: content keys missing or unknown:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}

// ---- lastmod ---------------------------------------------------------------

/**
 * A page's last-modified date is the most recent commit touching either its
 * template or the language file it draws copy from. Uncommitted or brand-new
 * files have no commit date — those fall back to today, which is honest: they
 * are about to be deployed for the first time.
 */
const TODAY = new Date().toISOString().slice(0, 10)
const gitDates = new Map()
async function gitDate(relPath) {
  if (gitDates.has(relPath)) return gitDates.get(relPath)
  let date = ''
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', '-1', '--format=%cs', '--', relPath],
      { cwd: root },
    )
    date = stdout.trim()
  } catch {
    // Not a git checkout (a tarball build, say) — fall through to today.
  }
  const resolved = date || TODAY
  gitDates.set(relPath, resolved)
  return resolved
}

async function lastmodFor(page, language) {
  const dates = await Promise.all([
    gitDate(`site/_templates/${page.template}`),
    gitDate(`site/_content/${language.code}.json`),
  ])
  return dates.sort().at(-1)
}

// ---- core vocabulary tables ------------------------------------------------

// The core-words guide publishes the REAL word list, generated from the same
// data the app boots from, so the page cannot drift from the product. A word
// list is also the most linkable thing a site in this field can publish.
//
// Colours come from src/constants/colors.ts rather than a second copy here —
// the Fitzgerald key is a clinical convention and both surfaces must agree.
const posColors = Object.fromEntries(
  [...(await readFile(join(root, 'src', 'constants', 'colors.ts'), 'utf8'))
    .matchAll(/^\s{2}(\w+):\s*'(#[0-9A-Fa-f]{6})'/gm)]
    .map((m) => [m[1], m[2]]),
)

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Renders the expanded (6×10) core set — 24 always-on words plus ten core
 * pages — as colour-coded groups. That is the set closest to the 200–400 word
 * range the research describes, which is what the guide is about.
 */
async function coreWordTable(langCode) {
  const file = langCode === 'en' ? 'coreWords.json' : `coreWords.${langCode}.json`
  const data = JSON.parse(await readFile(join(root, 'src', 'data', file), 'utf8'))
  const set = data.sizes['6x10']
  const strings = content[langCode]

  const chips = (words) =>
    words
      .map(([label, pos]) => {
        const bg = posColors[pos] || posColors.noun || '#FFFFFF'
        return `<li class="cw" style="--cw-bg:${bg}">${escapeHtml(label)}</li>`
      })
      .join('')

  const groups = [
    `<section class="cw-group"><h3>${strings['coreWords.alwaysOn']} <span class="cw-count">${set.core.length}</span></h3><ul class="cw-list">${chips(set.core)}</ul></section>`,
  ]
  for (const page of Object.keys(set.corePages)) {
    const words = set.topics[page]
    if (!words) continue
    groups.push(
      `<section class="cw-group"><h3>${escapeHtml(page)} <span class="cw-count">${words.length}</span></h3><ul class="cw-list">${chips(words)}</ul></section>`,
    )
  }
  return groups.join('\n')
}

/**
 * Printable low-tech core boards, one per grid size.
 *
 * A paper backup board is standard AAC practice — devices run out of battery,
 * get left at home, and do not go in the bath or the pool. What makes a backup
 * board work rather than merely exist is that it mirrors the device's own
 * layout, so the motor plan transfers instead of having to be learned twice.
 * That is why these render the PERSISTENT core region of each size, in its
 * real grid geometry, rather than a hand-picked word list.
 *
 * Symbols come from the app's own deployed assets (`/app/symbols/...` — same
 * origin, same build) and the per-language symbol map, so the printed board
 * and the board on screen show the same picture for the same word.
 */
async function printableBoards(langCode, strings) {
  const file = langCode === 'en' ? 'coreWords.json' : `coreWords.${langCode}.json`
  const mapFile = langCode === 'en' ? 'seedSymbolMap.json' : `seedSymbolMap.${langCode}.json`
  const data = JSON.parse(await readFile(join(root, 'src', 'data', file), 'utf8'))
  const symbols = JSON.parse(await readFile(join(root, 'src', 'data', mapFile), 'utf8'))

  const out = []
  for (const key of ['3x4', '5x6', '6x10']) {
    const set = data.sizes[key]
    const cells = set.core
      .map(([label, pos]) => {
        const ref = symbols[label]
        const id = ref?.startsWith('arasaac:') ? ref.slice('arasaac:'.length) : null
        // The label is printed next to the symbol, so the image is decorative
        // to a screen reader — announcing both just says everything twice.
        const img = id
          ? `<img src="/app/symbols/arasaac/${id}.webp" alt="" loading="lazy" decoding="async" width="80" height="80" />`
          : ''
        const bg = posColors[pos] || posColors.noun || '#FFFFFF'
        return `<div class="pb-cell" style="--pb-bg:${bg}">${img}<span>${escapeHtml(label)}</span></div>`
      })
      .join('')
    out.push(
      `<figure class="pb-board" style="--pb-cols:${set.coreColumns}">` +
        `<figcaption><strong>${escapeHtml(set.name)}</strong> — ${set.core.length} ${strings['printable.wordsLabel']}</figcaption>` +
        `<div class="pb-grid">${cells}</div>` +
        `</figure>`,
    )
  }
  return out.join('\n')
}

/** Total core words in the expanded set, for the copy to quote accurately. */
async function coreWordCount(langCode) {
  const file = langCode === 'en' ? 'coreWords.json' : `coreWords.${langCode}.json`
  const data = JSON.parse(await readFile(join(root, 'src', 'data', file), 'utf8'))
  const set = data.sizes['6x10']
  const pageWords = Object.keys(set.corePages).reduce(
    (n, p) => n + (set.topics[p]?.length ?? 0),
    0,
  )
  return set.core.length + pageWords
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
 *
 * Substitution runs to a fixed point rather than once, so a content value can
 * itself contain `{{p}}` and link into its own language. In-prose links to the
 * guides are worth a lot more than nav links, and they have to be authored in
 * the sentence, which means in the content file.
 */
function render(template, vars) {
  let out = template
  for (let depth = 0; depth < 4 && out.includes('{{>'); depth++) {
    out = out.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
      if (!(name in partials)) throw new Error(`Unknown partial: ${name}`)
      return partials[name]
    })
  }
  const substitute = (s) =>
    s.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key) => {
      if (key in vars) return vars[key]
      throw new Error(`Unknown key: ${key}`)
    })
  for (let depth = 0; depth < 3; depth++) {
    const next = substitute(out)
    if (next === out) return out
    out = next
  }
  return out
}

/** Which languages a page is published in. Most are published in all of them. */
const langsFor = (page) =>
  LANGUAGES.filter((l) => !page.languages || page.languages.includes(l.code))

/**
 * Reciprocal hreflang set, plus x-default pointing at English.
 *
 * A page published in a single language gets NO alternates: hreflang describes
 * translations that exist, and pointing it at a URL that was never written is
 * worse than saying nothing. Its self-canonical carries the whole claim.
 */
function hreflangFor(page) {
  const langs = langsFor(page)
  if (!page.url || langs.length < 2) return ''
  const links = []
  for (const l of langs) {
    for (const tag of l.hreflangs) {
      links.push(
        `    <link rel="alternate" hreflang="${tag}" href="${ORIGIN}${l.prefix}${page.url}" />`,
      )
    }
  }
  if (langs.some((l) => l.code === 'en')) {
    links.push(`    <link rel="alternate" hreflang="x-default" href="${ORIGIN}${page.url}" />`)
  }
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
function switcherFor(language, page) {
  const pageUrl = page.url ?? '/'
  const published = new Set(langsFor(page).map((l) => l.code))
  const inner = (l) =>
    `<span class="lang-full">${l.label}</span><span class="lang-short" aria-hidden="true">${l.short}</span>`
  const items = LANGUAGES.map((l) => {
    // A page that only exists in one market still needs a working switcher —
    // send the other languages to their home page rather than to a 404.
    const href = published.has(l.code) ? `${l.prefix}${pageUrl}` : `${l.prefix}/`
    return l.code === language.code
      ? `<span class="lang-current" aria-current="true" aria-label="${l.label}">${inner(l)}</span>`
      : `<a href="${href}" hreflang="${l.hreflangs[0]}" lang="${l.htmlLang}" aria-label="${l.label}">${inner(l)}</a>`
  })
  return `<div class="lang-switch" data-lang-switch>${items.join('')}</div>`
}

/**
 * Extra rows for the comparison hub, for competitors that only matter in one
 * market. Without this the market-scoped pages are orphans: in the sitemap,
 * but with nothing linking to them, which is close to not publishing them.
 */
function marketCompareFor(language, strings) {
  return PAGES.filter(
    (page) =>
      page.languages?.includes(language.code) && page.url?.startsWith('/compare/'),
  )
    .map((page) => {
      const name = page.meta.replace(/^meta\./, '')
      return (
        `<li><a href="${language.prefix}${page.url}">` +
        `<span class="g-title">${strings[`${name}.cardTitle`]}</span>` +
        `<span class="g-desc">${strings[`${name}.cardDesc`]}</span></a></li>`
      )
    })
    .join('\n        ')
}

const jsonLd = (obj) =>
  `    <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)
    .split('\n')
    .map((l) => `    ${l}`)
    .join('\n')}\n    </script>`

/**
 * BreadcrumbList from the same trail the template renders visibly, so the two
 * can never disagree. Pages with no trail (home, 404) emit nothing.
 */
function breadcrumbSchema(page, language, strings) {
  if (!page.crumbs?.length) return ''
  const base = `${ORIGIN}${language.prefix}`
  const items = [{ name: strings['crumb.home'], url: `${base}/` }]
  for (const crumb of page.crumbs) {
    items.push({
      name: strings[crumb.key],
      url: crumb.url ? `${base}${crumb.url}` : `${base}${page.url}`,
    })
  }
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  })
}

/**
 * Article schema for the guides and comparisons. Dates come from git, which is
 * the only place on this project that actually knows them — there was no date
 * anywhere on the site before, and so no freshness signal at all.
 */
function articleSchema(page, language, strings, lastmod) {
  if (!page.article) return ''
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: strings[`${page.meta}.ogTitle`],
    description: strings[`${page.meta}.description`],
    inLanguage: language.htmlLang,
    datePublished: lastmod,
    dateModified: lastmod,
    mainEntityOfPage: `${ORIGIN}${language.prefix}${page.url}`,
    image: `${ORIGIN}/og-image.png`,
    author: { '@type': 'Organization', name: 'SayThrough', url: `${ORIGIN}/` },
    publisher: {
      '@type': 'Organization',
      name: 'SayThrough',
      url: `${ORIGIN}/`,
      logo: { '@type': 'ImageObject', url: `${ORIGIN}/app/icons/icon-512.png` },
    },
  })
}

/**
 * Organization + WebSite, emitted on every page. This is what lets a search
 * engine treat "SayThrough" as one entity with a GitHub repo and a publisher
 * rather than as a string that happens to recur.
 */
function siteSchema(language, strings) {
  return jsonLd([
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${ORIGIN}/#organization`,
      name: 'SayThrough',
      url: `${ORIGIN}/`,
      logo: `${ORIGIN}/app/icons/icon-512.png`,
      description: strings['schema.description'],
      sameAs: [GITHUB, 'https://www.3583bytes.com/'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${ORIGIN}${language.prefix}/#website`,
      name: 'SayThrough',
      url: `${ORIGIN}${language.prefix}/`,
      inLanguage: language.htmlLang,
      publisher: { '@id': `${ORIGIN}/#organization` },
    },
  ])
}

// ---- build -----------------------------------------------------------------

await mkdir(dist, { recursive: true })

const sitemapEntries = []
let written = 0
for (const language of LANGUAGES) {
  const strings = content[language.code]
  const coreTable = await coreWordTable(language.code)
  const coreTotal = String(await coreWordCount(language.code))
  const boards = await printableBoards(language.code, content[language.code])

  for (const page of PAGES) {
    // 404 exists once, at the root, because that is the only path Pages serves
    // it from — skip it for the prefixed languages.
    if (!page.url && language.code !== 'en') continue
    // `languages` narrows a page to the markets it is actually about. A
    // comparison against a competitor nobody outside Poland has heard of is a
    // thin page in English, not a translation worth having.
    if (page.languages && !page.languages.includes(language.code)) continue

    const template = await readFile(join(site, '_templates', page.template), 'utf8')
    const canonical = `${ORIGIN}${language.prefix}${page.url ?? '/'}`
    const lastmod = await lastmodFor(page, language)

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
      hreflang: hreflangFor(page),
      switcher: switcherFor(language, page),
      ogLocale: language.htmlLang.replace('-', '_'),
      // Guides and comparisons are editorial content, not the product page.
      ogType: page.article ? 'article' : 'website',
      // Hand the language to the app so onboarding does not ask again.
      appHref: `${language.prefix ? `/app/?lang=${language.code}` : '/app/'}`,
      year: '2026',
      siteSchema: siteSchema(language, strings),
      breadcrumbSchema: breadcrumbSchema(page, language, strings),
      articleSchema: articleSchema(page, language, strings, lastmod),
      marketCompare: marketCompareFor(language, strings),
      printableBoards: boards,
      coreWordTable: coreTable,
      coreWordTotal: coreTotal,
      lastmod,
    })

    const outPath = join(dist, language.prefix.replace(/^\//, ''), page.out)
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, html)
    written++

    if (page.url) {
      sitemapEntries.push(
        `  <url><loc>${ORIGIN}${language.prefix}${page.url}</loc><lastmod>${lastmod}</lastmod></url>`,
      )
    }
  }
}

// ---- sitemap ---------------------------------------------------------------

// The app shell itself is noindex (see postbuild-web.mjs) and deliberately
// stays out of the sitemap: listing a noindex URL only wastes crawl budget.
await writeFile(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join('\n')}\n</urlset>\n`,
)

// ---- static assets ---------------------------------------------------------

for (const file of ['styles.css', 'analytics.js', 'lang.js', 'CNAME', 'robots.txt']) {
  await copyFile(join(site, file), join(dist, file)).catch(() => {})
}
await cp(join(site, 'img'), join(dist, 'img'), { recursive: true }).catch(() => {})

const tryCopy = (from, to) => copyFile(from, to).catch(() => {})
await tryCopy(join(root, 'public', 'icons', 'og-image.png'), join(dist, 'og-image.png'))
await tryCopy(join(dist, 'app', 'favicon.ico'), join(dist, 'favicon.ico'))

console.log(
  `build-site: ${written} pages in ${LANGUAGES.length} languages + sitemap (${sitemapEntries.length} urls) → dist/`,
)
