import type { PartOfSpeech } from '../constants/colors'
import type { MorphContext, WordForm } from './morphologyTypes'

// Italian word forms (§19.7). The closest engine to Spanish and Portuguese —
// gender/number agreement, person marked on the verb, pro-drop — so this file
// mirrors `morphology.es.ts`. What Italian does differently:
//
//  - SIX PERSONS, not four or five. Brazilian Portuguese could collapse the
//    paradigm because `você` really did take the third person; Italian has not
//    done that, and `voi siete` is ordinary everyday speech. Collapsing it
//    here would be inventing a simplification the language has not made, so
//    the popup carries all six.
//  - VELAR PLURALS. -co/-go keep the hard sound with an inserted h
//    (gioco → giochi) unless the stress falls back a syllable
//    (medico → medici), which nothing in the spelling predicts — a table
//    decides, the -h- form is the fallback.
//  - ORTHOGRAPHIC STEM CHANGES that are not irregularity: -care/-gare insert
//    h before a front vowel (giocare → giochi), -ciare/-giare drop the i
//    (mangiare → mangi). Miss these and the engine produces `giochi` as
//    `gioci`, which is a different word's spelling.
//  - -isc- VERBS. A large closed class of -ire verbs infixes -isc- in the
//    singular and third plural (capire → capisco). There is no rule; the
//    membership is listed.
//  - CONTRACTIONS live in `contractions.ts`, not here: `di + il = del` fuses
//    two TOKENS rather than inflecting one word, so it belongs to the message
//    bar. Italian needs that machinery as badly as Portuguese does.
//
// Pure + unit-tested.

type Gender = 'm' | 'f'

// ---- plurals ----------------------------------------------------------------

// -co/-go normally hardens with -h- (gioco → giochi). These are the everyday
// words where the stress sits a syllable further back and it does not.
const SOFT_VELAR_PLURAL: Record<string, string> = {
  amico: 'amici', nemico: 'nemici', medico: 'medici', greco: 'greci',
  porco: 'porci', asparago: 'asparagi', psicologo: 'psicologi',
  biologo: 'biologi', asino: 'asini',
}

const IRREGULAR_PLURAL: Record<string, string> = {
  uomo: 'uomini', dio: 'dèi', bue: 'buoi', tempio: 'templi',
  mano: 'mani', ala: 'ali', arma: 'armi',
  // Feminine in the plural — the everyday body-part set.
  braccio: 'braccia', dito: 'dita', ginocchio: 'ginocchia',
  labbro: 'labbra', orecchio: 'orecchie', osso: 'ossa', uovo: 'uova',
  lenzuolo: 'lenzuola', paio: 'paia', uso: 'usi',
}

// Invariable: stressed final vowel (città), consonant-final loans (bar),
// and the -i nouns (crisi).
function isInvariableNoun(w: string): boolean {
  if (/[àèéìòù]$/.test(w)) return true
  if (/[bcdfglmnprstvz]$/.test(w)) return true
  if (/i$/.test(w) && !/[aeiou]i$/.test(w)) return true
  return false
}

/** Plural of a noun or adjective. */
export function pluralize(word: string): string {
  const w = word.trim()
  if (!w) return w
  const lower = w.toLowerCase()

  const irregular = IRREGULAR_PLURAL[lower]
  if (irregular) return irregular
  if (isInvariableNoun(lower)) return w

  // -ca / -ga always harden: amica → amiche, riga → righe.
  if (/[cg]a$/.test(lower)) return `${w.slice(0, -1)}he`

  // -cia / -gia: the i survives after a vowel (camicia → camicie) and is
  // dropped after a consonant (arancia → arance).
  if (/[cg]ia$/.test(lower)) {
    const beforeC = lower.slice(-4, -3)
    return 'aeiou'.includes(beforeC) ? `${w.slice(0, -1)}e` : `${w.slice(0, -2)}e`
  }

  // -a → -e, except the Greek -ma masculines, which take -i.
  if (/a$/.test(lower)) {
    return /ma$/.test(lower) && inferGender(lower) === 'm'
      ? `${w.slice(0, -1)}i`
      : `${w.slice(0, -1)}e`
  }

  // -co / -go
  if (/[cg]o$/.test(lower)) {
    const soft = SOFT_VELAR_PLURAL[lower]
    if (soft) return soft
    return `${w.slice(0, -1)}hi`
  }

  // -io: one i unless it is the stressed one (zio → zii).
  if (/io$/.test(lower)) {
    return /[aeiou]io$/.test(lower) || lower === 'zio' ? `${w.slice(0, -1)}i` : `${w.slice(0, -2)}i`
  }

  // -o and -e both go to -i.
  if (/[oe]$/.test(lower)) return `${w.slice(0, -1)}i`

  return w
}

