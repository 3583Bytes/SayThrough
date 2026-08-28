import type { PartOfSpeech } from '../constants/colors'
import type { MorphContext, WordForm } from './morphologyTypes'

// Polish word forms (§19.7). The third engine, and the first one that needs
// machinery neither English nor Spanish did:
//
//  - CASE. A Polish noun changes shape according to what governs it — the
//    verb, or a preposition — not according to anything it agrees with.
//    `chcę wodę` (accusative) but `nie chcę wody` (genitive, because the
//    clause is negated). Nothing upstream can predict that, so the engine
//    OFFERS the cases and names them in plain Polish; the user picks.
//  - PAST-TENSE GENDER. Polish marks the speaker's own gender in the past
//    tense, in the first and second person: `byłem` vs `byłam`. A board that
//    offered only the masculine would misgender a female user every time she
//    talked about yesterday — in her own voice. So the profile carries a
//    grammatical gender and the matching form leads.
//  - ASPECT. Perfective/imperfective is a lexical pairing, not a rule, so the
//    common pairs are tabulated (`robić`/`zrobić`).
//
// Rules plus an exceptions table, same architecture as the other two engines.
// Polish declension is genuinely irregular at the edges; the tables target the
// vocabulary the bundled boards actually ship, and §19.6 review is where the
// rest gets caught.

type Gender = 'm' | 'f' | 'n'

/** Case names as a Polish speaker learns them — the hint shown under a form. */
const CASE_HINT = {
  nom: '', // mianownik — the citation form
  gen: 'kogo? czego?', // dopełniacz
  dat: 'komu? czemu?', // celownik
  acc: 'kogo? co?', // biernik
  ins: 'z kim? z czym?', // narzędnik
  loc: 'o kim? o czym?', // miejscownik
  voc: 'wołacz', // wołacz
  pl: 'liczba mnoga',
} as const

// ---- orthography ------------------------------------------------------------

// Consonant alternation before the soft endings -ie / -e (dative, locative).
// Longest stem-final cluster first, so `st` beats `t`.
const SOFTEN: Array<[RegExp, string]> = [
  [/st$/, 'ści'],
  [/zd$/, 'ździ'],
  [/sł$/, 'śl'],
  [/ch$/, 'sz'],
  [/k$/, 'c'],
  [/g$/, 'dz'],
  [/r$/, 'rz'],
  [/ł$/, 'l'],
  [/t$/, 'ci'],
  [/d$/, 'dzi'],
  [/b$/, 'bi'],
  [/p$/, 'pi'],
  [/m$/, 'mi'],
  [/w$/, 'wi'],
  [/f$/, 'fi'],
  [/n$/, 'ni'],
  [/s$/, 'si'],
  [/z$/, 'zi'],
]

/** Apply the dative/locative softening to a stem, returning stem + 'e'. */
function soften(stem: string): string {
  for (const [pattern, replacement] of SOFTEN) {
    if (pattern.test(stem)) return `${stem.replace(pattern, replacement)}e`
  }
  return `${stem}ie`
}

/** Stems that are already soft take -i/-y endings and never alternate. */
function isSoftStem(stem: string): boolean {
  return /(ć|ś|ź|ń|dź|j|l|cz|sz|ż|rz|dz|c|dż)$/.test(stem)
}

/** Genitive/plural ending for a feminine -a noun: -i after k/g and soft stems. */
function feminineGenitiveEnding(stem: string): string {
  if (/(k|g)$/.test(stem)) return 'i'
  if (/(ć|ś|ź|ń|dź|j|l)$/.test(stem)) return 'i'
  return 'y' // includes cz, sz, ż, rz, dz, c and all hard stems
}

// A stem-final soft consonant is respelled with `i` before a vowel ending:
// koń → konia, miś → misia, niedźwiedź → niedźwiedzia.
const SOFT_BEFORE_VOWEL: Array<[RegExp, string]> = [
  [/dź$/, 'dzi'],
  [/ń$/, 'ni'],
  [/ś$/, 'si'],
  [/ź$/, 'zi'],
  [/ć$/, 'ci'],
]

function beforeVowel(stem: string): string {
  for (const [pattern, replacement] of SOFT_BEFORE_VOWEL) {
    if (pattern.test(stem)) return stem.replace(pattern, replacement)
  }
  return stem
}

/** Instrumental -em softens a preceding k/g (ptak → ptakiem, róg → rogiem). */
function instrumentalEm(stem: string): string {
  return /(k|g)$/.test(stem) ? `${stem}iem` : `${stem}em`
}

// ---- gender -----------------------------------------------------------------

// Polish gender is mostly readable off the ending; these are the everyday
// words where it is not. `tata`, `dziadek`'s partner `babcia`, and the
// masculine personal nouns in -a are the ones a rule would get wrong.
const GENDER_EXCEPTIONS: Record<string, Gender> = {
  // -a but masculine (male persons)
  tata: 'm', dziadek: 'm', mężczyzna: 'm', kolega: 'm', poeta: 'm',
  // -e / consonant that are feminine
  noc: 'f', sól: 'f', twarz: 'f', rzecz: 'f', mysz: 'f', jesień: 'f',
  miłość: 'f', radość: 'f', pomoc: 'f', krew: 'f', dłoń: 'f', kość: 'f',
  wieś: 'f', część: 'f', nić: 'f', pościel: 'f',
  // neuter in -ę (imię, zwierzę) and -um
  imię: 'n', zwierzę: 'n', muzeum: 'n', dziecko: 'n', oko: 'n', ucho: 'n',
}

