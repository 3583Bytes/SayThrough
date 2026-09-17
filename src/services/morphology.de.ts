import type { PartOfSpeech } from '../constants/colors'
import type { MorphContext, WordForm } from './morphologyTypes'

// German word forms (§19.7). The first engine here that is NOT a port: Spanish,
// Italian and Portuguese share a shape, Polish shares case machinery, and
// German needs decisions none of them did.
//
//  - SEPARABLE VERBS were the open design question. `aufstehen` puts its prefix
//    at the end of the clause — *ich stehe um sieben Uhr **auf*** — which a
//    tap-a-word-at-a-time message bar cannot produce, because the prefix's
//    position depends on the whole clause rather than the adjacent word. The
//    resolution is to lean on the construction German already prefers for
//    exactly these meanings: MODAL + INFINITIVE. `ich will aufstehen` is
//    complete, correct German with the verb intact, and wanting/needing is core
//    AAC vocabulary anyway, so `will`, `kann`, `muss` and `möchte` sit in the
//    persistent core. The conjugated chunk (`stehe auf`) is still offered for
//    simple present, as ONE token — the unit a speaker means, in the same way
//    Italian puts `mi piace` on one button. What is deliberately NOT attempted
//    is clause-final placement; that would break the moment anyone edits the
//    middle of a message.
//  - FOUR CASES, but on the ARTICLE. Unlike Polish, the German noun barely
//    moves — it is `der/den/dem/des` that carries the case. So the noun popup
//    offers article+noun pairs, which is what a speaker actually needs.
//  - ADJECTIVES ARE UNINFLECTED PREDICATIVELY. `der Mann ist gut`, `die Frau
//    ist gut` — no ending. That makes the base form always safe after `ist`,
//    and it leads the popup for that reason; the attributive endings follow.
//  - PLURALS ARE NOT PREDICTABLE. Five patterns and umlaut, with no rule that
//    decides. Suffix heuristics cover the regular tail; board vocabulary that
//    breaks them is tabled.
//  - CONTRACTIONS live in `contractions.ts`. German's are strongly preferred
//    rather than strictly obligatory the way Italian's are — `in dem Haus` is
//    grammatical where `a il parco` is not — but `im Haus` is what anyone
//    actually says, so the board should produce it.
//
// Pure + unit-tested.

type Gender = 'm' | 'f' | 'n'

/** Case names by the question word a German learner is taught. */
const CASE_HINT = {
  nom: '', // wer? was? — the citation form
  akk: 'wen? was?',
  dat: 'wem?',
  gen: 'wessen?',
} as const

// ---- gender -----------------------------------------------------------------

// Suffixes that decide gender outright. These are reliable enough to lead, and
// they cover most of what a board adds later.
const SUFFIX_GENDER: Array<[RegExp, Gender]> = [
  [/(ung|heit|keit|schaft|ion|tät|ik|ei|enz|anz|ur|üre)$/, 'f'],
  [/(chen|lein|ment|um|tum)$/, 'n'],
  [/(ling|ismus|ant|ist|or|är)$/, 'm'],
]

