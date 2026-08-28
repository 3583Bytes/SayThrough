import type { PartOfSpeech } from '../constants/colors'
import type { MorphContext, WordForm } from './morphologyTypes'

// Spanish word forms (§19.7). Structurally different from the English engine
// in `morphology.ts`, and deliberately a separate module rather than a set of
// branches inside it:
//
//  - Spanish is pro-drop, so PERSON lives on the verb. "quiero" is a complete
//    sentence; "querer" alone is not. A Spanish board therefore has to offer
//    the person forms of a verb, not just tense — that is the single biggest
//    difference from the English list.
//  - Adjectives and determiners AGREE in gender and number with their noun.
//    A form is only correct relative to another word, so this module takes a
//    `MorphContext` (what is already in the message bar) and puts the
//    agreeing form first. English never needs that.
//
// Pure + unit-tested. Approximate at the long tail, like the English engine —
// it targets the core vocabulary the bundled boards actually ship.

type Gender = 'm' | 'f'
type Number_ = 'sg' | 'pl'

// ---- orthography helpers ----------------------------------------------------

const VOWELS = 'aeiouáéíóú'
const ACCENTED: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }

function stripAccents(w: string): string {
  return w.replace(/[áéíóú]/g, (c) => ACCENTED[c] ?? c)
}

function lastChar(w: string): string {
  return w.slice(-1)
}

/**
 * Plural of a noun or adjective. Handles the four rules that cover almost all
 * of the core vocabulary: vowel +s, consonant +es, -z → -ces, and the accent
 * that disappears when -ión gains a syllable (canción → canciones).
 */
export function pluralize(word: string): string {
  const w = word
  if (!w) return w
  const last = lastChar(w)

  // -z → -ces (lápiz → lápices, feliz → felices)
  if (last === 'z') return `${w.slice(0, -1)}ces`

  // Unstressed final syllable ending in -s or -x is invariable
  // (el lunes → los lunes, el tórax → los tórax)
  if ((last === 's' || last === 'x') && w.length > 2 && !/[áéíóú].$/.test(w)) {
    return w
  }

  // -ión, -ón, -án, -és lose the written accent when a syllable is added
  if (/ión$/.test(w)) return `${w.slice(0, -3)}iones`
  if (/ón$/.test(w)) return `${w.slice(0, -2)}ones`
  if (/án$/.test(w)) return `${w.slice(0, -2)}anes`
  if (/és$/.test(w)) return `${w.slice(0, -2)}eses`

  // Stressed -í / -ú take -es in careful register (rubí → rubíes)
  if (/[íú]$/.test(w)) return `${w}es`

  // Any other vowel takes -s; a consonant takes -es
  if (VOWELS.includes(last)) return `${w}s`
  return `${w}es`
}

/** Does this surface form look plural? Used to agree with a noun already said. */
function looksPlural(word: string): boolean {
  const w = word.toLowerCase()
  if (w.length < 3) return false
  if (!/s$/.test(w)) return false
  // Invariable singulars ending in -s: the surface form is identical in both
  // numbers, so treating them as plural would mis-agree "el lunes pasado".
  if (/(lunes|martes|miércoles|jueves|viernes|crisis|análisis|paraguas)$/.test(w)) {
    return false
  }
  return true
}

// ---- gender -----------------------------------------------------------------

// Spanish gender is ~95% predictable from the ending; these are the everyday
// words where it is not. Words in the bundled boards come first.
const GENDER_EXCEPTIONS: Record<string, Gender> = {
  // -a but masculine (mostly Greek -ma, plus día/mapa/sofá)
  día: 'm', mapa: 'm', problema: 'm', sistema: 'm', tema: 'm', programa: 'm',
  idioma: 'm', clima: 'm', sofá: 'm', pijama: 'm', planeta: 'm', tranvía: 'm',
  // -o but feminine
  mano: 'f', foto: 'f', moto: 'f', radio: 'f',
  // consonant/-e endings that are feminine
  clase: 'f', gente: 'f', noche: 'f', tarde: 'f', llave: 'f', calle: 'f',
  carne: 'f', leche: 'f', nieve: 'f', sangre: 'f', nube: 'f', fuente: 'f',
  piel: 'f', sal: 'f', flor: 'f', luz: 'f', voz: 'f', vez: 'f', paz: 'f',
  nariz: 'f', imagen: 'f', sartén: 'f',
  // -e / consonant that are masculine and might read otherwise
  coche: 'm', parque: 'm', diente: 'm', puente: 'm', árbol: 'm', papel: 'm',
  lápiz: 'm', pez: 'm', arroz: 'm', pie: 'm', café: 'm', té: 'm',
  // takes `el` in the singular for phonetic reasons but is grammatically
  // feminine — adjectives still agree feminine (el agua fría)
  agua: 'f', águila: 'f', hambre: 'f', alma: 'f', aula: 'f',
}