function looksPlural(word: string): boolean {
  const w = word.toLowerCase()
  if (w.length < 3) return false
  return /[ie]$/.test(w) && !isInvariableNoun(w)
}

// ---- gender -----------------------------------------------------------------

// Italian gender is readable off -o and -a; -e is the ending that is not, and
// the Greek -ma family is the one a rule gets backwards.
const GENDER_EXCEPTIONS: Record<string, Gender> = {
  // -a but masculine (Greek -ma, and the everyday rest)
  problema: 'm', tema: 'm', sistema: 'm', programma: 'm', clima: 'm',
  cinema: 'm', panorama: 'm', papà: 'm', pigiama: 'm', pianeta: 'm',
  // -o but feminine
  mano: 'f', radio: 'f', foto: 'f', moto: 'f', auto: 'f', biro: 'f',
  // -e that are feminine
  notte: 'f', madre: 'f', sorella: 'f', chiave: 'f', carne: 'f', gente: 'f',
  fame: 'f', sete: 'f', neve: 'f', nave: 'f', luce: 'f', voce: 'f', pace: 'f',
  croce: 'f', classe: 'f', arte: 'f', parte: 'f', mente: 'f', morte: 'f',
  febbre: 'f', torre: 'f', chiesa: 'f', estate: 'f', primavera: 'f',
  // -e / consonant that are masculine and might read otherwise
  padre: 'm', fratello: 'm', pane: 'm', latte: 'm', dente: 'm', piede: 'm',
  cane: 'm', pesce: 'm', nome: 'm', film: 'm', bar: 'm', sport: 'm',
  fiore: 'm', cuore: 'm', mare: 'm', sole: 'm', dolore: 'm', colore: 'm',
  bicchiere: 'm', giornale: 'm', ospedale: 'm', animale: 'm', caffè: 'm',
}

export function inferGender(noun: string): Gender {
  const w = noun.trim().toLowerCase()
  const exact = GENDER_EXCEPTIONS[w]
  if (exact) return exact

  if (/(zione|sione|gione|tà|tù|udine|ice)$/.test(w)) return 'f'
  if (/(ore|ame|ale|ile)$/.test(w)) return 'm'
  if (/a$/.test(w)) return 'f'
  return 'm'
}

// ---- adjectives -------------------------------------------------------------

export interface AdjectiveForms {
  ms: string
  fs: string
  mp: string
  fp: string
}

export function adjectiveAgreement(base: string): AdjectiveForms {
  const w = base.trim()
  const lower = w.toLowerCase()

  // Four-form class: -o / -a / -i / -e.
  if (/o$/.test(lower)) {
    const stem = w.slice(0, -1)
    const fem = `${stem}a`
    return { ms: w, fs: fem, mp: pluralize(w), fp: pluralize(fem) }
  }

  // Two-form class: -e marks number only (grande / grandi).
  if (/e$/.test(lower)) {
    const plural = pluralize(w)
    return { ms: w, fs: w, mp: plural, fp: plural }
  }

  // Invariable (blu, rosa, viola) and anything else.
  const plural = pluralize(w)
  return { ms: w, fs: w, mp: plural, fp: plural }
}

const IRREGULAR_COMPARATIVE: Record<string, string> = {
  buono: 'migliore', buona: 'migliore',
  cattivo: 'peggiore', cattiva: 'peggiore',
  grande: 'maggiore',
  piccolo: 'minore', piccola: 'minore',
}

// ---- verbs ------------------------------------------------------------------

export interface VerbForms {
  io: string
  tu: string
  /** `lui`, `lei` and the polite `Lei` share this form. */
  lui: string
  noi: string
  voi: string
  loro: string
  /** Participio passato — the form that pairs with essere/avere. */
  passato: string
  gerundio: string
}

