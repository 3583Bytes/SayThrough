import { expect, test, type Page } from '@playwright/test'

// §19.7 — the marketing site ships in the same four languages as the app.
// These guard the two things that are easy to get silently wrong: the SEO
// wiring that decides whether the localised pages are ever found, and the
// rule that detection SUGGESTS rather than redirects.

// The H1 carries the search query and the old line survives as the tagline
// beneath it — both are asserted, because dropping the tagline would lose the
// voice of the page and weakening the H1 would lose the query.
const LANGS = [
  {
    prefix: '',
    htmlLang: 'en',
    hreflang: 'en',
    label: 'English',
    h1: 'A free AAC app for nonspeaking people.',
    tagline: 'A free voice for everyone.',
  },
  {
    prefix: '/es',
    htmlLang: 'es',
    hreflang: 'es',
    label: 'Español',
    h1: 'Una aplicación de CAA gratuita para personas sin habla.',
    tagline: 'Una voz gratuita para todos.',
  },
  {
    prefix: '/pl',
    htmlLang: 'pl',
    hreflang: 'pl',
    label: 'Polski',
    h1: 'Darmowa aplikacja AAC dla osób niemówiących.',
    tagline: 'Darmowy głos dla każdego.',
  },
  {
    prefix: '/pt',
    htmlLang: 'pt-BR',
    hreflang: 'pt-BR',
    label: 'Português',
    h1: 'Um aplicativo de CAA gratuito para pessoas não falantes.',
    tagline: 'Uma voz gratuita para todo mundo.',
  },
]

test.describe('localised marketing pages', () => {
  for (const lang of LANGS) {
    test(`${lang.hreflang}: renders with the right lang, canonical and copy`, async ({ page }) => {
      await page.goto(`${lang.prefix}/`)
      await expect(page.locator('html')).toHaveAttribute('lang', lang.htmlLang)
      await expect(page.locator('h1')).toHaveText(lang.h1)
      await expect(page.locator('.hero-tagline')).toHaveText(lang.tagline)
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        `https://saythrough.com${lang.prefix}/`,
      )
      // No unrendered template placeholder made it to the page.
      expect(await page.content()).not.toContain('{{')
    })
  }

  test('every page declares the full reciprocal hreflang set', async ({ page }) => {
    for (const path of ['/', '/es/', '/pl/guides/', '/pt/guides/what-is-aac/']) {
      await page.goto(path)
      const alternates = await page.locator('link[rel=alternate]').evaluateAll((els) =>
        els.map((e) => e.getAttribute('hreflang')),
      )
      // All four languages plus x-default — the set Google needs to serve the
      // right page rather than treating them as duplicates. Portuguese carries
      // a bare `pt` as well as `pt-BR`, so a pt-PT visitor matches the page
      // instead of falling through to English.
      expect(alternates.sort()).toEqual(['en', 'es', 'pl', 'pt', 'pt-BR', 'x-default'])
    }
  })

  test('the switcher keeps you on the same page', async ({ page }) => {
    await page.goto('/guides/what-is-aac/')
    await page.locator('.lang-switch a[lang="pl"]').first().click()
    await expect(page).toHaveURL(/\/pl\/guides\/what-is-aac\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl')
  })

  test('the switcher marks the current language and is not a link', async ({ page }) => {
    await page.goto('/pt/')
    const current = page.locator('.lang-switch .lang-current').first()
    // The header shows a short code to keep the row from overflowing, so the
    // endonym is carried as the accessible name rather than the visible text.
    await expect(current).toHaveAttribute('aria-label', 'Português')
    await expect(current.locator('.lang-short')).toHaveText('PT')
    await expect(page.locator('.lang-switch a[lang="pt-BR"]')).toHaveCount(0)
  })

  test('the header stays on one row without clipping, in every language', async ({ page }) => {
    // The regression this guards: four endonyms in the header squeezed the
    // call-to-action until its label wrapped, which made it taller than the
    // fixed-height header and clipped its top edge.
    for (const path of ['/', '/es/', '/pl/', '/pt/']) {
      for (const width of [1440, 1280, 1120, 1024, 900, 700, 480, 360]) {
        await page.setViewportSize({ width, height: 400 })
        await page.goto(path)
        const overflow = await page.evaluate(() => {
          const header = document.querySelector('.site-header')
          const box = header.getBoundingClientRect()
          return [...header.querySelectorAll('.btn, .lang-switch a, .brand')]
            .filter((el) => {
              const r = el.getBoundingClientRect()
              if (!r.width && !r.height) return false
              return (
                r.top < box.top - 0.5 ||
                r.bottom > box.bottom + 0.5 ||
                r.right > window.innerWidth + 0.5
              )
            })
            .map((el) => el.textContent.trim().slice(0, 20))
        })
        expect({ path, width, overflow }).toEqual({ path, width, overflow: [] })
      }
    }
  })

  test('the app link carries the language across', async ({ page }) => {
    await page.goto('/pt/')
    const href = await page.locator('a.btn-primary').first().getAttribute('href')
    expect(href).toBe('/app/?lang=pt')
  })

  test('the sitemap lists every language of every page, with a lastmod', async ({ page }) => {
    const xml = await (await page.request.get('/sitemap.xml')).text()
    for (const lang of LANGS) {
      for (const url of ['/', '/guides/quick-start/', '/compare/td-snap-alternative/']) {
        expect(xml).toContain(`<loc>https://saythrough.com${lang.prefix}${url}</loc>`)
      }
    }
    // `lastmod` is the one sitemap hint Google actually uses; `changefreq` and
    // `priority` are documented as ignored and were guesses anyway.
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
    expect(xml).not.toContain('<changefreq>')
    expect(xml).not.toContain('<priority>')
  })
})

