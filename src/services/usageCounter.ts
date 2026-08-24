import { Platform } from 'react-native'

// Aggregate usage counting (see stats-service/). Sends ONE named event —
// that the app was opened — and nothing else. No id, no session, no content.
//
// The counter exists so the project can tell whether anyone is using it. It
// deliberately cannot tell WHO: counting individual people would mean
// identifying them, and many people using SayThrough are children with
// disabilities. Nothing anyone says, types or taps is ever sent.
//
// The opt-out lives in localStorage rather than the profile, so it applies
// before any profile loads and is shared with the marketing site's script.

const ENDPOINT = 'https://stats.saythrough.com'
const OPT_OUT_KEY = 'saythrough-usage-counting'

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null // Safari private mode throws on access
  }
}

export function isUsageCountingEnabled(): boolean {
  return storage()?.getItem(OPT_OUT_KEY) !== 'off'
}

export function setUsageCountingEnabled(enabled: boolean): void {
  try {
    storage()?.setItem(OPT_OUT_KEY, enabled ? 'on' : 'off')
  } catch {
    // nothing to remember if storage is unavailable
  }
}

function optedOut(): boolean {
  const nav = typeof navigator === 'undefined' ? undefined : (navigator as any)
  if (nav?.doNotTrack === '1' || nav?.globalPrivacyControl === true) return true
  return !isUsageCountingEnabled()
}

/** Fire-and-forget; failure is silent and never blocks startup. */
export function countAppOpen(): void {
  if (Platform.OS !== 'web' || optedOut()) return
  try {
    void fetch(`${ENDPOINT}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'app_open' }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // never let a counter break the app
  }
}

/** Called once if the PWA is launched from the home screen. */
export function countAppInstall(): void {
  if (Platform.OS !== 'web' || optedOut()) return
  const store = storage()
  if (store?.getItem('saythrough-install-counted') === 'yes') return
  try {
    void fetch(`${ENDPOINT}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'app_install' }),
      keepalive: true,
    }).catch(() => {})
    store?.setItem('saythrough-install-counted', 'yes')
  } catch {
    // ignore
  }
}
