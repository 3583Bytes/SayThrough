import { langCode } from '../i18n'

// §19.7 — obligatory contractions between two ADJACENT WORDS.
//
// This is not morphology and does not belong in the word-forms popup: nothing
// about the button labelled `de` changes until the word after it exists. It is
// a property of the message bar, so it lives here and is applied when a token
// is appended.
//
// Portuguese needs it and neither English nor Spanish does. `eu vou a o
// parque` is not merely clumsy, it is ungrammatical — the only correct form is
// `ao parque`. A board that lets someone tap `a` then `o` and speaks the two
// separately produces broken Portuguese every time, and there is no way for
// the user to fix it from the buttons available.
//
// Spanish has exactly two of these (a+el=al, de+el=del) and its board carries
// no bare `el` after a preposition, so it does not need the machinery.
//
// Applied at APPEND time rather than at render time on purpose: the fused form
// is genuinely one word, so making it one token keeps the message bar, the
// word-by-word highlight, delete-last-word and the history all correct with no
// further changes.

type Table = Record<string, Record<string, string>>

// first word → second word → fused form.
const TABLES: Partial<Record<string, Table>> = {
  pt: {
    de: {
      o: 'do', a: 'da', os: 'dos', as: 'das',
      um: 'dum', uma: 'duma',
      ele: 'dele', ela: 'dela', eles: 'deles', elas: 'delas',
      este: 'deste', esta: 'desta', isto: 'disto',
      esse: 'desse', essa: 'dessa', isso: 'disso',
      aquele: 'daquele', aquela: 'daquela', aquilo: 'daquilo',
      aqui: 'daqui', ali: 'dali',
    },
    em: {
      o: 'no', a: 'na', os: 'nos', as: 'nas',
      um: 'num', uma: 'numa',
      ele: 'nele', ela: 'nela', eles: 'neles', elas: 'nelas',
      este: 'neste', esta: 'nesta', isto: 'nisto',
      esse: 'nesse', essa: 'nessa', isso: 'nisso',
      aquele: 'naquele', aquela: 'naquela', aquilo: 'naquilo',
    },
    a: {
      o: 'ao', a: 'à', os: 'aos', as: 'às',
      aquele: 'àquele', aquela: 'àquela', aquilo: 'àquilo',
    },
    por: {
      o: 'pelo', a: 'pela', os: 'pelos', as: 'pelas',
    },
  },
  // Spanish has only the two, and they are included so the board stays correct
  // if a user adds `el` to a page themselves.
  es: {
    a: { el: 'al' },
    de: { el: 'del' },
  },
}

/**
 * The fused form of two adjacent words, or null when they do not contract.
 * Case-insensitive on input; preserves an initial capital on the result.
 */
export function contract(
  previous: string,
  next: string,
  language: string | undefined,
): string | null {
  const table = TABLES[langCode(language)]
  if (!table) return null

  const first = previous.trim()
  const second = next.trim()
  const fused = table[first.toLowerCase()]?.[second.toLowerCase()]
  if (!fused) return null

  // "De o parque" at the start of a message should become "Do parque".
  const capitalised = first[0] === first[0]?.toUpperCase() && first !== first.toLowerCase()
  return capitalised ? fused[0].toUpperCase() + fused.slice(1) : fused
}

/** Does this language contract at all? Lets callers skip the work entirely. */
export function hasContractions(language: string | undefined): boolean {
  return TABLES[langCode(language)] !== undefined
}