// Everything a rule cannot reach. Board vocabulary lives here on purpose: a
// wrong gender means a wrong article on every single use, which is worse than
// a missing form.
const GENDER: Record<string, Gender> = {
  mann: 'm', vater: 'm', bruder: 'm', sohn: 'm', opa: 'm', onkel: 'm',
  junge: 'm', freund: 'm', arzt: 'm', lehrer: 'm', hund: 'm', tisch: 'm',
  stuhl: 'm', ball: 'm', tag: 'm', morgen: 'm', abend: 'm', kopf: 'm',
  arm: 'm', bauch: 'm', fuß: 'm', mund: 'm', saft: 'm', tee: 'm',
  kaffee: 'm', käse: 'm', apfel: 'm', keks: 'm', löffel: 'm', teller: 'm',
  park: 'm', laden: 'm', bus: 'm', zug: 'm', film: 'm', schuh: 'm',
  pullover: 'm', mantel: 'm', hut: 'm', regen: 'm', schnee: 'm', wind: 'm',
  garten: 'm', schrank: 'm', computer: 'm', name: 'm', platz: 'm',
  frau: 'f', mutter: 'f', schwester: 'f', tochter: 'f', oma: 'f', tante: 'f',
  freundin: 'f', lehrerin: 'f', schule: 'f', tür: 'f', hand: 'f', nase: 'f',
  milch: 'f', banane: 'f', suppe: 'f', pizza: 'f', hose: 'f', jacke: 'f',
  katze: 'f', maus: 'f', kuh: 'f', sonne: 'f', wolke: 'f', straße: 'f',
  küche: 'f', tasche: 'f', uhr: 'f', woche: 'f', nacht: 'f', zeit: 'f',
  musik: 'f', puppe: 'f', schere: 'f', gabel: 'f', tasse: 'f', flasche: 'f',
  kind: 'n', baby: 'n', mädchen: 'n', haus: 'n', zimmer: 'n', bett: 'n',
  fenster: 'n', auge: 'n', ohr: 'n', bein: 'n', haar: 'n', wasser: 'n',
  brot: 'n', ei: 'n', eis: 'n', fleisch: 'n', obst: 'n', gemüse: 'n',
  buch: 'n', bild: 'n', spiel: 'n', auto: 'n', fahrrad: 'n', telefon: 'n',
  papier: 'n', hemd: 'n', kleid: 'n', pferd: 'n', schwein: 'n', schaf: 'n',
  wetter: 'n', jahr: 'n', essen: 'n', trinken: 'n', bad: 'n',
  // --- the rest of the board vocabulary, added when a coverage check showed
  // --- 108 of 215 board nouns were falling through to the masculine default.
  hunger: 'm', reis: 'm', durst: 'm', strohhalm: 'm', kakao: 'm', papa: 'm',
  strand: 'm', stift: 'm', rucksack: 'm', kleber: 'm', zahn: 'm', rücken: 'm',
  mittag: 'm', monat: 'm', geburtstag: 'm', fisch: 'm', joghurt: 'm',
  eiswürfel: 'm', smoothie: 'm', sprudel: 'm', becher: 'm', apfelsaft: 'm',
  orangensaft: 'm', fernseher: 'm', sand: 'm', ballon: 'm', spielplatz: 'm',
  zoo: 'm', ausflug: 'm', finger: 'm', hals: 'm', vogel: 'm', hase: 'm',
  löwe: 'm', affe: 'm', rock: 'm', schlafanzug: 'm', schal: 'm', stiefel: 'm',
  knopf: 'm', reißverschluss: 'm', badeanzug: 'm', kamm: 'm', kühlschrank: 'm',
  regenbogen: 'm', nebel: 'm', regenschirm: 'm', himmel: 'm', 
  limo: 'f', schaukel: 'f', mama: 'f', familie: 'f', klasse: 'f', pause: 'f',
  mensa: 'f', tafel: 'f', turnhalle: 'f', hilfe: 'f', angst: 'f', minute: 'f',
  stunde: 'f', trinkflasche: 'f', rutsche: 'f', knete: 'f', schulter: 'f',
  haut: 'f', biene: 'f', spinne: 'f', schlange: 'f', ente: 'f', mütze: 'f',
  brille: 'f', windel: 'f', dusche: 'f', seife: 'f', zahnbürste: 'f',
  decke: 'f', treppe: 'f',
  glas: 'n', puzzle: 'n', verstecken: 'n', krankenhaus: 'n', heft: 'n',
  wochenende: 'n', tablet: 'n', lied: 'n', schwimmbad: 'n', kino: 'n',
  lineal: 'n', knie: 'n', gesicht: 'n', huhn: 'n', sofa: 'n', licht: 'n',
  handtuch: 'n', kissen: 'n', messer: 'n', gewitter: 'n',
  // Plural-only board words take the gender of their singular, which is what
  // the article popup needs when someone reaches for `die Nudeln`.
  nudeln: 'f', seifenblasen: 'f', hausaufgaben: 'f', pommes: 'f',
  schmerzen: 'm', bausteine: 'm', buchstaben: 'm', zahlen: 'f',
  socken: 'f', handschuhe: 'm',
}