/** Grammatical gender of a noun, from its ending plus an exceptions table. */
export function inferGender(noun: string): Gender {
  const w = noun.trim().toLowerCase()
  const exact = GENDER_EXCEPTIONS[w]
  if (exact) return exact
  if (/(o|e|ę|um)$/.test(w)) return 'n'
  if (/a$/.test(w)) return 'f'
  // -ość / -ć / -ź are reliably feminine; -ń and -ew are NOT (koń, lew are
  // masculine), so those live in the exceptions table instead.
  if (/(ość|ść)$/.test(w)) return 'f'
  return 'm'
}

// Male PERSONS. They take accusative = genitive AND the masculine-personal
// plural (-i with softening, or -owie); animals take accusative = genitive but
// an ordinary plural, which is why the two sets are separate — collapsing them
// produced `ptacy` for `ptaki`.
const PERSONAL = new Set([
  'chłopiec', 'brat', 'kolega', 'nauczyciel', 'lekarz', 'pan', 'syn',
  'dziadek', 'tata', 'przyjaciel', 'sąsiad', 'wujek', 'kuzyn', 'ojciec',
  'mężczyzna', 'człowiek',
])

// -owie plural, a small closed set among the personal nouns.
const PLURAL_OWIE = new Set(['pan', 'syn', 'wujek', 'dziadek'])

const ANIMAL = new Set([
  'pies', 'kot', 'ptak', 'koń', 'miś', 'królik', 'słoń', 'lew', 'tygrys',
  'niedźwiedź', 'żółw', 'pająk', 'motyl', 'mysz', 'kurczak', 'małpa',
])

/** Accusative equals genitive for anything animate. */
const isAnimate = (w: string) => PERSONAL.has(w) || ANIMAL.has(w)

// Masculine genitive is -a or -u and the split is lexical, not phonological.
// These are the board words the default would get wrong.
const MASC_GENITIVE_U = new Set([
  'dom', 'chleb', 'ser', 'sok', 'obiad', 'deszcz', 'śnieg', 'wiatr', 'ból',
  'sklep', 'park', 'basen', 'stół', 'czas', 'rok', 'wieczór', 'ogród',
  'napój', 'pokój', 'ryż', 'sen', 'las',
])

// A closed set of masculine nouns takes locative -u despite a hard stem.
// `w domu`, not `w domie` — the rule would get every one of these wrong.
const MASC_LOCATIVE_U = new Set(['dom', 'syn', 'pan', 'stan', 'sen'])

// Stems that lose or change a vowel when an ending is added. The `-ek` and
// `-ec` nouns drop their e throughout the paradigm (ołówek → ołówka), which
// no phonological rule here would predict.
const STEM_CHANGES: Record<string, string> = {
  pies: 'ps', // pies → psa
  lew: 'lw',
  sen: 'sn',
  ojciec: 'ojc',
  chłopiec: 'chłopc',
  dzień: 'dni',
  stół: 'stoł',
  ogród: 'ogrod',
  wieczór: 'wieczor',
  samochód: 'samochod',
  lód: 'lod',
  miód: 'miod',
  ząb: 'zęb',
  dąb: 'dęb',
  // -ek / -ec / -er stems that drop the vowel
  palec: 'palc',
  widelec: 'widelc',
  ołówek: 'ołówk',
  kubek: 'kubk',
  dziadek: 'dziadk',
  pasek: 'pask',
  sweter: 'swetr',
  ręcznik: 'ręcznik',
  nóż: 'noż',
  napój: 'napoj',
  pokój: 'pokoj',
  ogień: 'ogni',
}

// Nouns the board carries in the plural because Polish has no everyday
// singular for them (or the plural IS the object): declining these as
// singulars produced `butya`, `drzwiowi`, `plecyem`.
const PLURAL_ONLY: Record<string, NounFormsPl> = {
  drzwi: { gen: 'drzwi', dat: 'drzwiom', ins: 'drzwiami', loc: 'drzwiach' },
  usta: { gen: 'ust', dat: 'ustom', ins: 'ustami', loc: 'ustach' },
  plecy: { gen: 'pleców', dat: 'plecom', ins: 'plecami', loc: 'plecach' },
  włosy: { gen: 'włosów', dat: 'włosom', ins: 'włosami', loc: 'włosach' },
  spodnie: { gen: 'spodni', dat: 'spodniom', ins: 'spodniami', loc: 'spodniach' },
  buty: { gen: 'butów', dat: 'butom', ins: 'butami', loc: 'butach' },
  okulary: { gen: 'okularów', dat: 'okularom', ins: 'okularami', loc: 'okularach' },
  nożyczki: { gen: 'nożyczek', dat: 'nożyczkom', ins: 'nożyczkami', loc: 'nożyczkach' },
  skarpetki: { gen: 'skarpetek', dat: 'skarpetkom', ins: 'skarpetkami', loc: 'skarpetkach' },
  rękawiczki: { gen: 'rękawiczek', dat: 'rękawiczkom', ins: 'rękawiczkami', loc: 'rękawiczkach' },
  kalosze: { gen: 'kaloszy', dat: 'kaloszom', ins: 'kaloszami', loc: 'kaloszach' },
  klocki: { gen: 'klocków', dat: 'klockom', ins: 'klockami', loc: 'klockach' },
  bańki: { gen: 'baniek', dat: 'bańkom', ins: 'bańkami', loc: 'bańkach' },
  lody: { gen: 'lodów', dat: 'lodom', ins: 'lodami', loc: 'lodach' },
  puzzle: { gen: 'puzzli', dat: 'puzzlom', ins: 'puzzlami', loc: 'puzzlach' },
  kąpielówki: { gen: 'kąpielówek', dat: 'kąpielówkom', ins: 'kąpielówkami', loc: 'kąpielówkach' },
  góry: { gen: 'gór', dat: 'górom', ins: 'górami', loc: 'górach' },
  urodziny: { gen: 'urodzin', dat: 'urodzinom', ins: 'urodzinami', loc: 'urodzinach' },
}