// -ire verbs that infix -isc- in the singular and third plural. There is no
// rule for membership, so it is listed; everything else conjugates plain.
const ISC_VERBS = new Set([
  'capire', 'finire', 'pulire', 'preferire', 'costruire', 'spedire',
  'guarire', 'unire', 'colpire', 'punire', 'suggerire', 'restituire',
  'obbedire', 'ubbidire', 'stupire', 'sparire', 'chiarire', 'fornire',
])

const IRREGULAR_VERBS: Record<string, VerbForms> = {
  essere: { io: 'sono', tu: 'sei', lui: 'è', noi: 'siamo', voi: 'siete', loro: 'sono', passato: 'stato', gerundio: 'essendo' },
  avere: { io: 'ho', tu: 'hai', lui: 'ha', noi: 'abbiamo', voi: 'avete', loro: 'hanno', passato: 'avuto', gerundio: 'avendo' },
  fare: { io: 'faccio', tu: 'fai', lui: 'fa', noi: 'facciamo', voi: 'fate', loro: 'fanno', passato: 'fatto', gerundio: 'facendo' },
  andare: { io: 'vado', tu: 'vai', lui: 'va', noi: 'andiamo', voi: 'andate', loro: 'vanno', passato: 'andato', gerundio: 'andando' },
  stare: { io: 'sto', tu: 'stai', lui: 'sta', noi: 'stiamo', voi: 'state', loro: 'stanno', passato: 'stato', gerundio: 'stando' },
  dare: { io: 'do', tu: 'dai', lui: 'dà', noi: 'diamo', voi: 'date', loro: 'danno', passato: 'dato', gerundio: 'dando' },
  dire: { io: 'dico', tu: 'dici', lui: 'dice', noi: 'diciamo', voi: 'dite', loro: 'dicono', passato: 'detto', gerundio: 'dicendo' },
  venire: { io: 'vengo', tu: 'vieni', lui: 'viene', noi: 'veniamo', voi: 'venite', loro: 'vengono', passato: 'venuto', gerundio: 'venendo' },
  volere: { io: 'voglio', tu: 'vuoi', lui: 'vuole', noi: 'vogliamo', voi: 'volete', loro: 'vogliono', passato: 'voluto', gerundio: 'volendo' },
  potere: { io: 'posso', tu: 'puoi', lui: 'può', noi: 'possiamo', voi: 'potete', loro: 'possono', passato: 'potuto', gerundio: 'potendo' },
  dovere: { io: 'devo', tu: 'devi', lui: 'deve', noi: 'dobbiamo', voi: 'dovete', loro: 'devono', passato: 'dovuto', gerundio: 'dovendo' },
  sapere: { io: 'so', tu: 'sai', lui: 'sa', noi: 'sappiamo', voi: 'sapete', loro: 'sanno', passato: 'saputo', gerundio: 'sapendo' },
  uscire: { io: 'esco', tu: 'esci', lui: 'esce', noi: 'usciamo', voi: 'uscite', loro: 'escono', passato: 'uscito', gerundio: 'uscendo' },
  bere: { io: 'bevo', tu: 'bevi', lui: 'beve', noi: 'beviamo', voi: 'bevete', loro: 'bevono', passato: 'bevuto', gerundio: 'bevendo' },
  vedere: { io: 'vedo', tu: 'vedi', lui: 'vede', noi: 'vediamo', voi: 'vedete', loro: 'vedono', passato: 'visto', gerundio: 'vedendo' },
  tenere: { io: 'tengo', tu: 'tieni', lui: 'tiene', noi: 'teniamo', voi: 'tenete', loro: 'tengono', passato: 'tenuto', gerundio: 'tenendo' },
  sedere: { io: 'siedo', tu: 'siedi', lui: 'siede', noi: 'sediamo', voi: 'sedete', loro: 'siedono', passato: 'seduto', gerundio: 'sedendo' },
  scegliere: { io: 'scelgo', tu: 'scegli', lui: 'sceglie', noi: 'scegliamo', voi: 'scegliete', loro: 'scelgono', passato: 'scelto', gerundio: 'scegliendo' },
  leggere: { io: 'leggo', tu: 'leggi', lui: 'legge', noi: 'leggiamo', voi: 'leggete', loro: 'leggono', passato: 'letto', gerundio: 'leggendo' },
  scrivere: { io: 'scrivo', tu: 'scrivi', lui: 'scrive', noi: 'scriviamo', voi: 'scrivete', loro: 'scrivono', passato: 'scritto', gerundio: 'scrivendo' },
  aprire: { io: 'apro', tu: 'apri', lui: 'apre', noi: 'apriamo', voi: 'aprite', loro: 'aprono', passato: 'aperto', gerundio: 'aprendo' },
  chiudere: { io: 'chiudo', tu: 'chiudi', lui: 'chiude', noi: 'chiudiamo', voi: 'chiudete', loro: 'chiudono', passato: 'chiuso', gerundio: 'chiudendo' },
  prendere: { io: 'prendo', tu: 'prendi', lui: 'prende', noi: 'prendiamo', voi: 'prendete', loro: 'prendono', passato: 'preso', gerundio: 'prendendo' },
  mettere: { io: 'metto', tu: 'metti', lui: 'mette', noi: 'mettiamo', voi: 'mettete', loro: 'mettono', passato: 'messo', gerundio: 'mettendo' },
  rimanere: { io: 'rimango', tu: 'rimani', lui: 'rimane', noi: 'rimaniamo', voi: 'rimanete', loro: 'rimangono', passato: 'rimasto', gerundio: 'rimanendo' },
  morire: { io: 'muoio', tu: 'muori', lui: 'muore', noi: 'moriamo', voi: 'morite', loro: 'muoiono', passato: 'morto', gerundio: 'morendo' },
  piacere: { io: 'piaccio', tu: 'piaci', lui: 'piace', noi: 'piacciamo', voi: 'piacete', loro: 'piacciono', passato: 'piaciuto', gerundio: 'piacendo' },
  salire: { io: 'salgo', tu: 'sali', lui: 'sale', noi: 'saliamo', voi: 'salite', loro: 'salgono', passato: 'salito', gerundio: 'salendo' },
}

