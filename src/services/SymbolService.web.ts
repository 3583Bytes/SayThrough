// Web: symbols are self-hosted same-origin static assets (§9.4).
// EXPO_PUBLIC_BASE_URL is set by the GitHub Pages workflow (/saythrough);
// empty for local dev.
const BASE = process.env.EXPO_PUBLIC_BASE_URL ?? ''

export function getSymbolUri(ref: string): string | null {
  const [library, id] = ref.split(':')
  if (!library || !id) return null
  return `${BASE}/symbols/${library}/${id}.webp`
}