interface NounFormsPl {
  gen: string
  dat: string
  ins: string
  loc: string
}

// Indeclinable loanwords — every case is the citation form.
const INDECLINABLE = new Set(['kakao', 'menu', 'radio', 'taxi', 'zoo', 'euro'])

// ---- noun declension --------------------------------------------------------

export interface NounForms {
  nom: string
  gen: string
  dat: string
  acc: string
  ins: string
  loc: string
  voc: string
  pl: string
}

// Nouns whose paradigm no rule reaches. Kept small on purpose: every entry
// here is a rule that failed, and worth reviewing rather than hiding.
const IRREGULAR_NOUNS: Record<string, NounForms> = {
  ręka: { nom: 'ręka', gen: 'ręki', dat: 'ręce', acc: 'rękę', ins: 'ręką', loc: 'ręce', voc: 'ręko', pl: 'ręce' },
  oko: { nom: 'oko', gen: 'oka', dat: 'oku', acc: 'oko', ins: 'okiem', loc: 'oku', voc: 'oko', pl: 'oczy' },
  ucho: { nom: 'ucho', gen: 'ucha', dat: 'uchu', acc: 'ucho', ins: 'uchem', loc: 'uchu', voc: 'ucho', pl: 'uszy' },
  dziecko: { nom: 'dziecko', gen: 'dziecka', dat: 'dziecku', acc: 'dziecko', ins: 'dzieckiem', loc: 'dziecku', voc: 'dziecko', pl: 'dzieci' },
  człowiek: { nom: 'człowiek', gen: 'człowieka', dat: 'człowiekowi', acc: 'człowieka', ins: 'człowiekiem', loc: 'człowieku', voc: 'człowieku', pl: 'ludzie' },
  imię: { nom: 'imię', gen: 'imienia', dat: 'imieniu', acc: 'imię', ins: 'imieniem', loc: 'imieniu', voc: 'imię', pl: 'imiona' },
  zwierzę: { nom: 'zwierzę', gen: 'zwierzęcia', dat: 'zwierzęciu', acc: 'zwierzę', ins: 'zwierzęciem', loc: 'zwierzęciu', voc: 'zwierzę', pl: 'zwierzęta' },
  tata: { nom: 'tata', gen: 'taty', dat: 'tacie', acc: 'tatę', ins: 'tatą', loc: 'tacie', voc: 'tato', pl: 'tatusiowie' },
  pies: { nom: 'pies', gen: 'psa', dat: 'psu', acc: 'psa', ins: 'psem', loc: 'psie', voc: 'psie', pl: 'psy' },
  brat: { nom: 'brat', gen: 'brata', dat: 'bratu', acc: 'brata', ins: 'bratem', loc: 'bracie', voc: 'bracie', pl: 'bracia' },
  dzień: { nom: 'dzień', gen: 'dnia', dat: 'dniowi', acc: 'dzień', ins: 'dniem', loc: 'dniu', voc: 'dniu', pl: 'dni' },
  tydzień: { nom: 'tydzień', gen: 'tygodnia', dat: 'tygodniowi', acc: 'tydzień', ins: 'tygodniem', loc: 'tygodniu', voc: 'tygodniu', pl: 'tygodnie' },
  przyjaciel: { nom: 'przyjaciel', gen: 'przyjaciela', dat: 'przyjacielowi', acc: 'przyjaciela', ins: 'przyjacielem', loc: 'przyjacielu', voc: 'przyjacielu', pl: 'przyjaciele' },
  // a → e in the locative; no rule here predicts it
  las: { nom: 'las', gen: 'lasu', dat: 'lasowi', acc: 'las', ins: 'lasem', loc: 'lesie', voc: 'lesie', pl: 'lasy' },
  obiad: { nom: 'obiad', gen: 'obiadu', dat: 'obiadowi', acc: 'obiad', ins: 'obiadem', loc: 'obiedzie', voc: 'obiedzie', pl: 'obiady' },
  wiatr: { nom: 'wiatr', gen: 'wiatru', dat: 'wiatrowi', acc: 'wiatr', ins: 'wiatrem', loc: 'wietrze', voc: 'wietrze', pl: 'wiatry' },
  światło: { nom: 'światło', gen: 'światła', dat: 'światłu', acc: 'światło', ins: 'światłem', loc: 'świetle', voc: 'światło', pl: 'światła' },
  miasto: { nom: 'miasto', gen: 'miasta', dat: 'miastu', acc: 'miasto', ins: 'miastem', loc: 'mieście', voc: 'miasto', pl: 'miasta' },
  ramię: { nom: 'ramię', gen: 'ramienia', dat: 'ramieniu', acc: 'ramię', ins: 'ramieniem', loc: 'ramieniu', voc: 'ramię', pl: 'ramiona' },
  rok: { nom: 'rok', gen: 'roku', dat: 'rokowi', acc: 'rok', ins: 'rokiem', loc: 'roku', voc: 'roku', pl: 'lata' },
  lód: { nom: 'lód', gen: 'lodu', dat: 'lodowi', acc: 'lód', ins: 'lodem', loc: 'lodzie', voc: 'lodzie', pl: 'lody' },
  pani: { nom: 'pani', gen: 'pani', dat: 'pani', acc: 'panią', ins: 'panią', loc: 'pani', voc: 'pani', pl: 'panie' },
  słońce: { nom: 'słońce', gen: 'słońca', dat: 'słońcu', acc: 'słońce', ins: 'słońcem', loc: 'słońcu', voc: 'słońce', pl: 'słońca' },
  serce: { nom: 'serce', gen: 'serca', dat: 'sercu', acc: 'serce', ins: 'sercem', loc: 'sercu', voc: 'serce', pl: 'serca' },
  szyja: { nom: 'szyja', gen: 'szyi', dat: 'szyi', acc: 'szyję', ins: 'szyją', loc: 'szyi', voc: 'szyjo', pl: 'szyje' },
  mysz: { nom: 'mysz', gen: 'myszy', dat: 'myszy', acc: 'mysz', ins: 'myszą', loc: 'myszy', voc: 'myszy', pl: 'myszy' },
}