export function inferGender(noun: string): Gender {
  const w = noun.trim().toLowerCase()
  const exact = GENDER[w]
  if (exact) return exact
  for (const [pattern, gender] of SUFFIX_GENDER) {
    if (pattern.test(w)) return gender
  }
  // No signal at all. Masculine is the most common single outcome, so it is
  // the least-wrong default — but the table above is how this gets fixed.
  return 'm'
}

// ---- plurals ----------------------------------------------------------------

const UMLAUT: Array<[RegExp, string]> = [
  [/au/, 'äu'],
  [/a/, 'ä'],
  [/o/, 'ö'],
  [/u/, 'ü'],
]

/** Umlaut the LAST stem vowel, which is the one German raises. */
function umlaut(word: string): string {
  for (const [from, to] of UMLAUT) {
    const matches = [...word.matchAll(new RegExp(from, 'g'))]
    const last = matches.at(-1)
    if (last?.index !== undefined) {
      return word.slice(0, last.index) + to + word.slice(last.index + last[0].length)
    }
  }
  return word
}

// German plural has five patterns and umlaut, and nothing in the word decides
// which. Everything the heuristics below get wrong lives here.
const PLURAL: Record<string, string> = {
  mann: 'Männer', kind: 'Kinder', haus: 'Häuser', buch: 'Bücher',
  bild: 'Bilder', ei: 'Eier', glas: 'Gläser', land: 'Länder',
  wort: 'Wörter', mund: 'Münder', rad: 'Räder', blatt: 'Blätter',
  vater: 'Väter', mutter: 'Mütter', bruder: 'Brüder', tochter: 'Töchter',
  apfel: 'Äpfel', garten: 'Gärten', mantel: 'Mäntel', vogel: 'Vögel',
  hand: 'Hände', stadt: 'Städte', nacht: 'Nächte', maus: 'Mäuse',
  kuh: 'Kühe', fuß: 'Füße', zahn: 'Zähne', stuhl: 'Stühle',
  ball: 'Bälle', zug: 'Züge', hut: 'Hüte', arzt: 'Ärzte',
  schrank: 'Schränke', platz: 'Plätze', saft: 'Säfte',
  bus: 'Busse', keks: 'Kekse', schaf: 'Schafe', pferd: 'Pferde',
  knie: 'Knie', bein: 'Beine', haar: 'Haare', jahr: 'Jahre', spiel: 'Spiele',
  brot: 'Brote', tag: 'Tage', arm: 'Arme', schuh: 'Schuhe',
  auge: 'Augen', ohr: 'Ohren', bett: 'Betten', hemd: 'Hemden',
  auto: 'Autos', baby: 'Babys', oma: 'Omas', opa: 'Opas',
  wasser: 'Wasser', essen: 'Essen', obst: 'Obst', gemüse: 'Gemüse',
  fleisch: 'Fleisch', milch: 'Milch', musik: 'Musik', zeit: 'Zeiten',
}

const capitalise = (w: string) => (w ? w[0].toUpperCase() + w.slice(1) : w)

/** Plural of a noun. German capitalises every noun, so the result does too. */
export function pluralize(noun: string): string {
  const w = noun.trim()
  if (!w) return w
  const lower = w.toLowerCase()

  const known = PLURAL[lower]
  if (known) return known

  // -in → -innen (Lehrerin → Lehrerinnen) before the feminine rule below.
  if (/in$/.test(lower) && lower.length > 3) return capitalise(`${lower}nen`)
  // Diminutives never change.
  if (/(chen|lein)$/.test(lower)) return capitalise(lower)
  // Loanwords in a bare final vowel take -s (Auto → Autos, Oma → Omas).
  // A diphthong is NOT a bare vowel: `Frau` ends in -au and takes -en, so the
  // pairs have to be excluded or every one of them gets an -s.
  if (/[aoiuy]$/.test(lower) && !/(au|eu|äu|ei|ai|ie)$/.test(lower)) {
    return capitalise(`${lower}s`)
  }

  const gender = inferGender(lower)
  if (gender === 'f') {
    // Feminines overwhelmingly take -(e)n.
    return capitalise(/e$/.test(lower) ? `${lower}n` : `${lower}en`)
  }
  // Masculine and neuter in -el/-en/-er do not change.
  if (/(el|en|er)$/.test(lower)) return capitalise(lower)
  return capitalise(`${lower}e`)
}

