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
  // German fuses a preposition with a following article too, and unlike
  // Italian's the fusion is strongly preferred rather than strictly required:
  // `in dem Haus` is grammatical, it just is not what anyone says. `im Haus`
  // is, so a board that produces the unfused pair sounds stilted every time.
  //
  // Only the fusions that are standard in writing are here. `aufs`, `durchs`
  // and `ums` are left out: they are ordinary in speech but colloquial on the
  // page, and a communication device should not make its user sound casual
  // when they did not choose to.
  de: {
    in: { dem: 'im', das: 'ins' },
    an: { dem: 'am', das: 'ans' },
    zu: { dem: 'zum', der: 'zur' },
    bei: { dem: 'beim' },
    von: { dem: 'vom' },
    für: { das: 'fürs' },
  },
  // Italian fuses five prepositions with every form of the definite article,
  // and like Portuguese the fusion is obligatory rather than stylistic: `vado
  // a il parco` is not clumsy, it is wrong, and `al parco` is the only form.
  // `con` is left out on purpose — `col` has largely fallen out of written
  // use and `con il` is the ordinary modern form, so fusing it would make the
  // board sound dated rather than correct.
  it: {
    di: { il: 'del', lo: 'dello', la: 'della', i: 'dei', gli: 'degli', le: 'delle' },
    a: { il: 'al', lo: 'allo', la: 'alla', i: 'ai', gli: 'agli', le: 'alle' },
    da: { il: 'dal', lo: 'dallo', la: 'dalla', i: 'dai', gli: 'dagli', le: 'dalle' },
    in: { il: 'nel', lo: 'nello', la: 'nella', i: 'nei', gli: 'negli', le: 'nelle' },
    su: { il: 'sul', lo: 'sullo', la: 'sulla', i: 'sui', gli: 'sugli', le: 'sulle' },
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