// Personal plurals with a vowel alternation no rule predicts.
const PERSONAL_PLURAL: Record<string, string> = {
  sąsiad: 'sąsiedzi',
  brat: 'bracia',
  ojciec: 'ojcowie',
}

/** Nominative plural for a masculine noun — the messiest corner of the rules. */
function masculinePlural(word: string, stem: string): string {
  const listed = PERSONAL_PLURAL[word]
  if (listed) return listed
  if (PLURAL_OWIE.has(word)) return `${stem}owie`
  if (PERSONAL.has(word)) {
    // Masculine-personal: -i, with the same softening adjectives use.
    if (/g$/.test(stem)) return `${stem.slice(0, -1)}dzy` // kolega → koledzy
    if (/d$/.test(stem)) return `${stem.slice(0, -1)}dzi`
    if (/k$/.test(stem)) return `${stem.slice(0, -1)}cy`
    if (/r$/.test(stem)) return `${stem.slice(0, -1)}rzy`
    if (isSoftStem(stem)) return `${stem}e` // lekarz → lekarze
    return `${stem}i`
  }
  if (isSoftStem(stem) || /l$/.test(stem)) return `${beforeVowel(stem)}e` // koń → konie
  if (/(k|g)$/.test(stem)) return `${stem}i` // ptak → ptaki
  return `${stem}y` // kot → koty, dom → domy
}

/** Full singular paradigm plus the nominative plural. */

export function declineNoun(noun: string): NounForms | null {
  const w = noun.trim().toLowerCase()
  if (!w || w.includes(' ')) return null

  const irregular = IRREGULAR_NOUNS[w]
  if (irregular) return irregular

  if (INDECLINABLE.has(w)) {
    return { nom: w, gen: w, dat: w, acc: w, ins: w, loc: w, voc: w, pl: w }
  }

  // Plural-only nouns have no singular to build one from.
  const pluralOnly = PLURAL_ONLY[w]
  if (pluralOnly) {
    return {
      nom: w,
      gen: pluralOnly.gen,
      dat: pluralOnly.dat,
      acc: w,
      ins: pluralOnly.ins,
      loc: pluralOnly.loc,
      voc: w,
      pl: w,
    }
  }

  const gender = inferGender(w)

  // ---- anything in -a, feminine or masculine -------------------------------
  // Masculine persons in -a (tata, kolega) decline like feminines in the
  // singular and only differ in the plural, so they share this branch.
  if (/a$/.test(w) && (gender === 'f' || gender === 'm')) {
    const stem = w.slice(0, -1)
    // A stem ending in -i already carries its softness (babcia, ciocia,
    // kuchnia): the oblique cases ARE the stem, with no ending and no
    // alternation. Without this the rules produced `babciy` and `babciie`.
    if (/i$/.test(stem)) {
      return {
        nom: w, gen: stem, dat: stem, acc: `${stem}ę`,
        ins: `${stem}ą`, loc: stem, voc: `${stem}u`, pl: `${stem}e`,
      }
    }
    const g = feminineGenitiveEnding(stem)
    const soft = isSoftStem(stem)
    const oblique = soft ? `${stem}${g}` : soften(stem)
    return {
      nom: w,
      gen: `${stem}${g}`,
      dat: oblique,
      acc: `${stem}ę`,
      ins: `${stem}ą`,
      loc: oblique,
      voc: soft ? `${stem}u` : `${stem}o`,
      // Soft stems take -e in the plural (owca → owce, burza → burze);
      // masculine persons take the personal plural (kolega → koledzy).
      pl:
        gender === 'm'
          ? masculinePlural(w, stem)
          : soft
            ? `${stem}e`
            : `${stem}${g}`,
    }
  }

  // ---- feminine ending in a soft consonant (noc, twarz, kość) --------------
  if (gender === 'f') {
    return {
      nom: w,
      gen: `${w}y`.replace(/([ćśźńj])y$/, '$1i'),
      dat: `${w}y`.replace(/([ćśźńj])y$/, '$1i'),
      acc: w,
      ins: `${w}ą`,
      loc: `${w}y`.replace(/([ćśźńj])y$/, '$1i'),
      voc: `${w}y`.replace(/([ćśźńj])y$/, '$1i'),
      pl: `${w}e`,
    }
  }

  // ---- neuter in -o / -e ---------------------------------------------------
  if (gender === 'n' && /[oe]$/.test(w)) {
    const stem = w.slice(0, -1)
    const hardBack = /(k|g|ch)$/.test(stem)
    // A stem ending in -i is already soft (zadanie, mieszkanie): the oblique
    // cases take -u rather than the -ie the softening rule would append.
    const softStem = hardBack || isSoftStem(stem) || /i$/.test(stem)
    return {
      nom: w,
      gen: `${stem}a`,
      dat: `${stem}u`,
      acc: w,
      ins: instrumentalEm(stem),
      loc: softStem ? `${stem}u` : soften(stem),
      voc: w,
      pl: `${stem}a`,
    }
  }

  // ---- masculine (consonant-final) ----------------------------------------
  if (gender === 'm') {
    const raw = STEM_CHANGES[w] ?? w
    // Soft stems respell before a vowel ending: koń → konia, miś → misia.
    const stem = beforeVowel(raw)
    const gen = MASC_GENITIVE_U.has(w) ? `${stem}u` : `${stem}a`
    const hardBack = /(k|g|ch)$/.test(raw)
    const soft = isSoftStem(raw) || raw !== stem
    const loc =
      MASC_LOCATIVE_U.has(w) || hardBack || soft ? `${stem}u` : soften(raw)
    return {
      nom: w,
      gen,
      dat: `${stem}owi`,
      acc: isAnimate(w) ? gen : w,
      ins: instrumentalEm(stem),
      loc,
      voc: loc,
      pl: masculinePlural(w, raw),
    }
  }

  return null
}


