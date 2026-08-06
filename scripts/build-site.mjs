// Copies the hand-authored marketing site (site/) into the build output at
// the root, alongside the Expo app which lives under dist/app/. Runs last in
// `npm run build`. Also drops the shared share-image + favicon at the root
// where the marketing pages reference them.
import { copyFile, cp } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

// 1. marketing pages, guides, styles, CNAME/robots/sitemap → dist root
await cp(join(root, 'site'), dist, { recursive: true })

// 2. root-level brand assets the marketing pages link to
const tryCopy = (from, to) => copyFile(from, to).catch(() => {})
await tryCopy(join(root, 'public', 'icons', 'og-image.png'), join(dist, 'og-image.png'))
await tryCopy(join(dist, 'app', 'favicon.ico'), join(dist, 'favicon.ico'))

console.log('build-site: marketing pages + guides copied to dist/ (app stays under dist/app)')
