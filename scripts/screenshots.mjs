// Regenerates the README screenshots from the real exported build.
//
// They were previously captured by hand, which is why they drifted: the
// committed pair still showed Clothes / Animals / Weather on the 5×6 home
// page, topics that moved to 6×10 several vocabulary revisions ago. Driving
// the actual app means the images cannot say something the board does not.
//
// Usage:  npm run build && npm run screenshots
//         npm run screenshots -- --light      (light theme instead)
//         npm run screenshots -- --lang pl    (a different language's board)

import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs', 'screenshots')
const PORT = 8099
const BASE = `http://localhost:${PORT}`

const args = process.argv.slice(2)
const dark = !args.includes('--light')
const langIndex = args.indexOf('--lang')
const lang = langIndex >= 0 ? args[langIndex + 1] : 'en'

// Labels differ per language, so the driver reads them from one table rather
// than hard-coding English and silently failing elsewhere.
const UI = {
  en: { setup: 'Set up SayThrough', name: 'User name', finish: 'Finish setup', edit: 'Edit mode',
        settings: 'Open settings', dark: 'Dark', light: 'Light', back: 'Back to communication',
        done: 'Done editing', want: 'want', topic: 'Food, opens page', item: 'cookie',
        speak: 'Speak message', home: 'Home' },
  es: { setup: 'Set up SayThrough', name: 'Nombre del usuario', finish: 'Terminar configuración',
        edit: 'Modo de edición', settings: 'Abrir los ajustes', dark: 'Oscuro', light: 'Claro',
        back: 'Volver a la comunicación', done: 'Terminar de editar', want: 'quiero',
        topic: 'Comida, opens page', item: 'galleta', speak: 'Decir el mensaje', home: 'Inicio' },
  pl: { setup: 'Set up SayThrough', name: 'Imię użytkownika', finish: 'Zakończ konfigurację',
        edit: 'Tryb edycji', settings: 'Otwórz ustawienia', dark: 'Ciemny', light: 'Jasny',
        back: 'Wróć do komunikacji', done: 'Zakończ edycję', want: 'chcę',
        topic: 'Jedzenie, opens page', item: 'ciastko', speak: 'Powiedz wiadomość', home: 'Start' },
  pt: { setup: 'Set up SayThrough', name: 'Nome do usuário', finish: 'Concluir a configuração',
        edit: 'Modo de edição', settings: 'Abrir os ajustes', dark: 'Escuro', light: 'Claro',
        back: 'Voltar para a comunicação', done: 'Terminar a edição', want: 'quero',
        topic: 'Comida, opens page', item: 'bolacha', speak: 'Falar a mensagem', home: 'Início' },
}
const t = UI[lang]
if (!t) throw new Error(`Unknown --lang ${lang}. Try: ${Object.keys(UI).join(', ')}`)

// ---- serve the build -------------------------------------------------------

const server = spawn(process.execPath, [join(root, 'scripts', 'serve-dist.mjs')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
})
const stop = () => server.kill()
process.on('exit', stop)

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`${BASE}/app/`)
      if (res.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('serve-dist did not come up — did you run `npm run build`?')
}
await waitForServer()

// ---- drive the app ---------------------------------------------------------

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 2, // README images stay sharp on a retina screen
  colorScheme: dark ? 'dark' : 'light',
})

const suffix = dark ? '-dark' : ''
const shot = async (name) => {
  const path = join(outDir, `${name}${lang === 'en' ? '' : `-${lang}`}${suffix}.png`)
  await page.screenshot({ path })
  console.log(`  wrote ${path.replace(`${root}/`, '')}`)
}

await page.goto(`${BASE}/app/${lang === 'en' ? '' : `?lang=${lang}`}`, {
  waitUntil: 'networkidle',
})
await page.getByRole('button', { name: t.setup }).click()
await page.getByLabel(t.name).fill('Maya')
await page.getByRole('button', { name: t.finish }).click()
await page.getByLabel(t.want, { exact: true }).waitFor({ timeout: 20_000 })

// The theme is a per-profile setting, so it is set through the UI rather than
// by forcing a media query — this captures what a user who picked Dark sees.
await page.getByLabel(t.edit).click()
await page.getByLabel(t.settings).click()
await page.getByRole('button', { name: dark ? t.dark : t.light, exact: true }).click()
await page.getByLabel(t.back).click()
await page.getByLabel(t.done).click()
await page.waitForTimeout(400) // let the theme transition settle

// 1. the home board
await page.getByLabel(t.want, { exact: true }).waitFor()
await shot('home')

// 2. a sentence built on a topic page
await page.getByLabel(t.topic).click()
await page.getByLabel(t.item, { exact: true }).waitFor()
await page.getByLabel(t.want, { exact: true }).click()
await page.getByLabel(t.item, { exact: true }).click()
await page.waitForTimeout(200)
await shot('topic-and-message')

await browser.close()
stop()
console.log(`screenshots: ${lang}, ${dark ? 'dark' : 'light'} theme`)