// ---- adjectives -------------------------------------------------------------

export interface AdjectiveForms {
  m: string
  f: string
  n: string
  /** męskoosobowy — plural referring to a group including men. */
  mp: string
  /** niemęskoosobowy — every other plural. */
  nmp: string
}

// Masculine-personal plural softens the stem: dobry → dobrzy, duży → duzi.
const MP_SOFTEN: Array<[RegExp, string]> = [
  [/st$/, 'ści'],
  [/r$/, 'rzy'],
  [/ż$/, 'zi'],
  [/sz$/, 'si'],
  [/ł$/, 'li'],
  [/n$/, 'ni'],
  [/t$/, 'ci'],
  [/d$/, 'dzi'],
  [/k$/, 'cy'],
  [/g$/, 'dzy'],
  [/ch$/, 'si'],
]

// Polish numerals inflect, but not like adjectives — and `dwa` vs `dwie` is a
// distinction a board has to get right (dwa koty, dwie mamy). Running them
// through the adjective rules produced `cztera`.
const NUMERALS: Record<string, AdjectiveForms> = {
  jeden: { m: 'jeden', f: 'jedna', n: 'jedno', mp: 'jedni', nmp: 'jedne' },
  dwa: { m: 'dwa', f: 'dwie', n: 'dwa', mp: 'dwaj', nmp: 'dwie' },
  trzy: { m: 'trzy', f: 'trzy', n: 'trzy', mp: 'trzej', nmp: 'trzy' },
  cztery: { m: 'cztery', f: 'cztery', n: 'cztery', mp: 'czterej', nmp: 'cztery' },
  pięć: { m: 'pięć', f: 'pięć', n: 'pięć', mp: 'pięciu', nmp: 'pięć' },
}

export function adjectiveAgreement(base: string): AdjectiveForms | null {
  const w = base.trim().toLowerCase()
  const numeral = NUMERALS[w]
  if (numeral) return numeral
  if (!/(y|i)$/.test(w)) return null
  const stem = w.slice(0, -1)

  let mp = `${stem}i`
  for (const [pattern, replacement] of MP_SOFTEN) {
    if (pattern.test(stem)) {
      mp = stem.replace(pattern, replacement)
      break
    }
  }

  // A k/g stem keeps its softness: długi → długie, not `długe`.
  const neuter = /(k|g)$/.test(stem) ? `${stem}ie` : `${stem}e`
  return { m: w, f: `${stem}a`, n: neuter, mp, nmp: neuter }
}

// ---- verbs ------------------------------------------------------------------

export interface VerbForms {
  ja: string
  ty: string
  on: string
  my: string
  wy: string
  oni: string
  /** Past, 1st person singular — masculine and feminine. */
  pastM: string
  pastF: string
  /** The perfective partner, where the pair is common. */
  perfective?: string
}

