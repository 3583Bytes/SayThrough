// §19.7 — the locally-authored Polish keywords that fill ARASAAC's gap.
//
// These assert properties of the COMMITTED artifact rather than of the
// generator, because the generator reads the raw ARASAAC indexes, which are
// gitignored and absent in CI. The shipped file is what users search, so the
// shipped file is what is checked here.
import overrides from '../../scripts/symbols/keyword-overrides.pl.json'
import index from '../../public/symbolIndex/pl.json'
import { fold } from '../../src/services/symbolCatalog'

type Entry = { id: string; library: string; keywords: string[] }

const entries = index as Entry[]
const table = overrides as Record<string, unknown>
const ids = Object.keys(table).filter((k) => !k.startsWith('_'))
const authored = new Map(ids.map((id) => [id, table[id] as string[]]))

describe('keyword-overrides.pl.json', () => {
  it('carries documentation of where these came from', () => {
    expect(typeof table._comment).toBe('string')
    expect(typeof table._provenance).toBe('string')
  })

  it('is keyed by numeric ARASAAC ids with non-empty keyword arrays', () => {
    expect(ids.length).toBeGreaterThan(1000)
    for (const [id, words] of authored) {
      expect(id).toMatch(/^\d+$/)
      expect(Array.isArray(words)).toBe(true)
      expect(words.length).toBeGreaterThan(0)
      for (const word of words) {
        expect(typeof word).toBe('string')
        expect(word.trim()).toBe(word)
        expect(word.length).toBeGreaterThan(0)
      }
    }
  })

  it('never repeats a keyword within one pictogram', () => {
    for (const [id, words] of authored) {
      expect(new Set(words).size).toBe(words.length)
    }
  })
})

describe('Polish clock faces', () => {
  const at = (time: string) =>
    [...authored.values()].find((words) => words.includes(time))

  it('names the NEXT hour at half past — the rule English and Spanish get wrong', () => {
    // 03:30 is "wpół do czwartej" (half TO four), never "half past three".
    expect(at('03:30')).toContain('wpół do czwartej')
    expect(at('15:30')).toContain('wpół do czwartej')
    expect(at('00:30')).toContain('wpół do pierwszej')
  })

  it('names the next hour at quarter to, in the nominative', () => {
    expect(at('03:45')).toContain('za kwadrans czwarta')
    expect(at('23:45')).toContain('za kwadrans dwunasta')
  })

  it('uses the locative after "po" at quarter past', () => {
    expect(at('03:15')).toContain('kwadrans po trzeciej')
  })

  it('gives midnight and noon their own names', () => {
    expect(at('00:00')).toContain('północ')
    expect(at('12:00')).toContain('południe')
  })

  it('keeps the 12- and 24-hour pictograms separable by their digital form', () => {
    // Both read "trzecia" aloud; only the digital keyword tells them apart.
    const three = [...authored.values()].filter((w) => w.includes('trzecia'))
    expect(three.length).toBeGreaterThan(1)
    for (const words of three) expect(words.some((w) => /^\d{2}:\d{2}$/.test(w))).toBe(true)
  })
})

describe('the built Polish index', () => {
  it('applied the overrides — nothing falls back to English any more', () => {
    const byId = new Map(entries.map((e) => [e.id.split(':')[1], e]))
    let applied = 0
    for (const [id, words] of authored) {
      const entry = byId.get(id)
      if (!entry) continue // not hosted in this build
      expect(entry.keywords).toEqual(words)
      applied++
    }
    expect(applied).toBeGreaterThan(1000)
  })

  it('folds to something searchable for every authored keyword', () => {
    // A keyword that folds to empty (punctuation only) would be dead weight.
    for (const words of authored.values()) {
      for (const word of words) expect(fold(word).length).toBeGreaterThan(0)
    }
  })

  it('is searchable without diacritics, which is why fold() exists', () => {
    const folded = entries.map((e) => e.keywords.map(fold))
    for (const probe of ['jesc', 'wpol do czwartej', 'wsciekly']) {
      expect(folded.some((ks) => ks.some((k) => k === fold(probe)))).toBe(true)
    }
  })
})