/**
 * Grammatical gender of a noun. Rule-based with an exceptions table — the
 * same shape as the English engine's irregulars, and for the same reason.
 */
export function inferGender(noun: string): Gender {
  const w = stripAccents(noun.trim().toLowerCase())
  const exact = GENDER_EXCEPTIONS[noun.trim().toLowerCase()]
  if (exact) return exact
  const exactUnaccented = GENDER_EXCEPTIONS[w]
  if (exactUnaccented) return exactUnaccented

  if (/(cion|sion|dad|tad|tud|umbre|ez|itis|sis)$/.test(w)) return 'f'
  if (/a$/.test(w)) return 'f'
  if (/(o|or|aje|an|ambre|ete|il)$/.test(w)) return 'm'
  return 'm'
}

// ---- adjectives -------------------------------------------------------------

export interface AdjectiveForms {
  ms: string
  fs: string
  mp: string
  fp: string
}

/**
 * The four agreement forms of an adjective, from its masculine singular.
 * Adjectives in -e, -ista and most consonants do not mark gender, so several
 * of the four collapse to the same string; the caller de-duplicates.
 */
export function adjectiveAgreement(base: string): AdjectiveForms {
  const w = base.trim()
  const lower = w.toLowerCase()

  // -o → -o/-a/-os/-as (rojo, roja, rojos, rojas)
  if (/o$/.test(lower)) {
    const stem = w.slice(0, -1)
    return { ms: w, fs: `${stem}a`, mp: `${stem}os`, fp: `${stem}as` }
  }

  // -or / -ón / -án / -ín take -a in the feminine (trabajador → trabajadora),
  // EXCEPT the comparatives mejor/peor/mayor/menor, which are invariable
  if (/(or|ón|án|ín)$/.test(lower) && !/(mejor|peor|mayor|menor)$/.test(lower)) {
    const fem = /ón$/.test(lower)
      ? `${w.slice(0, -2)}ona`
      : /án$/.test(lower)
        ? `${w.slice(0, -2)}ana`
        : /ín$/.test(lower)
          ? `${w.slice(0, -2)}ina`
          : `${w}a`
    return { ms: w, fs: fem, mp: pluralize(w), fp: pluralize(fem) }
  }

  // -és → -esa (inglés → inglesa)
  if (/és$/.test(lower)) {
    const fem = `${w.slice(0, -2)}esa`
    return { ms: w, fs: fem, mp: pluralize(w), fp: pluralize(fem) }
  }

  // Everything else (-e, -ista, -z, consonants) marks number only
  const plural = pluralize(w)
  return { ms: w, fs: w, mp: plural, fp: plural }
}

// base → [comparative, superlative stem]
const IRREGULAR_COMPARATIVE: Record<string, string> = {
  bueno: 'mejor', buena: 'mejor',
  malo: 'peor', mala: 'peor',
  grande: 'mayor',
  pequeño: 'menor', pequeña: 'menor',
}

// ---- verbs ------------------------------------------------------------------

export interface VerbForms {
  yo: string
  tu: string
  el: string
  nosotros: string
  ellos: string
  pasado: string // pretérito, 1st person singular
  gerundio: string
}