// High-frequency verbs, tabulated because Polish conjugation classes do not
// predict these and getting `jestem` or `idę` wrong would be worse than
// offering nothing.
const IRREGULAR_VERBS: Record<string, VerbForms> = {
  być: { ja: 'jestem', ty: 'jesteś', on: 'jest', my: 'jesteśmy', wy: 'jesteście', oni: 'są', pastM: 'byłem', pastF: 'byłam' },
  mieć: { ja: 'mam', ty: 'masz', on: 'ma', my: 'mamy', wy: 'macie', oni: 'mają', pastM: 'miałem', pastF: 'miałam' },
  chcieć: { ja: 'chcę', ty: 'chcesz', on: 'chce', my: 'chcemy', wy: 'chcecie', oni: 'chcą', pastM: 'chciałem', pastF: 'chciałam' },
  iść: { ja: 'idę', ty: 'idziesz', on: 'idzie', my: 'idziemy', wy: 'idziecie', oni: 'idą', pastM: 'szedłem', pastF: 'szłam', perfective: 'pójść' },
  jeść: { ja: 'jem', ty: 'jesz', on: 'je', my: 'jemy', wy: 'jecie', oni: 'jedzą', pastM: 'jadłem', pastF: 'jadłam', perfective: 'zjeść' },
  pić: { ja: 'piję', ty: 'pijesz', on: 'pije', my: 'pijemy', wy: 'pijecie', oni: 'piją', pastM: 'piłem', pastF: 'piłam', perfective: 'wypić' },
  móc: { ja: 'mogę', ty: 'możesz', on: 'może', my: 'możemy', wy: 'możecie', oni: 'mogą', pastM: 'mogłem', pastF: 'mogłam' },
  wiedzieć: { ja: 'wiem', ty: 'wiesz', on: 'wie', my: 'wiemy', wy: 'wiecie', oni: 'wiedzą', pastM: 'wiedziałem', pastF: 'wiedziałam' },
  dać: { ja: 'dam', ty: 'dasz', on: 'da', my: 'damy', wy: 'dacie', oni: 'dadzą', pastM: 'dałem', pastF: 'dałam' },
  widzieć: { ja: 'widzę', ty: 'widzisz', on: 'widzi', my: 'widzimy', wy: 'widzicie', oni: 'widzą', pastM: 'widziałem', pastF: 'widziałam', perfective: 'zobaczyć' },
  robić: { ja: 'robię', ty: 'robisz', on: 'robi', my: 'robimy', wy: 'robicie', oni: 'robią', pastM: 'robiłem', pastF: 'robiłam', perfective: 'zrobić' },
  lubić: { ja: 'lubię', ty: 'lubisz', on: 'lubi', my: 'lubimy', wy: 'lubicie', oni: 'lubią', pastM: 'lubiłem', pastF: 'lubiłam' },
  spać: { ja: 'śpię', ty: 'śpisz', on: 'śpi', my: 'śpimy', wy: 'śpicie', oni: 'śpią', pastM: 'spałem', pastF: 'spałam' },
  pisać: { ja: 'piszę', ty: 'piszesz', on: 'pisze', my: 'piszemy', wy: 'piszecie', oni: 'piszą', pastM: 'pisałem', pastF: 'pisałam', perfective: 'napisać' },
  brać: { ja: 'biorę', ty: 'bierzesz', on: 'bierze', my: 'bierzemy', wy: 'bierzecie', oni: 'biorą', pastM: 'brałem', pastF: 'brałam', perfective: 'wziąć' },
  prosić: { ja: 'proszę', ty: 'prosisz', on: 'prosi', my: 'prosimy', wy: 'prosicie', oni: 'proszą', pastM: 'prosiłem', pastF: 'prosiłam', perfective: 'poprosić' },
  patrzeć: { ja: 'patrzę', ty: 'patrzysz', on: 'patrzy', my: 'patrzymy', wy: 'patrzycie', oni: 'patrzą', pastM: 'patrzyłem', pastF: 'patrzyłam' },
  stać: { ja: 'stoję', ty: 'stoisz', on: 'stoi', my: 'stoimy', wy: 'stoicie', oni: 'stoją', pastM: 'stałem', pastF: 'stałam' },
  siedzieć: { ja: 'siedzę', ty: 'siedzisz', on: 'siedzi', my: 'siedzimy', wy: 'siedzicie', oni: 'siedzą', pastM: 'siedziałem', pastF: 'siedziałam' },
  pomóc: { ja: 'pomogę', ty: 'pomożesz', on: 'pomoże', my: 'pomożemy', wy: 'pomożecie', oni: 'pomogą', pastM: 'pomogłem', pastF: 'pomogłam' },
  otworzyć: { ja: 'otworzę', ty: 'otworzysz', on: 'otworzy', my: 'otworzymy', wy: 'otworzycie', oni: 'otworzą', pastM: 'otworzyłem', pastF: 'otworzyłam' },
  zamknąć: { ja: 'zamknę', ty: 'zamkniesz', on: 'zamknie', my: 'zamkniemy', wy: 'zamkniecie', oni: 'zamkną', pastM: 'zamknąłem', pastF: 'zamknęłam' },
  myć: { ja: 'myję', ty: 'myjesz', on: 'myje', my: 'myjemy', wy: 'myjecie', oni: 'myją', pastM: 'myłem', pastF: 'myłam', perfective: 'umyć' },
  bawić: { ja: 'bawię', ty: 'bawisz', on: 'bawi', my: 'bawimy', wy: 'bawicie', oni: 'bawią', pastM: 'bawiłem', pastF: 'bawiłam' },
  śpiewać: { ja: 'śpiewam', ty: 'śpiewasz', on: 'śpiewa', my: 'śpiewamy', wy: 'śpiewacie', oni: 'śpiewają', pastM: 'śpiewałem', pastF: 'śpiewałam', perfective: 'zaśpiewać' },
  tańczyć: { ja: 'tańczę', ty: 'tańczysz', on: 'tańczy', my: 'tańczymy', wy: 'tańczycie', oni: 'tańczą', pastM: 'tańczyłem', pastF: 'tańczyłam' },
  słuchać: { ja: 'słucham', ty: 'słuchasz', on: 'słucha', my: 'słuchamy', wy: 'słuchacie', oni: 'słuchają', pastM: 'słuchałem', pastF: 'słuchałam' },
  mówić: { ja: 'mówię', ty: 'mówisz', on: 'mówi', my: 'mówimy', wy: 'mówicie', oni: 'mówią', pastM: 'mówiłem', pastF: 'mówiłam', perfective: 'powiedzieć' },
  czekać: { ja: 'czekam', ty: 'czekasz', on: 'czeka', my: 'czekamy', wy: 'czekacie', oni: 'czekają', pastM: 'czekałem', pastF: 'czekałam', perfective: 'poczekać' },
  szukać: { ja: 'szukam', ty: 'szukasz', on: 'szuka', my: 'szukamy', wy: 'szukacie', oni: 'szukają', pastM: 'szukałem', pastF: 'szukałam' },
  czytać: { ja: 'czytam', ty: 'czytasz', on: 'czyta', my: 'czytamy', wy: 'czytacie', oni: 'czytają', pastM: 'czytałem', pastF: 'czytałam', perfective: 'przeczytać' },
  potrzebować: { ja: 'potrzebuję', ty: 'potrzebujesz', on: 'potrzebuje', my: 'potrzebujemy', wy: 'potrzebujecie', oni: 'potrzebują', pastM: 'potrzebowałem', pastF: 'potrzebowałam' },
  skończyć: { ja: 'skończę', ty: 'skończysz', on: 'skończy', my: 'skończymy', wy: 'skończycie', oni: 'skończą', pastM: 'skończyłem', pastF: 'skończyłam' },
  // `boleć` is used in the 3rd person: "boli mnie głowa"
  boleć: { ja: 'bolę', ty: 'bolisz', on: 'boli', my: 'bolimy', wy: 'bolicie', oni: 'bolą', pastM: 'bolał', pastF: 'bolała' },
  biegać: { ja: 'biegam', ty: 'biegasz', on: 'biega', my: 'biegamy', wy: 'biegacie', oni: 'biegają', pastM: 'biegałem', pastF: 'biegałam' },
  ciąć: { ja: 'tnę', ty: 'tniesz', on: 'tnie', my: 'tniemy', wy: 'tniecie', oni: 'tną', pastM: 'ciąłem', pastF: 'cięłam' },
  zdjąć: { ja: 'zdejmę', ty: 'zdejmiesz', on: 'zdejmie', my: 'zdejmiemy', wy: 'zdejmiecie', oni: 'zdejmą', pastM: 'zdjąłem', pastF: 'zdjęłam' },
}

