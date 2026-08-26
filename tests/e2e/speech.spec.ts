import { expect, test } from '@playwright/test'
import { setupProfile } from './helpers'

// §10.4 engine warm-up. The bug this guards: warm-up was wired to
// `onTouchStart` on the grid, which never fires for a mouse or trackpad
// click — so on desktop it never ran, every session paid the engine's cold
// start (measured 242–486 ms in Firefox on macOS versus ~65 ms warmed), and
// the opening word of the first sentence was clipped.

test('warms the engine before the first real sentence', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as any).__utterances = []
    const speak = speechSynthesis.speak.bind(speechSynthesis)
    speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      ;(window as any).__utterances.push({ text: u.text, volume: u.volume })
      return speak(u)
    }
  })

  await setupProfile(page) // clicking through onboarding is the first gesture
  await page.getByLabel('I', { exact: true }).click()
  await page.getByLabel('want', { exact: true }).click()
  await page.getByLabel('Speak message').click()
  await page.waitForTimeout(600)

  const spoken: Array<{ text: string; volume: number }> = await page.evaluate(
    () => (window as any).__utterances,
  )
  expect(spoken.length).toBeGreaterThan(0)

  // A silent warm-up must come first...
  const warm = spoken[0]
  expect(warm.volume).toBe(0)
  expect(warm.text.trim()).toBe('')

  // ...and it must precede the real sentence, not follow it.
  const real = spoken.findIndex((u) => u.text.includes('want'))
  expect(real).toBeGreaterThan(0)
})

test('a mouse click alone is enough to warm it', async ({ page }) => {
  // The original defect in one assertion: no touch events, only a click.
  await page.addInitScript(() => {
    ;(window as any).__warmed = false
    const speak = speechSynthesis.speak.bind(speechSynthesis)
    speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      if (u.volume === 0 && u.text.trim() === '') (window as any).__warmed = true
      return speak(u)
    }
  })
  await page.goto('/app/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Set up SayThrough' }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__warmed)).toBe(true)
})