// ---- articles ---------------------------------------------------------------

type Case = keyof typeof CASE_HINT

const DEFINITE: Record<Gender | 'pl', Record<Case, string>> = {
  m: { nom: 'der', akk: 'den', dat: 'dem', gen: 'des' },
  f: { nom: 'die', akk: 'die', dat: 'der', gen: 'der' },
  n: { nom: 'das', akk: 'das', dat: 'dem', gen: 'des' },
  pl: { nom: 'die', akk: 'die', dat: 'den', gen: 'der' },
}

const INDEFINITE: Record<Gender, Record<Case, string>> = {
  m: { nom: 'ein', akk: 'einen', dat: 'einem', gen: 'eines' },
  f: { nom: 'eine', akk: 'eine', dat: 'einer', gen: 'einer' },
  n: { nom: 'ein', akk: 'ein', dat: 'einem', gen: 'eines' },
}

// ---- adjectives -------------------------------------------------------------

const IRREGULAR_COMPARATIVE: Record<string, [string, string]> = {
  gut: ['besser', 'am besten'],
  viel: ['mehr', 'am meisten'],
  gern: ['lieber', 'am liebsten'],
  hoch: ['höher', 'am höchsten'],
  nah: ['näher', 'am nächsten'],
  groß: ['größer', 'am größten'],
}

// Short adjectives that raise their vowel in the comparative. There is no rule,
// so the set is listed; everything else just takes -er.
const UMLAUT_COMPARATIVE = new Set([
  'alt', 'jung', 'lang', 'kurz', 'warm', 'kalt', 'stark', 'schwach',
  'hart', 'scharf', 'arm', 'klug', 'dumm', 'krank', 'gesund',
])

export interface AdjectiveForms {
  /** Predicative — no ending at all. `der Mann ist gut`. */
  base: string
  /** After a definite article (weak): `der gute Mann`. */
  weak: string
  /** After an indefinite article, masculine nominative (mixed): `ein guter`. */
  mixedM: string
  /** After an indefinite article, neuter nominative: `ein gutes`. */
  mixedN: string
  comparative: string
  superlative: string
}

export function adjectiveAgreement(base: string): AdjectiveForms {
  const w = base.trim().toLowerCase()
  const irregular = IRREGULAR_COMPARATIVE[w]
  // `dunkel` → `dunkler`, not `dunkeler`: an unstressed -e- drops before an
  // ending. Same for `teuer` → `teurer`.
  const stem = /e[lr]$/.test(w) ? w.replace(/e([lr])$/, '$1') : w
  const comparative =
    irregular?.[0] ?? (UMLAUT_COMPARATIVE.has(w) ? `${umlaut(stem)}er` : `${stem}er`)
  const superlative =
    irregular?.[1] ??
    (UMLAUT_COMPARATIVE.has(w)
      ? `am ${umlaut(w)}${/[dtsßzx]$/.test(w) ? 'esten' : 'sten'}`
      : `am ${w}${/[dtsßzx]$/.test(w) ? 'esten' : 'sten'}`)

  return {
    base: w,
    weak: `${stem}e`,
    mixedM: `${stem}er`,
    mixedN: `${stem}es`,
    comparative,
    superlative,
  }
}

// ---- verbs ------------------------------------------------------------------

export interface VerbForms {
  ich: string
  du: string
  /** `er`, `sie` and `es` share this form. */
  er: string
  wir: string
  ihr: string
  /** `sie` (plural) and the polite `Sie` share the infinitive form. */
  sie: string
  /** Partizip II — the form that pairs with haben/sein. */
  partizip: string
}

// Separable prefixes. `aufstehen` splits; `verstehen` does not, and the only
// way to tell is to know the prefix, so they are listed.
const SEPARABLE = [
  'auf', 'aus', 'an', 'ab', 'ein', 'mit', 'vor', 'zu', 'nach', 'weg',
  'hin', 'her', 'los', 'um', 'zurück', 'zusammen', 'fest', 'frei',
]