/**
 * Present tense plus the gendered first-person past. Regular patterns cover
 * -ać (czytam), -ować (pracuję) and -ić/-yć (robię); anything else falls back
 * to the table above and returns null when it is not there.
 */
export function conjugate(infinitive: string): VerbForms | null {
  const v = infinitive.trim().toLowerCase()
  const irregular = IRREGULAR_VERBS[v]
  if (irregular) return irregular

  // -ować → -uję (pracować → pracuję)
  if (/ować$/.test(v)) {
    const stem = v.slice(0, -4)
    return {
      ja: `${stem}uję`, ty: `${stem}ujesz`, on: `${stem}uje`,
      my: `${stem}ujemy`, wy: `${stem}ujecie`, oni: `${stem}ują`,
      pastM: `${stem}owałem`, pastF: `${stem}owałam`,
    }
  }

  // -ać → -am (czytać → czytam)
  if (/ać$/.test(v)) {
    const stem = v.slice(0, -2)
    return {
      ja: `${stem}am`, ty: `${stem}asz`, on: `${stem}a`,
      my: `${stem}amy`, wy: `${stem}acie`, oni: `${stem}ają`,
      pastM: `${stem}ałem`, pastF: `${stem}ałam`,
    }
  }

  // -ić / -yć → -ię / -ę (robić → robię, tańczyć → tańczę)
  if (/(ić|yć)$/.test(v)) {
    const stem = v.slice(0, -2)
    const soft = /ić$/.test(v)
    return {
      ja: soft ? `${stem}ię` : `${stem}ę`,
      ty: soft ? `${stem}isz` : `${stem}ysz`,
      on: soft ? `${stem}i` : `${stem}y`,
      my: soft ? `${stem}imy` : `${stem}ymy`,
      wy: soft ? `${stem}icie` : `${stem}ycie`,
      oni: soft ? `${stem}ią` : `${stem}ą`,
      pastM: soft ? `${stem}iłem` : `${stem}yłem`,
      pastF: soft ? `${stem}iłam` : `${stem}yłam`,
    }
  }

  return null // not an infinitive — a board word like `więcej`
}

// ---- pronouns and function words --------------------------------------------

const PRONOUNS: Record<string, Array<[string, string]>> = {
  ja: [['mnie', CASE_HINT.gen], ['mi', CASE_HINT.dat], ['ze mną', CASE_HINT.ins]],
  ty: [['ciebie', CASE_HINT.gen], ['ci', CASE_HINT.dat], ['cię', CASE_HINT.acc], ['z tobą', CASE_HINT.ins]],
  on: [['jego', CASE_HINT.gen], ['jemu', CASE_HINT.dat], ['go', CASE_HINT.acc], ['z nim', CASE_HINT.ins]],
  ona: [['jej', CASE_HINT.gen], ['ją', CASE_HINT.acc], ['z nią', CASE_HINT.ins]],
  my: [['nas', CASE_HINT.gen], ['nam', CASE_HINT.dat], ['z nami', CASE_HINT.ins]],
  wy: [['was', CASE_HINT.gen], ['wam', CASE_HINT.dat], ['z wami', CASE_HINT.ins]],
  oni: [['ich', CASE_HINT.gen], ['im', CASE_HINT.dat], ['z nimi', CASE_HINT.ins]],
  to: [['tego', CASE_HINT.gen], ['temu', CASE_HINT.dat], ['tym', CASE_HINT.ins]],
  mój: [['moja', 'rodzaj żeński'], ['moje', 'rodzaj nijaki'], ['moi', 'męskoosobowy'], ['mojego', CASE_HINT.gen]],
  twój: [['twoja', 'rodzaj żeński'], ['twoje', 'rodzaj nijaki'], ['twoi', 'męskoosobowy'], ['twojego', CASE_HINT.gen]],
}