// The high-frequency irregulars that appear in core vocabulary. Regular verbs
// are generated; these are listed because getting "soy"/"voy"/"tengo" wrong
// would be worse than offering nothing.
const IRREGULAR_VERBS: Record<string, VerbForms> = {
  ser: { yo: 'soy', tu: 'eres', el: 'es', nosotros: 'somos', ellos: 'son', pasado: 'fui', gerundio: 'siendo' },
  estar: { yo: 'estoy', tu: 'estás', el: 'está', nosotros: 'estamos', ellos: 'están', pasado: 'estuve', gerundio: 'estando' },
  ir: { yo: 'voy', tu: 'vas', el: 'va', nosotros: 'vamos', ellos: 'van', pasado: 'fui', gerundio: 'yendo' },
  tener: { yo: 'tengo', tu: 'tienes', el: 'tiene', nosotros: 'tenemos', ellos: 'tienen', pasado: 'tuve', gerundio: 'teniendo' },
  hacer: { yo: 'hago', tu: 'haces', el: 'hace', nosotros: 'hacemos', ellos: 'hacen', pasado: 'hice', gerundio: 'haciendo' },
  poder: { yo: 'puedo', tu: 'puedes', el: 'puede', nosotros: 'podemos', ellos: 'pueden', pasado: 'pude', gerundio: 'pudiendo' },
  querer: { yo: 'quiero', tu: 'quieres', el: 'quiere', nosotros: 'queremos', ellos: 'quieren', pasado: 'quise', gerundio: 'queriendo' },
  ver: { yo: 'veo', tu: 'ves', el: 've', nosotros: 'vemos', ellos: 'ven', pasado: 'vi', gerundio: 'viendo' },
  dar: { yo: 'doy', tu: 'das', el: 'da', nosotros: 'damos', ellos: 'dan', pasado: 'di', gerundio: 'dando' },
  decir: { yo: 'digo', tu: 'dices', el: 'dice', nosotros: 'decimos', ellos: 'dicen', pasado: 'dije', gerundio: 'diciendo' },
  venir: { yo: 'vengo', tu: 'vienes', el: 'viene', nosotros: 'venimos', ellos: 'vienen', pasado: 'vine', gerundio: 'viniendo' },
  poner: { yo: 'pongo', tu: 'pones', el: 'pone', nosotros: 'ponemos', ellos: 'ponen', pasado: 'puse', gerundio: 'poniendo' },
  saber: { yo: 'sé', tu: 'sabes', el: 'sabe', nosotros: 'sabemos', ellos: 'saben', pasado: 'supe', gerundio: 'sabiendo' },
  salir: { yo: 'salgo', tu: 'sales', el: 'sale', nosotros: 'salimos', ellos: 'salen', pasado: 'salí', gerundio: 'saliendo' },
  jugar: { yo: 'juego', tu: 'juegas', el: 'juega', nosotros: 'jugamos', ellos: 'juegan', pasado: 'jugué', gerundio: 'jugando' },
  dormir: { yo: 'duermo', tu: 'duermes', el: 'duerme', nosotros: 'dormimos', ellos: 'duermen', pasado: 'dormí', gerundio: 'durmiendo' },
  pedir: { yo: 'pido', tu: 'pides', el: 'pide', nosotros: 'pedimos', ellos: 'piden', pasado: 'pedí', gerundio: 'pidiendo' },
  sentir: { yo: 'siento', tu: 'sientes', el: 'siente', nosotros: 'sentimos', ellos: 'sienten', pasado: 'sentí', gerundio: 'sintiendo' },
  pensar: { yo: 'pienso', tu: 'piensas', el: 'piensa', nosotros: 'pensamos', ellos: 'piensan', pasado: 'pensé', gerundio: 'pensando' },
  empezar: { yo: 'empiezo', tu: 'empiezas', el: 'empieza', nosotros: 'empezamos', ellos: 'empiezan', pasado: 'empecé', gerundio: 'empezando' },
  volver: { yo: 'vuelvo', tu: 'vuelves', el: 'vuelve', nosotros: 'volvemos', ellos: 'vuelven', pasado: 'volví', gerundio: 'volviendo' },
  encontrar: { yo: 'encuentro', tu: 'encuentras', el: 'encuentra', nosotros: 'encontramos', ellos: 'encuentran', pasado: 'encontré', gerundio: 'encontrando' },
  contar: { yo: 'cuento', tu: 'cuentas', el: 'cuenta', nosotros: 'contamos', ellos: 'cuentan', pasado: 'conté', gerundio: 'contando' },
  cerrar: { yo: 'cierro', tu: 'cierras', el: 'cierra', nosotros: 'cerramos', ellos: 'cierran', pasado: 'cerré', gerundio: 'cerrando' },
  oír: { yo: 'oigo', tu: 'oyes', el: 'oye', nosotros: 'oímos', ellos: 'oyen', pasado: 'oí', gerundio: 'oyendo' },
  traer: { yo: 'traigo', tu: 'traes', el: 'trae', nosotros: 'traemos', ellos: 'traen', pasado: 'traje', gerundio: 'trayendo' },
  leer: { yo: 'leo', tu: 'lees', el: 'lee', nosotros: 'leemos', ellos: 'leen', pasado: 'leí', gerundio: 'leyendo' },
  // `gustar` is used almost exclusively in the 3rd person ("me gusta")
  gustar: { yo: 'gusto', tu: 'gustas', el: 'gusta', nosotros: 'gustamos', ellos: 'gustan', pasado: 'gustó', gerundio: 'gustando' },
  haber: { yo: 'he', tu: 'has', el: 'hay', nosotros: 'hemos', ellos: 'han', pasado: 'hubo', gerundio: 'habiendo' },
}