/**
 * Regular conjugation for the -are / -ere / -ire classes.
 *
 * The stem changes here are spelling, not irregularity: Italian writes the
 * sound, so a hard c or g needs an -h- before a front vowel and a soft one
 * loses the i that was only there to soften it.
 */
export function conjugate(infinitive: string): VerbForms | null {
  const v = infinitive.trim().toLowerCase()
  const irregular = IRREGULAR_VERBS[v]
  if (irregular) return irregular

  const stem = v.slice(0, -3)
  const ending = v.slice(-3)
  if (!stem) return null

  // Both spelling changes happen in the same place — the two -are endings that
  // begin with i (tu -i, noi -iamo) — and they are opposite operations:
  // giocare needs an h to keep the c hard (giochi), mangiare drops the i that
  // was only there to keep the g soft (mangi, not mangii).
  //
  // This applies to -are ONLY. In -ere and -ire the c or g already sits before
  // a front vowel in the infinitive, so it is soft throughout and inserting an
  // h would change the word: vincere → vinci, never `vinchi`.
  const front = /[cg]$/.test(stem)
    ? `${stem}h`
    : /[cg]i$/.test(stem)
      ? stem.slice(0, -1)
      : stem

  switch (ending) {
    case 'are':
      return {
        io: `${stem}o`, tu: `${front}i`, lui: `${stem}a`,
        noi: `${front}iamo`, voi: `${stem}ate`, loro: `${stem}ano`,
        passato: `${stem}ato`, gerundio: `${stem}ando`,
      }
    case 'ere':
      return {
        io: `${stem}o`, tu: `${stem}i`, lui: `${stem}e`,
        noi: `${stem}iamo`, voi: `${stem}ete`, loro: `${stem}ono`,
        passato: `${stem}uto`, gerundio: `${stem}endo`,
      }
    case 'ire': {
      if (ISC_VERBS.has(v)) {
        return {
          io: `${stem}isco`, tu: `${stem}isci`, lui: `${stem}isce`,
          noi: `${stem}iamo`, voi: `${stem}ite`, loro: `${stem}iscono`,
          passato: `${stem}ito`, gerundio: `${stem}endo`,
        }
      }
      return {
        io: `${stem}o`, tu: `${stem}i`, lui: `${stem}e`,
        noi: `${stem}iamo`, voi: `${stem}ite`, loro: `${stem}ono`,
        passato: `${stem}ito`, gerundio: `${stem}endo`,
      }
    }
    default:
      return null
  }
}

// ---- pronouns and determiners ------------------------------------------------