/** Splits a separable verb into its particle and the verb it is built on. */
export function splitSeparable(infinitive: string): { prefix: string; stem: string } | null {
  const v = infinitive.trim().toLowerCase()
  for (const prefix of SEPARABLE) {
    if (!v.startsWith(prefix)) continue
    const rest = v.slice(prefix.length)
    // `anziehen` splits; `anderer` is not a verb. Require a plausible verb.
    if (rest.length >= 4 && /en$/.test(rest)) return { prefix, stem: rest }
  }
  return null
}

// Strong verbs raise or change their stem vowel in `du` and `er`. The change is
// not predictable from the spelling, so the set is listed.
const STEM_CHANGE: Record<string, string> = {
  fahren: 'fähr', schlafen: 'schläf', tragen: 'träg', laufen: 'läuf',
  halten: 'hält', fallen: 'fäll', waschen: 'wäsch', fangen: 'fäng',
  geben: 'gib', nehmen: 'nimm', sehen: 'sieh', lesen: 'lies',
  essen: 'iss', sprechen: 'sprich', helfen: 'hilf', treffen: 'triff',
  werfen: 'wirf', vergessen: 'vergiss', brechen: 'brich',
}

const IRREGULAR_VERBS: Record<string, VerbForms> = {
  sein: { ich: 'bin', du: 'bist', er: 'ist', wir: 'sind', ihr: 'seid', sie: 'sind', partizip: 'gewesen' },
  haben: { ich: 'habe', du: 'hast', er: 'hat', wir: 'haben', ihr: 'habt', sie: 'haben', partizip: 'gehabt' },
  werden: { ich: 'werde', du: 'wirst', er: 'wird', wir: 'werden', ihr: 'werdet', sie: 'werden', partizip: 'geworden' },
  // Modals have no ending in ich/er — the shape that makes `ich kann` correct.
  können: { ich: 'kann', du: 'kannst', er: 'kann', wir: 'können', ihr: 'könnt', sie: 'können', partizip: 'gekonnt' },
  müssen: { ich: 'muss', du: 'musst', er: 'muss', wir: 'müssen', ihr: 'müsst', sie: 'müssen', partizip: 'gemusst' },
  wollen: { ich: 'will', du: 'willst', er: 'will', wir: 'wollen', ihr: 'wollt', sie: 'wollen', partizip: 'gewollt' },
  sollen: { ich: 'soll', du: 'sollst', er: 'soll', wir: 'sollen', ihr: 'sollt', sie: 'sollen', partizip: 'gesollt' },
  dürfen: { ich: 'darf', du: 'darfst', er: 'darf', wir: 'dürfen', ihr: 'dürft', sie: 'dürfen', partizip: 'gedurft' },
  mögen: { ich: 'mag', du: 'magst', er: 'mag', wir: 'mögen', ihr: 'mögt', sie: 'mögen', partizip: 'gemocht' },
  möchten: { ich: 'möchte', du: 'möchtest', er: 'möchte', wir: 'möchten', ihr: 'möchtet', sie: 'möchten', partizip: 'gemocht' },
  wissen: { ich: 'weiß', du: 'weißt', er: 'weiß', wir: 'wissen', ihr: 'wisst', sie: 'wissen', partizip: 'gewusst' },
  gehen: { ich: 'gehe', du: 'gehst', er: 'geht', wir: 'gehen', ihr: 'geht', sie: 'gehen', partizip: 'gegangen' },
  kommen: { ich: 'komme', du: 'kommst', er: 'kommt', wir: 'kommen', ihr: 'kommt', sie: 'kommen', partizip: 'gekommen' },
  tun: { ich: 'tue', du: 'tust', er: 'tut', wir: 'tun', ihr: 'tut', sie: 'tun', partizip: 'getan' },
  trinken: { ich: 'trinke', du: 'trinkst', er: 'trinkt', wir: 'trinken', ihr: 'trinkt', sie: 'trinken', partizip: 'getrunken' },
  schreiben: { ich: 'schreibe', du: 'schreibst', er: 'schreibt', wir: 'schreiben', ihr: 'schreibt', sie: 'schreiben', partizip: 'geschrieben' },
  singen: { ich: 'singe', du: 'singst', er: 'singt', wir: 'singen', ihr: 'singt', sie: 'singen', partizip: 'gesungen' },
  sitzen: { ich: 'sitze', du: 'sitzt', er: 'sitzt', wir: 'sitzen', ihr: 'sitzt', sie: 'sitzen', partizip: 'gesessen' },
  stehen: { ich: 'stehe', du: 'stehst', er: 'steht', wir: 'stehen', ihr: 'steht', sie: 'stehen', partizip: 'gestanden' },
  finden: { ich: 'finde', du: 'findest', er: 'findet', wir: 'finden', ihr: 'findet', sie: 'finden', partizip: 'gefunden' },
  bleiben: { ich: 'bleibe', du: 'bleibst', er: 'bleibt', wir: 'bleiben', ihr: 'bleibt', sie: 'bleiben', partizip: 'geblieben' },
}