// A page can vanish from the build simply by being dropped from PAGES in
// build-site.mjs, and nothing else notices: the templates and copy stay in the
// repo, and a `dist/` left over from an earlier build still serves the stale
// file locally. This crawl is what makes that fail — it follows every internal
// link from the home page of every language and insists the target exists.
test.describe('site integrity', () => {
  test('every internal link resolves, in every language', async ({ page }) => {
    const seen = new Set<string>()
    const queue = ['/', '/es/', '/pl/', '/pt/']
    const broken: string[] = []

    while (queue.length) {
      const path = queue.shift()!
      if (seen.has(path)) continue
      seen.add(path)

      const response = await page.goto(path)
      if (response?.status() !== 200) {
        broken.push(`${path} → ${response?.status()}`)
        continue
      }

      const links = await page.locator('a[href^="/"]').evaluateAll((els) =>
        els
          .map((e) => e.getAttribute('href') ?? '')
          .map((h) => h.split('#')[0].split('?')[0])
          .filter((h) => h && !h.startsWith('/app')),
      )
      for (const link of links) if (!seen.has(link)) queue.push(link)
    }

    expect(broken, 'internal links pointing at pages that are not built').toEqual([])
    // A floor rather than an exact count, so adding a page does not fail this.
    expect(seen.size).toBeGreaterThan(50)

    // The other half: a page in the sitemap that nothing links to is an
    // orphan, which is close to not having published it. Market-scoped pages
    // are the easy ones to strand, since the shared template has no row for
    // them — the comparison hub renders those rows per language.
    const xml = await (await page.request.get('/sitemap.xml')).text()
    const sitemap = [...xml.matchAll(/<loc>https:\/\/saythrough\.com([^<]*)<\/loc>/g)].map(
      (m) => m[1],
    )
    expect(
      sitemap.filter((url) => !seen.has(url)),
      'sitemap URLs that nothing on the site links to',
    ).toEqual([])
  })
})

