// Native: PWA concepts don't apply — no-ops. Metro resolves pwa.web.ts
// for web builds.

export function initPwa(): void {}

export type InstallState = 'installed' | 'installable' | 'ios-instructions' | 'unavailable'

export function getInstallState(): InstallState {
  return 'unavailable'
}

export async function promptInstall(): Promise<boolean> {
  return false
}

export function onInstallAvailable(_listener: () => void): void {}

export function warmupSymbolCache(_uris: string[]): void {}
