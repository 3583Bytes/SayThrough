import { expect, test, type Page } from '@playwright/test'
import { AUDIT, type Issue } from './contrastAudit'

// The marketing site is hand-authored CSS with its own light/dark palette, so
// it regresses independently of the app. It is also the first thing a parent
// or SLP sees, and its primary call-to-action was the worst-contrast element
// anywhere in the project (2.78:1 light, 2.36:1 dark) before this ran.
const PAGES = ['/', '/contact/', '/guides/', '/guides/quick-start/', '/guides/what-is-aac/']

async function expectReadable(page: Page, where: string) {
  const issues = (await page.evaluate(AUDIT)) as Issue[]
  const seen = new Set<string>()
  const unique = issues.filter((i) => !seen.has(i.text + i.fg) && seen.add(i.text + i.fg))
  expect(
    unique,
    `${where}: text below WCAG AA —\n` +
      unique.map((i) => `  ${i.ratio}:1 (needs ${i.min}) "${i.text}"  fg=${i.fg} on ${i.bg}`).join('\n'),
  ).toEqual([])
}

// A contrast audit that silently stops detecting anything still reports a
// green build. This has already happened once: an escaping slip turned the
// gradient regex into a capture group, so every gradient scored against the
// body instead. Prove the detector still bites, including through a gradient.
test('the audit itself still detects bad contrast', async ({ page }) => {
  await page.goto('/')
  const found = (await page.evaluate(
    `(() => {
      const d = document.createElement('div')
      d.style.cssText = 'background:linear-gradient(90deg,#4caf50,#4caf50);padding:20px'
      const s = document.createElement('span')
      s.style.color = '#ffffff'
      s.textContent = 'CONTRAST CANARY'
      d.appendChild(s); document.body.appendChild(d)
      const out = ${AUDIT}
      d.remove()
      return out
    })()`,
  )) as Issue[]
  const canary = found.find((i) => i.text === 'CONTRAST CANARY')
  expect(canary, 'the audit no longer detects white-on-#4caf50 through a gradient').toBeTruthy()
  expect(canary!.ratio).toBeCloseTo(2.78, 1)
})

for (const scheme of ['light', 'dark'] as const) {
  test(`marketing site meets WCAG AA in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    for (const path of PAGES) {
      await page.goto(path)
      await expectReadable(page, `${path} (${scheme})`)
    }
  })
}
