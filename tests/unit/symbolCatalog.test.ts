// §5.7 / §19.7 — the symbol picker searches the PROFILE'S language.
// Before this, every caregiver searched an English-only index: someone
// building a Polish board had to guess the English word to find a picture.

jest.mock('../../src/services/SymbolService', () => ({
  getSymbolUri: (ref: string) => `/symbols/${ref.replace(':', '/')}.webp`,
}))

type Entry = { id: string; library: string; keywords: string[] }

const INDEXES: Record<string, Entry[]> = {
  en: [
    { id: 'arasaac:2248', library: 'arasaac', keywords: ['water'] },
    { id: 'arasaac:2349', library: 'arasaac', keywords: ['eat', 'take in'] },
    { id: 'arasaac:99', library: 'arasaac', keywords: ['watering can'] },
  ],
  es: [
    { id: 'arasaac:2248', library: 'arasaac', keywords: ['agua'] },
    { id: 'arasaac:2349', library: 'arasaac', keywords: ['comer', 'tomar'] },
  ],
  pl: [
    { id: 'arasaac:2248', library: 'arasaac', keywords: ['woda'] },
    { id: 'arasaac:2349', library: 'arasaac', keywords: ['jeść'] },
    { id: 'arasaac:70', library: 'arasaac', keywords: ['łóżko'] },
  ],
  pt: [{ id: 'arasaac:2248', library: 'arasaac', keywords: ['água'] }],
}

let requested: string[] = []

/** Serves the tables above; anything else 404s the way a missing asset would. */
function mockFetch(missing: string[] = []) {
  return jest.fn(async (url: string) => {
    requested.push(url)
    const code = url.match(/symbolIndex\/(\w+)\.json$/)?.[1] ?? ''
    const body = missing.includes(code) ? undefined : INDEXES[code]
    return body
      ? { ok: true, json: async () => body }
      : { ok: false, json: async () => [] }
  })
}

function load(missing: string[] = []) {
  jest.resetModules()
  requested = []
  ;(globalThis as unknown as { fetch: unknown }).fetch = mockFetch(missing)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../../src/services/symbolCatalog') as typeof import('../../src/services/symbolCatalog')
}

const labels = (results: { label: string }[]) => results.map((r) => r.label)

describe('fold', () => {
  it('ignores case and accents', () => {
    const { fold } = load()
    expect(fold('Água')).toBe('agua')
    expect(fold('JEŚĆ')).toBe('jesc')
    expect(fold('coração')).toBe('coracao')
  })

  it('maps Polish ł, which has no unicode decomposition', () => {
    const { fold } = load()
    expect(fold('łóżko')).toBe('lozko')
  })
})

describe('searchSymbols', () => {
  it('searches the index for the profile language', async () => {
    const { searchSymbols } = load()
    expect(labels(await searchSymbols('woda', 'pl'))).toEqual(['woda'])
    expect(requested).toEqual(['/symbolIndex/pl.json'])
  })

  it('finds Spanish and Portuguese words that do not exist in English', async () => {
    const { searchSymbols } = load()
    expect(labels(await searchSymbols('comer', 'es'))).toEqual(['comer'])
    expect(labels(await searchSymbols('água', 'pt-BR'))).toEqual(['água'])
  })

  it('matches without the accents, so a plain keyboard still finds the word', async () => {
    const { searchSymbols } = load()
    expect(labels(await searchSymbols('agua', 'pt'))).toEqual(['água'])
    expect(labels(await searchSymbols('jesc', 'pl'))).toEqual(['jeść'])
  })

  it('labels results in the searched language, not English', async () => {
    const { searchSymbols } = load()
    const [result] = await searchSymbols('agua', 'es')
    expect(result).toMatchObject({ id: 'arasaac:2248', label: 'agua' })
  })

  it('ranks exact matches above prefix matches', async () => {
    const { searchSymbols } = load()
    expect(labels(await searchSymbols('water', 'en'))).toEqual(['water', 'watering can'])
  })

  it('matches any keyword, not just the label', async () => {
    const { searchSymbols } = load()
    expect(labels(await searchSymbols('tomar', 'es'))).toEqual(['comer'])
  })

  it('defaults to English when no language is set', async () => {
    const { searchSymbols } = load()
    expect(labels(await searchSymbols('eat'))).toEqual(['eat'])
    expect(requested).toEqual(['/symbolIndex/en.json'])
  })

  it('falls back to English rather than an empty picker when an index is missing', async () => {
    const { searchSymbols } = load(['pl'])
    expect(labels(await searchSymbols('water', 'pl'))).toEqual(['water', 'watering can'])
    expect(requested).toEqual(['/symbolIndex/pl.json', '/symbolIndex/en.json'])
  })

  it('fetches each language once and reuses it', async () => {
    const { searchSymbols } = load()
    await searchSymbols('woda', 'pl')
    await searchSymbols('jeść', 'pl')
    await Promise.all([searchSymbols('agua', 'es'), searchSymbols('comer', 'es')])
    expect(requested).toEqual(['/symbolIndex/pl.json', '/symbolIndex/es.json'])
  })

  it('returns nothing for an empty query without fetching', async () => {
    const { searchSymbols } = load()
    expect(await searchSymbols('   ', 'pl')).toEqual([])
    expect(requested).toEqual([])
  })
})
