import { expect, test, type Page } from '@playwright/test'
import { enterEditMode, setupProfile } from './helpers'

// §14.3 full device backup. Worth testing end-to-end rather than only in
// units: this exercises the real IndexedDB driver — including getAllMeta,
// whose keys and values come back from two separate requests — and the real
// file picker, which is where a backup feature actually fails.

async function openSettings(page: Page) {
  await enterEditMode(page)
  await page.getByLabel('Open settings').click()
  await page.getByText('Backup & Restore').waitFor()
}

async function leaveSettings(page: Page) {
  await page.getByLabel('Back to communication').click()
  await page.getByLabel('Done editing').click()
}

/** Saves a full backup and returns the downloaded file's local path. */
async function saveBackup(page: Page): Promise<string> {
  const downloadPromise = page.waitForEvent('download')
  await page.getByLabel('Save full backup').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(
    /^saythrough-backup-\d{4}-\d{2}-\d{2}\.json$/,
  )
  const path = await download.path()
  expect(path).toBeTruthy()
  return path!
}

test.describe('full device backup (§14.3)', () => {
  test('the backup carries the profile and settings .obz drops', async ({ page }) => {
    await setupProfile(page, { name: 'Robin' })
    await openSettings(page)

    const download = page.waitForEvent('download')
    await page.getByLabel('Save full backup').click()
    const file = await download
    const stream = await file.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    const backup = JSON.parse(Buffer.concat(chunks).toString('utf8'))

    expect(backup.format).toBe('saythrough-backup')
    expect(backup.data.users[0].name).toBe('Robin')
    expect(backup.data.users[0].ttsRate).toBeDefined()
    expect(backup.data.meta.activeUserId).toBeTruthy()
    expect(backup.data.buttons.length).toBeGreaterThan(50)
  })

  test('a file that is not a backup is refused, and nothing is offered to confirm', async ({
    page,
  }) => {
    await setupProfile(page, { name: 'Robin' })
    await openSettings(page)

    const chooserPromise = page.waitForEvent('filechooser')
    await page.getByLabel('Restore from backup').click()
    const chooser = await chooserPromise
    await chooser.setFiles({
      name: 'holiday-photos.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"hello":"world"}'),
    })

    await expect(page.getByText(/not a SayThrough backup/)).toBeVisible()
    // The destructive step must not become reachable.
    await expect(page.getByLabel('Confirm restore')).toHaveCount(0)
  })

  test('restoring recovers a wiped device, profile and history included', async ({
    page,
  }) => {
    await setupProfile(page, { name: 'Robin' })

    // Per-profile state beyond vocabulary — the part .obz cannot carry.
    await page.getByLabel('I', { exact: true }).click()
    await page.getByLabel('want', { exact: true }).click()
    await page.getByLabel('Speak message').click()
    await page.waitForTimeout(300)

    await openSettings(page)
    const backupPath = await saveBackup(page)
    await leaveSettings(page)

    // Lose the device: wipe storage and reload into first-run onboarding.
    await page.evaluate(() => indexedDB.deleteDatabase('saythrough'))
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Set up SayThrough' }).click()
    await page.getByLabel('User name').fill('Temp')
    await page.getByRole('button', { name: 'Finish setup' }).click()
    await page.getByLabel('want', { exact: true }).waitFor({ timeout: 20_000 })

    // Sanity: the new device really has no history of its own.
    await page.getByLabel('Message actions').click()
    await page.getByLabel('Recent messages').click()
    await expect(page.getByLabel('Use phrase: I want')).toHaveCount(0)
    await page.getByLabel('Close recent messages').click()

    await openSettings(page)
    const chooserPromise = page.waitForEvent('filechooser')
    await page.getByLabel('Restore from backup').click()
    ;(await chooserPromise).setFiles(backupPath)

    // The file is described before anything is written.
    await expect(page.getByText(/Robin/)).toBeVisible()
    await page.getByLabel('Confirm restore').click()
    // Restore rewrites local storage row by row: ~6,300 buttons across 176
    // pages and 16 built-in page sets (three sizes × four languages, plus
    // Quick Phrases), and on web each write is its OWN IndexedDB
    // transaction. That is ~1.3s on a dev machine and several seconds on a
    // 2-core CI runner, so the default 5s expect timeout made this a flake
    // rather than a signal — the .obz import next door already waits 15s for
    // the same reason.
    //
    // Waiting for either terminal status, then asserting which one, means a
    // genuine restore failure reports its own error text instead of timing
    // out anonymously.
    const outcome = page.getByText(/^Restored\.$|^Restore failed:/)
    await expect(outcome).toBeVisible({ timeout: 60_000 })
    await expect(outcome).toHaveText('Restored.')

    await page.reload({ waitUntil: 'networkidle' })
    await page.getByLabel('want', { exact: true }).waitFor({ timeout: 20_000 })

    // Robin's spoken history is back on a device that had been wiped.
    await page.getByLabel('Message actions').click()
    await page.getByLabel('Recent messages').click()
    await expect(page.getByLabel('Use phrase: I want')).toBeVisible()
  })
})