const PRONOUNS: Record<string, Array<[string, string]>> = {
  io: [['mi', 'a me'], ['me', 'dopo preposizione'], ['mio', 'cosa mia'], ['con me', 'con me']],
  tu: [['ti', 'a te'], ['te', 'dopo preposizione'], ['tuo', 'cosa tua'], ['con te', 'con te']],
  lui: [['lo', 'lui oggetto'], ['gli', 'a lui'], ['suo', 'cosa sua'], ['con lui', 'con lui']],
  lei: [['la', 'lei oggetto'], ['le', 'a lei'], ['suo', 'cosa sua'], ['con lei', 'con lei']],
  noi: [['ci', 'a noi'], ['nostro', 'cosa nostra'], ['con noi', 'con noi']],
  voi: [['vi', 'a voi'], ['vostro', 'cosa vostra'], ['con voi', 'con voi']],
  loro: [['li', 'loro oggetto'], ['gli', 'a loro'], ['loro', 'cosa loro']],
}

const DETERMINERS: Record<string, AdjectiveForms> = {
  // `lo`/`gli` appear before s+consonant, z, gn, ps — the article popup keeps
  // the common pair; the message bar's contractions handle the rest.
  il: { ms: 'il', fs: 'la', mp: 'i', fp: 'le' },
  la: { ms: 'il', fs: 'la', mp: 'i', fp: 'le' },
  lo: { ms: 'lo', fs: 'la', mp: 'gli', fp: 'le' },
  un: { ms: 'un', fs: 'una', mp: 'dei', fp: 'delle' },
  una: { ms: 'un', fs: 'una', mp: 'dei', fp: 'delle' },
  questo: { ms: 'questo', fs: 'questa', mp: 'questi', fp: 'queste' },
  quello: { ms: 'quello', fs: 'quella', mp: 'quelli', fp: 'quelle' },
  altro: { ms: 'altro', fs: 'altra', mp: 'altri', fp: 'altre' },
  molto: { ms: 'molto', fs: 'molta', mp: 'molti', fp: 'molte' },
  poco: { ms: 'poco', fs: 'poca', mp: 'pochi', fp: 'poche' },
  tutto: { ms: 'tutto', fs: 'tutta', mp: 'tutti', fp: 'tutte' },
  mio: { ms: 'mio', fs: 'mia', mp: 'miei', fp: 'mie' },
  tuo: { ms: 'tuo', fs: 'tua', mp: 'tuoi', fp: 'tue' },
  suo: { ms: 'suo', fs: 'sua', mp: 'suoi', fp: 'sue' },
}

const INVARIABLE = new Set([
  'e', 'o', 'ma', 'perché', 'che', 'di', 'a', 'da', 'in', 'con', 'su',
  'per', 'tra', 'fra', 'senza', 'sì', 'no', 'più', 'meno', 'anche',
  'qui', 'qua', 'lì', 'là', 'adesso', 'ora', 'dopo', 'prima', 'sempre',
  'mai', 'oggi', 'ieri', 'domani', 'ciao', 'grazie', 'prego', 'scusa',
  'quando', 'dove', 'come', 'chi', 'quanto', 'per favore', 'già', 'ancora',
  'non', 'molto', 'bene', 'male', 'forse', 'subito',
])

// ---- context ----------------------------------------------------------------

function agreementTarget(
  context: MorphContext | undefined,
): { gender: Gender; number: 'sg' | 'pl' } | null {
  const words = context?.precedingWords ?? []
  for (let i = words.length - 1; i >= 0; i--) {
    const raw = words[i]?.trim().toLowerCase()
    if (!raw) continue
    if (INVARIABLE.has(raw)) continue
    if (raw in DETERMINERS) continue
    const number = looksPlural(raw) ? 'pl' : 'sg'
    // Undo the plural to read gender off the singular ending: `case` is
    // feminine, but its -e ending would otherwise read as masculine.
    const singular =
      number === 'pl'
        ? /e$/.test(raw)
          ? `${raw.slice(0, -1)}a`
          : `${raw.slice(0, -1)}o`
        : raw
    return { gender: inferGender(singular), number }
  }
  return null
}

// ---- form builders ----------------------------------------------------------