/** Regular conjugation for the -ar / -er / -ir classes. */
export function conjugate(infinitive: string): VerbForms | null {
  const v = infinitive.trim().toLowerCase()
  const irregular = IRREGULAR_VERBS[v]
  if (irregular) return irregular

  const stem = v.slice(0, -2)
  const ending = v.slice(-2)
  if (!stem) return null

  switch (ending) {
    case 'ar':
      return {
        yo: `${stem}o`, tu: `${stem}as`, el: `${stem}a`,
        nosotros: `${stem}amos`, ellos: `${stem}an`,
        pasado: `${stem}é`, gerundio: `${stem}ando`,
      }
    case 'er':
      return {
        yo: `${stem}o`, tu: `${stem}es`, el: `${stem}e`,
        nosotros: `${stem}emos`, ellos: `${stem}en`,
        pasado: `${stem}í`, gerundio: `${stem}iendo`,
      }
    case 'ir':
      return {
        yo: `${stem}o`, tu: `${stem}es`, el: `${stem}e`,
        nosotros: `${stem}imos`, ellos: `${stem}en`,
        pasado: `${stem}í`, gerundio: `${stem}iendo`,
      }
    default:
      return null // not an infinitive — a board word like "más"
  }
}

// ---- pronouns and determiners ------------------------------------------------

// subject → [object, prepositional, possessive determiner, possessive pronoun]
const PRONOUNS: Record<string, Array<[string, string]>> = {
  yo: [['me', 'a mí'], ['mí', 'después de preposición'], ['mi', 'mi cosa'], ['mío', 'es mío']],
  tú: [['te', 'a ti'], ['ti', 'después de preposición'], ['tu', 'tu cosa'], ['tuyo', 'es tuyo']],
  él: [['lo', 'a él'], ['le', 'le doy'], ['su', 'su cosa'], ['suyo', 'es suyo']],
  ella: [['la', 'a ella'], ['le', 'le doy'], ['su', 'su cosa'], ['suya', 'es suya']],
  nosotros: [['nos', 'a nosotros'], ['nuestro', 'nuestra cosa'], ['nuestros', 'plural']],
  ellos: [['los', 'a ellos'], ['les', 'les doy'], ['su', 'su cosa'], ['suyos', 'son suyos']],
  ellas: [['las', 'a ellas'], ['les', 'les doy'], ['su', 'su cosa'], ['suyas', 'son suyas']],
  usted: [['le', 'a usted'], ['su', 'su cosa'], ['suyo', 'es suyo']],
}

// Determiners inflect for gender and number, so they get the same four-form
// treatment as adjectives even though English treats them as function words.
const DETERMINERS: Record<string, AdjectiveForms> = {
  el: { ms: 'el', fs: 'la', mp: 'los', fp: 'las' },
  la: { ms: 'el', fs: 'la', mp: 'los', fp: 'las' },
  un: { ms: 'un', fs: 'una', mp: 'unos', fp: 'unas' },
  una: { ms: 'un', fs: 'una', mp: 'unos', fp: 'unas' },
  este: { ms: 'este', fs: 'esta', mp: 'estos', fp: 'estas' },
  esta: { ms: 'este', fs: 'esta', mp: 'estos', fp: 'estas' },
  ese: { ms: 'ese', fs: 'esa', mp: 'esos', fp: 'esas' },
  otro: { ms: 'otro', fs: 'otra', mp: 'otros', fp: 'otras' },
  mucho: { ms: 'mucho', fs: 'mucha', mp: 'muchos', fp: 'muchas' },
  poco: { ms: 'poco', fs: 'poca', mp: 'pocos', fp: 'pocas' },
  todo: { ms: 'todo', fs: 'toda', mp: 'todos', fp: 'todas' },
  mi: { ms: 'mi', fs: 'mi', mp: 'mis', fp: 'mis' },
  tu: { ms: 'tu', fs: 'tu', mp: 'tus', fp: 'tus' },
  su: { ms: 'su', fs: 'su', mp: 'sus', fp: 'sus' },
}

// Function words that carry no inflection and should never open the modal.
const INVARIABLE = new Set([
  'y', 'o', 'pero', 'porque', 'que', 'de', 'a', 'en', 'con', 'sin', 'por',
  'para', 'sí', 'no', 'más', 'menos', 'muy', 'también', 'tampoco', 'aquí',
  'allí', 'ahora', 'luego', 'siempre', 'nunca', 'hoy', 'ayer', 'mañana',
  'hola', 'adiós', 'gracias', 'cuándo', 'dónde', 'cómo', 'qué', 'quién',
  'cuánto', 'por favor',
])