/**
 * Present tense plus the participle.
 *
 * A separable verb comes back with its particle trailing — `stehe auf` — as ONE
 * string. See the header: clause-final placement is deliberately not attempted.
 */
export function conjugate(infinitive: string): VerbForms | null {
  const v = infinitive.trim().toLowerCase()
  const irregular = IRREGULAR_VERBS[v]
  if (irregular) return irregular

  const separable = splitSeparable(v)
  if (separable) {
    const inner = conjugate(separable.stem)
    if (!inner) return null
    const trail = (form: string) => `${form} ${separable.prefix}`
    return {
      ich: trail(inner.ich), du: trail(inner.du), er: trail(inner.er),
      wir: trail(inner.wir), ihr: trail(inner.ihr), sie: trail(inner.sie),
      // The participle re-joins around the ge-: aufgestanden, not geaufstanden.
      partizip: `${separable.prefix}${inner.partizip}`,
    }
  }

  if (!/e?n$/.test(v) || v.length < 4) return null
  const stem = v.replace(/e?n$/, '')
  if (!stem) return null

  // -den/-ten/-nen need a linking -e- so the ending is pronounceable.
  const link = /[dtmn]$/.test(stem) && !/[aeiou][mn]$/.test(stem) ? 'e' : ''
  // A stem already ending in s/ß/z/x takes only -t in `du`.
  const duEnding = /[sßzx]$/.test(stem) ? 't' : `${link}st`
  const changed = STEM_CHANGE[v]

  return {
    ich: `${stem}e`,
    du: `${changed ?? stem}${changed ? (/[sßzx]$/.test(changed) ? 't' : 'st') : duEnding}`,
    er: `${changed ?? stem}${link}t`,
    wir: v,
    ihr: `${stem}${link}t`,
    sie: v,
    partizip: `ge${stem}${link}t`,
  }
}

// ---- pronouns ---------------------------------------------------------------

const PRONOUNS: Record<string, Array<[string, string]>> = {
  ich: [['mich', CASE_HINT.akk], ['mir', CASE_HINT.dat], ['mein', 'wessen?']],
  du: [['dich', CASE_HINT.akk], ['dir', CASE_HINT.dat], ['dein', 'wessen?']],
  er: [['ihn', CASE_HINT.akk], ['ihm', CASE_HINT.dat], ['sein', 'wessen?']],
  sie: [['sie', CASE_HINT.akk], ['ihr', CASE_HINT.dat], ['ihr', 'wessen?']],
  es: [['es', CASE_HINT.akk], ['ihm', CASE_HINT.dat], ['sein', 'wessen?']],
  wir: [['uns', CASE_HINT.akk], ['uns', CASE_HINT.dat], ['unser', 'wessen?']],
  ihr: [['euch', CASE_HINT.akk], ['euch', CASE_HINT.dat], ['euer', 'wessen?']],
}

const INVARIABLE = new Set([
  'und', 'oder', 'aber', 'weil', 'dass', 'ja', 'nein', 'nicht', 'auch',
  'hier', 'da', 'dort', 'jetzt', 'dann', 'noch', 'schon', 'immer', 'nie',
  'heute', 'gestern', 'morgen', 'hallo', 'tschüss', 'danke', 'bitte',
  'wann', 'wo', 'wie', 'wer', 'was', 'warum', 'wieder', 'sehr', 'mehr',
  'in', 'an', 'auf', 'zu', 'bei', 'von', 'mit', 'für', 'um', 'aus',
])