// Function words with nothing to offer — the popup stays shut on these.
const INVARIABLE = new Set([
  'i', 'a', 'albo', 'lub', 'ale', 'bo', 'że', 'w', 'na', 'do', 'z', 'ze',
  'od', 'po', 'przy', 'o', 'za', 'pod', 'nad', 'przed', 'bez', 'dla',
  'tak', 'nie', 'już', 'jeszcze', 'tu', 'tam', 'teraz', 'potem', 'zawsze',
  'nigdy', 'dziś', 'wczoraj', 'jutro', 'bardzo', 'też', 'znowu', 'proszę',
  'dziękuję', 'cześć', 'dobrze', 'źle', 'gdzie', 'kiedy', 'jak', 'dlaczego',
  'kto', 'co', 'ile', 'więcej', 'mniej', 'się', 'stop', 'jeśli', 'tylko',
  'razem', 'osobno', 'obok', 'między', 'blisko', 'daleko', 'czy',
])

// ---- context ----------------------------------------------------------------

/** Gender of the noun an adjective should agree with, or null. */
function agreementGender(context: MorphContext | undefined): Gender | null {
  const words = context?.precedingWords ?? []
  for (let i = words.length - 1; i >= 0; i--) {
    const raw = words[i]?.trim().toLowerCase()
    if (!raw) continue
    if (INVARIABLE.has(raw)) continue
    if (raw in PRONOUNS) continue
    if (conjugate(raw)) continue // a verb governs, it does not agree
    return inferGender(raw)
  }
  return null
}

// ---- form builders ----------------------------------------------------------

function nounFormList(word: string, base: string): WordForm[] {
  const forms = declineNoun(word)
  if (!forms) return [{ value: base, hint: '' }]
  return [
    { value: forms.nom, hint: CASE_HINT.nom },
    { value: forms.acc, hint: CASE_HINT.acc },
    { value: forms.gen, hint: CASE_HINT.gen },
    { value: forms.dat, hint: CASE_HINT.dat },
    { value: forms.ins, hint: CASE_HINT.ins },
    { value: forms.loc, hint: CASE_HINT.loc },
    { value: forms.voc, hint: CASE_HINT.voc },
    { value: forms.pl, hint: CASE_HINT.pl },
  ]
}

function verbFormList(
  word: string,
  base: string,
  context: MorphContext | undefined,
): WordForm[] {
  const forms = conjugate(word)
  if (!forms) return [{ value: base, hint: '' }]

  // Past tense marks the SPEAKER's gender. Leading with the wrong one
  // misgenders the user in their own voice, so the profile decides which
  // comes first; with no preference set, both are offered and labelled.
  const past: WordForm[] =
    context?.grammaticalGender === 'feminine'
      ? [
          { value: forms.pastF, hint: 'wczoraj' },
          { value: forms.pastM, hint: 'wczoraj (rodzaj męski)' },
        ]
      : context?.grammaticalGender === 'masculine'
        ? [
            { value: forms.pastM, hint: 'wczoraj' },
            { value: forms.pastF, hint: 'wczoraj (rodzaj żeński)' },
          ]
        : [
            { value: forms.pastM, hint: 'wczoraj (on)' },
            { value: forms.pastF, hint: 'wczoraj (ona)' },
          ]

  return [
    { value: base, hint: '' },
    { value: forms.ja, hint: 'ja' },
    { value: forms.ty, hint: 'ty' },
    { value: forms.on, hint: 'on / ona' },
    { value: forms.my, hint: 'my' },
    { value: forms.oni, hint: 'oni' },
    ...past,
    ...(forms.perfective ? [{ value: forms.perfective, hint: 'dokonany' }] : []),
  ]
}

function adjectiveFormList(
  word: string,
  base: string,
  context: MorphContext | undefined,
): WordForm[] {
  const forms = adjectiveAgreement(base)
  if (!forms) return [{ value: base, hint: '' }]

  const all: Array<{ value: string; hint: string; key: keyof AdjectiveForms }> = [
    { value: forms.m, hint: 'rodzaj męski', key: 'm' },
    { value: forms.f, hint: 'rodzaj żeński', key: 'f' },
    { value: forms.n, hint: 'rodzaj nijaki', key: 'n' },
    { value: forms.mp, hint: 'męskoosobowy', key: 'mp' },
    { value: forms.nmp, hint: 'liczba mnoga', key: 'nmp' },
  ]

  // Same idea as Spanish: when a noun is already in the bar, the form that
  // agrees with it leads. Polish adds case on top, but case is GOVERNED
  // rather than agreed, so only gender and number are resolved here.
  const target = agreementGender(context)
  if (target) {
    const wanted: keyof AdjectiveForms = target === 'f' ? 'f' : target === 'n' ? 'n' : 'm'
    const match = all.find((f) => f.key === wanted)
    if (match) {
      return [
        { value: match.value, hint: 'zgadza się' },
        ...all.filter((f) => f.key !== wanted).map(({ value, hint }) => ({ value, hint })),
      ]
    }
  }
  return all.map(({ value, hint }) => ({ value, hint }))
}

function pronounFormList(word: string, base: string): WordForm[] {
  const alternatives = PRONOUNS[word]
  if (!alternatives) return [{ value: base, hint: '' }]
  return [
    { value: base, hint: '' },
    ...alternatives.map(([value, hint]) => ({ value, hint })),
  ]
}

/** Unknown part of speech — guess from the ending rather than offering nothing. */
function genericFormList(
  word: string,
  base: string,
  context: MorphContext | undefined,
): WordForm[] {
  if (conjugate(word)) return verbFormList(word, base, context)
  if (adjectiveAgreement(word)) return adjectiveFormList(word, base, context)
  return nounFormList(word, base)
}

/**
 * Polish counterpart of `wordForms`. Same contract as the other engines: the
 * base plus its inflections, and a length of 1 means there is nothing useful
 * to offer so the caller skips the popup.
 */
export function polishWordForms(
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
      forms = verbFormList(w, base, context)
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