// Structured data and images: the two things a crawler uses to tell a real
// product from a page that merely claims to be one.
test.describe('structured data', () => {
  async function schemaTypes(page: Page) {
    return page.locator('script[type="application/ld+json"]').evaluateAll((els) =>
      els.flatMap((e) => {
        const parsed = JSON.parse(e.textContent ?? '')
        return (Array.isArray(parsed) ? parsed : [parsed]).map((n) => n['@type'])
      }),
    )
  }

  test('every page carries Organization and WebSite', async ({ page }) => {
    for (const path of ['/', '/es/guides/', '/pl/compare/', '/pt/guides/core-words/']) {
      await page.goto(path)
      const types = await schemaTypes(page)
      expect(types).toContain('Organization')
      expect(types).toContain('WebSite')
    }
  })

  test('the home page describes the app, guides describe an article', async ({ page }) => {
    await page.goto('/')
    expect(await schemaTypes(page)).toContain('SoftwareApplication')

    await page.goto('/guides/core-words/')
    const types = await schemaTypes(page)
    // Breadcrumbs are rendered visibly, so they are also marked up — the trail
    // is authored once in build-site.mjs and used for both.
    expect(types).toContain('BreadcrumbList')
    expect(types).toContain('Article')
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
  })

  test('the printable boards mirror the app, symbols and all', async ({ page }) => {
    await page.goto('/printable-boards/')
    // One board per grid size, each in its real column count — the point of
    // the page is that paper and screen share a layout, so a motor plan
    // learned on one transfers to the other.
    const boards = page.locator('.pb-board')
    await expect(boards).toHaveCount(3)
    await expect(boards.nth(0).locator('.pb-cell')).toHaveCount(6)
    await expect(boards.nth(1).locator('.pb-cell')).toHaveCount(15)
    await expect(boards.nth(2).locator('.pb-cell')).toHaveCount(24)

    // Symbols come from the app's own deployed assets. If that path ever
    // moves, every board here silently becomes a grid of empty boxes.
    // They are lazy-loaded, so scroll the page before counting them.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect
      .poll(
        () =>
          page
            .locator('.pb-cell img')
            .evaluateAll(
              (els) => els.filter((e) => (e as HTMLImageElement).naturalWidth > 0).length,
            ),
        { message: 'board symbols that failed to load from /app/symbols/' },
      )
      .toBe(45)

    // Printing gives you the board and nothing else.
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('.site-header')).toBeHidden()
    await expect(page.locator('.site-footer')).toBeHidden()
    await expect(boards.first()).toBeVisible()
  })

  test('the printable boards are localised, not translated labels on one grid', async ({
    page,
  }) => {
    await page.goto('/pl/printable-boards/')
    await expect(page.locator('.pb-cell', { hasText: /^chcę$/ })).toHaveCount(3)
  })

  test('screenshots carry real alt text', async ({ page }) => {
    await page.goto('/')
    const images = page.locator('.shot img')
    expect(await images.count()).toBeGreaterThan(0)
    for (const alt of await images.evaluateAll((els) => els.map((e) => e.getAttribute('alt')))) {
      expect(alt?.length ?? 0).toBeGreaterThan(30)
    }
  })

  test('a market-scoped page is published in that market only', async ({ page }) => {
    // The Mówik comparison exists in Polish and nowhere else: an English page
    // about a competitor nobody outside Poland has heard of is a thin page,
    // not a translation. It therefore declares NO hreflang alternates — those
    // describe translations that exist — and its switcher has to send the
    // other languages somewhere real rather than to a 404.
    await page.goto('/pl/compare/mowik-alternative/')
    await expect(page.locator('h1')).toHaveText('Darmowa alternatywa dla MÓWika')
    await expect(page.locator('link[rel=alternate]')).toHaveCount(0)
    await expect(page.locator('.lang-switch a[lang="en"]').first()).toHaveAttribute('href', '/')

    // The suggestion banner has to respect that too. It reads the switcher's
    // hrefs rather than computing a path, because computing one here offered
    // an English visitor a translation of this page that does not exist.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US'] })
      Object.defineProperty(navigator, 'language', { get: () => 'en-US' })
    })
    await page.goto('/pl/compare/mowik-alternative/')
    const offer = page.locator('.lang-banner-go')
    if (await offer.count()) await expect(offer).toHaveAttribute('href', '/')

    expect((await page.request.get('/compare/mowik-alternative/')).status()).toBe(404)
    const xml = await (await page.request.get('/sitemap.xml')).text()
    expect(xml).toContain('https://saythrough.com/pl/compare/mowik-alternative/')
    expect(xml).not.toContain('https://saythrough.com/compare/mowik-alternative/')
  })

  test('the core word list is generated from the app\'s own vocabulary', async ({ page }) => {
    // The list exists to be linkable and citable, so it has to be the real
    // vocabulary — and it has to be the vocabulary of the language it is on.
    await page.goto('/guides/core-words/')
    await expect(page.locator('.cw', { hasText: /^want$/ })).toHaveCount(1)

    await page.goto('/pl/guides/core-words/')
    await expect(page.locator('.cw', { hasText: /^chcę$/ })).toHaveCount(1)
  })
})

// The rule that matters most: a first visit is never redirected, because a
// redirect on `/` would hide the localised pages from crawlers — which arrive
// with English headers from US IPs — and trap anyone who wanted English.
test.describe('detection suggests, never redirects', () => {
  async function withLocale(page: Page, locale: string, run: () => Promise<void>) {
    await page.addInitScript((l) => {
      Object.defineProperty(navigator, 'languages', { get: () => [l], configurable: true })
      Object.defineProperty(navigator, 'language', { get: () => l, configurable: true })
    }, locale)
    await run()
  }

  test('a Portuguese browser lands on English and is offered a switch', async ({ page }) => {
    await withLocale(page, 'pt-BR', async () => {
      await page.goto('/')
      // Still on the page it asked for.
      await expect(page).toHaveURL(/\/$/)
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      // ...with an offer, written in the language being offered.
      const banner = page.locator('.lang-banner')
      await expect(banner).toBeVisible()
      await expect(banner).toContainText('Esta página também está em português')
    })
  })

  test('the offer is dismissible and stays dismissed', async ({ page }) => {
    await withLocale(page, 'pl-PL', async () => {
      await page.goto('/')
      await expect(page.locator('.lang-banner')).toBeVisible()
      await page.locator('.lang-banner-x').click()
      await expect(page.locator('.lang-banner')).toHaveCount(0)
      await page.reload()
      await expect(page.locator('.lang-banner')).toHaveCount(0)
    })
  })

  test('no banner when the browser already matches the page', async ({ page }) => {
    await withLocale(page, 'en-US', async () => {
      await page.goto('/')
      await expect(page.locator('.lang-banner')).toHaveCount(0)
    })
  })

  test('an explicit choice is remembered on the next visit', async ({ page }) => {
    await withLocale(page, 'en-US', async () => {
      await page.goto('/')
      await page.locator('.lang-switch a[lang="es"]').first().click()
      await expect(page).toHaveURL(/\/es\/$/)
      // Coming back to the root now honours the stated preference — that is
      // the visitor's decision, not our guess about their headers.
      await page.goto('/')
      await expect(page).toHaveURL(/\/es\/$/)
      await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    })
  })
})