// ---- context ----------------------------------------------------------------

/** The gender/number the next adjective or article should agree with. */
function agreementTarget(context: MorphContext | undefined): Gender | 'pl' | null {
  const words = context?.precedingWords ?? []
  for (let i = words.length - 1; i >= 0; i--) {
    const raw = words[i]?.trim().toLowerCase()
    if (!raw) continue
    if (INVARIABLE.has(raw)) continue
    // A noun in German is capitalised, which is a free signal the other
    // engines do not get.
    const original = words[i].trim()
    if (original[0] !== original[0]?.toUpperCase()) continue
    return inferGender(raw)
  }
  return null
}

// ---- form builders ----------------------------------------------------------

function verbFormList(word: string, base: string): WordForm[] {
  const forms = conjugate(word)
  if (!forms) return [{ value: base, hint: '' }]
  return [
    // The infinitive leads because it is what follows a modal, and `ich will
    // aufstehen` is the construction this board is built around.
    { value: base, hint: 'nach will / kann / muss' },
    { value: forms.ich, hint: 'ich' },
    { value: forms.du, hint: 'du' },
    { value: forms.er, hint: 'er / sie / es' },
    { value: forms.wir, hint: 'wir' },
    { value: forms.ihr, hint: 'ihr' },
    { value: forms.partizip, hint: 'gemacht' },
  ]
}

function nounFormList(word: string, base: string): WordForm[] {
  const gender = inferGender(word)
  const noun = capitalise(base)
  const plural = pluralize(base)
  const article = DEFINITE[gender]
  return [
    { value: noun, hint: '' },
    { value: `${article.nom} ${noun}`, hint: CASE_HINT.nom || 'wer? was?' },
    { value: `${article.akk} ${noun}`, hint: CASE_HINT.akk },
    { value: `${article.dat} ${noun}`, hint: CASE_HINT.dat },
    { value: `${INDEFINITE[gender].nom} ${noun}`, hint: 'ein / eine' },
    { value: plural, hint: 'mehr als eins' },
    { value: `${DEFINITE.pl.nom} ${plural}`, hint: 'die …' },
  ]
}

function adjectiveFormList(
  word: string,
  base: string,
  context: MorphContext | undefined,
): WordForm[] {
  const forms = adjectiveAgreement(base)
  const target = agreementTarget(context)

  // Predicative first: it takes no ending at all, so it is always safe after
  // `ist`, which is how most of these actually get used on a board.
  const list: WordForm[] = [{ value: forms.base, hint: 'nach ist' }]

  if (target === 'f' || target === 'pl') {
    list.push({ value: forms.weak, hint: 'passt dazu' })
  } else if (target === 'n') {
    list.push({ value: forms.mixedN, hint: 'passt dazu' })
  } else if (target === 'm') {
    list.push({ value: forms.mixedM, hint: 'passt dazu' })
  }

  list.push(
    { value: forms.weak, hint: 'der / die / das …' },
    { value: forms.mixedM, hint: 'ein …' },
    { value: forms.comparative, hint: 'mehr' },
    { value: forms.superlative, hint: 'am meisten' },
  )
  return list
}

function pronounFormList(word: string, base: string): WordForm[] {
  const alternatives = PRONOUNS[word]
  if (!alternatives) return [{ value: base, hint: '' }]
  return [{ value: base, hint: '' }, ...alternatives.map(([value, hint]) => ({ value, hint }))]
}

function genericFormList(
  word: string,
  base: string,
  context: MorphContext | undefined,
): WordForm[] {
  if (/e?n$/.test(word) && word.length > 3 && conjugate(word)) {
    return verbFormList(word, base)
  }
  // Capitalised means noun in German — a signal no other engine here gets.
  if (base[0] === base[0]?.toUpperCase() && base !== base.toLowerCase()) {
    return nounFormList(word, base)
  }
  return adjectiveFormList(word, base, context)
}

/** German counterpart of `wordForms`. Same contract as the other engines. */
export function germanWordForms(
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
