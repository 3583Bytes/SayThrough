// Renders scripts/og-image.html to public/icons/og-image.png at exactly
// 1200×630 (the Open Graph / Twitter large-card size). Run after editing the
// template: `npm run og-image`. Committed asset — no network needed.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'public', 'icons', 'og-image.png')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(`file://${join(here, 'og-image.html')}`)
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } })
await browser.close()
console.log(`og-image: wrote ${out} (1200×630)`)
