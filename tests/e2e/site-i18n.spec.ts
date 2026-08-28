import { expect, test, type Page } from '@playwright/test'

// §19.7 — the marketing site ships in the same four languages as the app.
// These guard the two things that are easy to get silently wrong: the SEO
// wiring that decides whether the localised pages are ever found, and the
// rule that detection SUGGESTS rather than redirects.

const LANGS = [
  { prefix: '', htmlLang: 'en', hreflang: 'en', label: 'English', h1: 'A free voice for everyone.' },
  { prefix: '/es', htmlLang: 'es', hreflang: 'es', label: 'Español', h1: 'Una voz gratuita para todos.' },
  { prefix: '/pl', htmlLang: 'pl', hreflang: 'pl', label: 'Polski', h1: 'Darmowy głos dla każdego.' },
  { prefix: '/pt', htmlLang: 'pt-BR', hreflang: 'pt-BR', label: 'Português', h1: 'Uma voz gratuita para todo mundo.' },
]

test.describe('localised marketing pages', () => {
  for (const lang of LANGS) {
    test(`${lang.hreflang}: renders with the right lang, canonical and copy`, async ({ page }) => {
      await page.goto(`${lang.prefix}/`)
      await expect(page.locator('html')).toHaveAttribute('lang', lang.htmlLang)
      await expect(page.locator('h1')).toHaveText(lang.h1)
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
      // right page rather than treating them as duplicates.
      expect(alternates.sort()).toEqual(['en', 'es', 'pl', 'pt-BR', 'x-default'])
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

  test('the sitemap lists every language of every page', async ({ page }) => {
    const xml = await (await page.request.get('/sitemap.xml')).text()
    for (const lang of LANGS) {
      expect(xml).toContain(`<loc>https://saythrough.com${lang.prefix}/</loc>`)
      expect(xml).toContain(`<loc>https://saythrough.com${lang.prefix}/guides/quick-start/</loc>`)
    }
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