function verbFormList(word: string, base: string): WordForm[] {
  const forms = conjugate(word)
  if (!forms) return [{ value: base, hint: '' }]
  return [
    { value: base, hint: '' },
    { value: forms.io, hint: 'io' },
    { value: forms.tu, hint: 'tu' },
    { value: forms.lui, hint: 'lui / lei' },
    { value: forms.noi, hint: 'noi' },
    { value: forms.voi, hint: 'voi' },
    { value: forms.loro, hint: 'loro' },
    { value: forms.passato, hint: 'passato' },
    { value: forms.gerundio, hint: 'adesso' },
  ]
}

function nounFormList(word: string, base: string): WordForm[] {
  const gender = inferGender(word)
  return [
    { value: base, hint: '' },
    { value: pluralize(base), hint: 'più di uno' },
    // No possessive ending — Italian uses `di`, which then fuses with the
    // article (di + il = del). See contractions.ts.
    { value: `di ${base}`, hint: 'di chi' },
    { value: `${gender === 'f' ? 'la' : 'il'} ${base}`, hint: 'con articolo' },
  ]
}

function adjectiveFormList(
  word: string,
  base: string,
  context: MorphContext | undefined,
): WordForm[] {
  const agreement = adjectiveAgreement(base)
  const target = agreementTarget(context)

  const all: Array<{ value: string; hint: string; key: keyof AdjectiveForms }> = [
    { value: agreement.ms, hint: 'maschile', key: 'ms' },
    { value: agreement.fs, hint: 'femminile', key: 'fs' },
    { value: agreement.mp, hint: 'maschile plurale', key: 'mp' },
    { value: agreement.fp, hint: 'femminile plurale', key: 'fp' },
  ]

  let ordered = all
  if (target) {
    const wanted: keyof AdjectiveForms =
      target.number === 'pl'
        ? target.gender === 'f' ? 'fp' : 'mp'
        : target.gender === 'f' ? 'fs' : 'ms'
    const match = all.find((f) => f.key === wanted)
    if (match) {
      ordered = [{ ...match, hint: 'concorda' }, ...all.filter((f) => f.key !== wanted)]
    }
  }

  const comparative = IRREGULAR_COMPARATIVE[word] ?? `più ${base}`
  return [...ordered.map(({ value, hint }) => ({ value, hint })), { value: comparative, hint: 'più' }]
}

function pronounFormList(word: string, base: string): WordForm[] {
  const alternatives = PRONOUNS[word]
  if (!alternatives) return [{ value: base, hint: '' }]
  return [{ value: base, hint: '' }, ...alternatives.map(([value, hint]) => ({ value, hint }))]
}

function determinerFormList(word: string, base: string): WordForm[] {
  const forms = DETERMINERS[word]
  if (!forms) return [{ value: base, hint: '' }]
  return [
    { value: forms.ms, hint: 'maschile' },
    { value: forms.fs, hint: 'femminile' },
    { value: forms.mp, hint: 'maschile plurale' },
    { value: forms.fp, hint: 'femminile plurale' },
  ]
}

function genericFormList(
  word: string,
  base: string,
  context: MorphContext | undefined,
): WordForm[] {
  if (/(are|ere|ire)$/.test(word) && word.length > 4 && conjugate(word)) {
    return verbFormList(word, base)
  }
  if (/(o|a|e)$/.test(word)) return adjectiveFormList(word, base, context)
  return [
    { value: base, hint: '' },
    { value: pluralize(base), hint: 'più di uno' },
  ]
}

/** Italian counterpart of `wordForms`. Same contract as the other engines. */
export function italianWordForms(
  word: string,
  pos?: PartOfSpeech,
  context?: MorphContext,
): WordForm[] {
  const base = word.trim()
  const w = base.toLowerCase()
  if (!w) return []
  if (INVARIABLE.has(w)) return [{ value: base, hint: '' }]

  let forms: WordForm[]
  switch (pos) {
    case 'verb':
      forms = verbFormList(w, base)
      break
    case 'noun':
      forms = nounFormList(w, base)
      break
    case 'descriptor':
      forms = adjectiveFormList(w, base, context)
      break
    case 'pronoun':
      forms = pronounFormList(w, base)
      break
    case 'little':
      forms = determinerFormList(w, base)
      break
    case 'social':
    case 'question':
      forms = [{ value: base, hint: '' }]
      break
    default:
      forms = genericFormList(w, base, context)
  }

  const seen = new Set<string>()
  return forms.filter((f) => (seen.has(f.value) ? false : seen.add(f.value)))
}