// ---- context: what is already in the message bar ----------------------------

/**
 * Gender and number of the noun an adjective should agree with — the last
 * content word in the bar. Returns null when there is nothing to agree with,
 * in which case the caller offers the forms in their citation order.
 */
function agreementTarget(
  context: MorphContext | undefined,
): { gender: Gender; number: Number_ } | null {
  const words = context?.precedingWords ?? []
  for (let i = words.length - 1; i >= 0; i--) {
    const raw = words[i]?.trim().toLowerCase()
    if (!raw) continue
    if (INVARIABLE.has(raw)) continue
    if (raw in DETERMINERS) continue // a determiner agrees, it does not govern
    const number: Number_ = looksPlural(raw) ? 'pl' : 'sg'
    // Infer from the singular so "casas" is still read as feminine
    const singular = number === 'pl' ? raw.replace(/e?s$/, '') : raw
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
    { value: forms.yo, hint: 'yo' },
    { value: forms.tu, hint: 'tú' },
    { value: forms.el, hint: 'él / ella' },
    { value: forms.nosotros, hint: 'nosotros' },
    { value: forms.ellos, hint: 'ellos' },
    { value: forms.pasado, hint: 'pasado' },
    { value: forms.gerundio, hint: 'ahora' },
  ]
}

function nounFormList(word: string, base: string): WordForm[] {
  const gender = inferGender(word)
  return [
    { value: base, hint: '' },
    { value: pluralize(base), hint: 'más de uno' },
    // Spanish has no possessive 's — possession is `de` + noun
    { value: `de ${base}`, hint: 'de quién' },
    { value: `${gender === 'f' ? 'la' : 'el'} ${base}`, hint: 'con artículo' },
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
    { value: agreement.ms, hint: 'masculino', key: 'ms' },
    { value: agreement.fs, hint: 'femenino', key: 'fs' },
    { value: agreement.mp, hint: 'masculino plural', key: 'mp' },
    { value: agreement.fp, hint: 'femenino plural', key: 'fp' },
  ]

  // Agreement is the whole point: when the bar already has a noun, the form
  // that matches it leads and says so. Without a noun the citation form leads.
  let ordered = all
  if (target) {
    const wanted: keyof AdjectiveForms =
      target.number === 'pl'
        ? target.gender === 'f' ? 'fp' : 'mp'
        : target.gender === 'f' ? 'fs' : 'ms'
    const match = all.find((f) => f.key === wanted)
    if (match) {
      ordered = [
        { ...match, hint: 'concuerda' },
        ...all.filter((f) => f.key !== wanted),
      ]
    }
  }

  const comparative = IRREGULAR_COMPARATIVE[word] ?? `más ${base}`
  return [
    ...ordered.map(({ value, hint }) => ({ value, hint })),
    { value: comparative, hint: 'más' },
  ]
}

function pronounFormList(word: string, base: string): WordForm[] {
  const alternatives = PRONOUNS[word]
  if (!alternatives) return [{ value: base, hint: '' }]
  return [
    { value: base, hint: '' },
    ...alternatives.map(([value, hint]) => ({ value, hint })),
  ]
}

function determinerFormList(word: string, base: string): WordForm[] {
  const forms = DETERMINERS[word]
  if (!forms) return [{ value: base, hint: '' }]
  return [
    { value: forms.ms, hint: 'masculino' },
    { value: forms.fs, hint: 'femenino' },
    { value: forms.mp, hint: 'masculino plural' },
    { value: forms.fp, hint: 'femenino plural' },
  ]
}

/**
 * Unknown part of speech — a word the user typed. Guess from the ending
 * rather than offering nothing: an infinitive conjugates, an -o/-a word
 * agrees, everything else pluralises.
 */
function genericFormList(
  word: string,
  base: string,
  context: MorphContext | undefined,
): WordForm[] {
  if (/(ar|er|ir)$/.test(word) && word.length > 3 && conjugate(word)) {
    return verbFormList(word, base)
  }
  if (/(o|a)$/.test(word)) return adjectiveFormList(word, base, context)
  return [
    { value: base, hint: '' },
    { value: pluralize(base), hint: 'más de uno' },
  ]
}

/**
 * Spanish counterpart of `wordForms`. Returns the base plus its inflections;
 * a length of 1 means there is nothing useful to offer, so the caller skips
 * the popup — the same contract the English engine has.
 */
export function spanishWordForms(
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
      // Articles and demonstratives DO inflect in Spanish, unlike the English
      // function words this category holds. Prepositions fall through to the
      // single-form result via the DETERMINERS lookup miss.
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
