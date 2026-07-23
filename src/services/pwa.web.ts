// Web PWA glue: service worker registration, install prompt capture
// (§12.6), and active-page-set symbol warmup (spec §3 storage strategy).

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners: Array<() => void> = []

export function initPwa(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    listeners.forEach((listener) => listener())
  })
  if ('serviceWorker' in navigator) {
    // relative path so the scope is correct under /saythrough/ on Pages
    navigator.serviceWorker.register('sw.js').catch(() => {
      // dev server has no sw.js — offline support is a production concern
    })
  }
}

export type InstallState = 'installed' | 'installable' | 'ios-instructions' | 'unavailable'

export function getInstallState(): InstallState {
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  if (standalone) return 'installed'
  if (deferredPrompt) return 'installable'
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIos) return 'ios-instructions'
  return 'unavailable'
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  await deferredPrompt.prompt()
  const choice = await deferredPrompt.userChoice
  deferredPrompt = null
  return choice.outcome === 'accepted'
}

export function onInstallAvailable(listener: () => void): void {
  listeners.push(listener)
}

// Populates the service worker's cache directly via the Cache API so
// the user's vocabulary works offline even on pages not yet visited.
// Writing to the named cache from the page avoids a timing trap: plain
// fetch() on first load runs before the SW has claimed the page, so
// those requests would bypass the SW and never be cached.
const CACHE_NAME = 'saythrough-v1' // must match public/sw.js

export function warmupSymbolCache(uris: string[]): void {
  if (!('caches' in window)) return
  void (async () => {
    const cache = await caches.open(CACHE_NAME)
    for (const uri of uris) {
      try {
        if (await cache.match(uri)) continue
        const response = await fetch(uri)
        if (response.ok) await cache.put(uri, response.clone())
      } catch {
        // offline or unreachable — retried on next launch
      }
    }
  })()
}
