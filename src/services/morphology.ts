import type { PartOfSpeech } from '../constants/colors'
import { langCode } from '../i18n'
import { spanishWordForms } from './morphology.es'
import { polishWordForms } from './morphology.pl'
import type { MorphContext, WordForm } from './morphologyTypes'

// English word-forms / grammar (§Tier-1). Rule-based inflection plus an
// irregulars table, chosen by the word's part of speech (which every seeded
// button carries). Approximate — English is long-tailed — but covers the
// core vocabulary well. Pure + unit-tested.
//
// `wordForms` at the bottom of this file is the language dispatcher: English
// is handled here, Spanish in `morphology.es.ts`. They are separate engines
// rather than one parameterised one because Spanish inflects for person and
// agrees for gender — see the header of that file.

export type { MorphContext, WordForm }

// ---- regular spelling rules -------------------------------------------------

// -s (plural nouns / 3rd-person verbs)
function addS(w: string): string {
  if (/(s|x|z|ch|sh)$/.test(w)) return `${w}es`
  if (/[^aeiou]o$/.test(w)) return `${w}es` // go→goes, potato→potatoes
  if (/[^aeiou]y$/.test(w)) return `${w.slice(0, -1)}ies` // try→tries
  return `${w}s`
}

// approximate consonant-vowel-consonant test for final-consonant doubling
function isCVC(w: string): boolean {
  return w.length >= 3 && /[^aeiou][aeiou][^aeiouwxy]$/.test(w)
}

function addIng(w: string): string {
  if (/ie$/.test(w)) return `${w.slice(0, -2)}ying` // die→dying
  if (/[^aeiou]e$/.test(w)) return `${w.slice(0, -1)}ing` // make→making
  if (isCVC(w)) return `${w}${w.slice(-1)}ing` // run→running
  return `${w}ing`
}

function addEd(w: string): string {
  if (/e$/.test(w)) return `${w}d` // like→liked
  if (/[^aeiou]y$/.test(w)) return `${w.slice(0, -1)}ied` // try→tried
  if (isCVC(w)) return `${w}${w.slice(-1)}ed` // stop→stopped
  return `${w}ed`
}

function addEr(w: string, suffix: 'er' | 'est'): string {
  if (/e$/.test(w)) return `${w}${suffix === 'er' ? 'r' : 'st'}`
  if (/[^aeiou]y$/.test(w)) return `${w.slice(0, -1)}i${suffix}` // happy→happier
  if (isCVC(w)) return `${w}${w.slice(-1)}${suffix}` // big→bigger
  return `${w}${suffix}`
}

function possessive(w: string): string {
  return /s$/.test(w) ? `${w}'` : `${w}'s`
}

// ---- irregulars -------------------------------------------------------------

// base → [past, past participle]
const IRREGULAR_VERBS: Record<string, [string, string]> = {
  go: ['went', 'gone'], do: ['did', 'done'], eat: ['ate', 'eaten'],
  drink: ['drank', 'drunk'], see: ['saw', 'seen'], get: ['got', 'gotten'],
  give: ['gave', 'given'], make: ['made', 'made'], come: ['came', 'come'],
  take: ['took', 'taken'], run: ['ran', 'run'], sit: ['sat', 'sat'],
  say: ['said', 'said'], feel: ['felt', 'felt'], find: ['found', 'found'],
  know: ['knew', 'known'], think: ['thought', 'thought'], tell: ['told', 'told'],
  write: ['wrote', 'written'], read: ['read', 'read'], sing: ['sang', 'sung'],
  put: ['put', 'put'], have: ['had', 'had'], be: ['was', 'been'],
  leave: ['left', 'left'], bring: ['brought', 'brought'], buy: ['bought', 'bought'],
  sleep: ['slept', 'slept'], keep: ['kept', 'kept'], hold: ['held', 'held'],
  hear: ['heard', 'heard'], stand: ['stood', 'stood'], swim: ['swam', 'swum'],
  fly: ['flew', 'flown'], throw: ['threw', 'thrown'], wear: ['wore', 'worn'],
  win: ['won', 'won'], hurt: ['hurt', 'hurt'], cut: ['cut', 'cut'],
  let: ['let', 'let'], shut: ['shut', 'shut'], teach: ['taught', 'taught'],
  catch: ['caught', 'caught'],
}

const IRREGULAR_PLURALS: Record<string, string> = {
  child: 'children', person: 'people', man: 'men', woman: 'women',
  foot: 'feet', tooth: 'teeth', mouse: 'mice', goose: 'geese',
  fish: 'fish', sheep: 'sheep', deer: 'deer',
}

// base → [comparative, superlative]
const IRREGULAR_COMPARATIVE: Record<string, [string, string]> = {
  good: ['better', 'best'], bad: ['worse', 'worst'], far: ['farther', 'farthest'],
  little: ['less', 'least'], much: ['more', 'most'], many: ['more', 'most'],
}

// base → [object, possessive determiner, possessive pronoun]
const PRONOUNS: Record<string, string[]> = {
  i: ['me', 'my', 'mine'], you: ['your', 'yours'], he: ['him', 'his'],
  she: ['her', 'hers'], we: ['us', 'our', 'ours'], they: ['them', 'their', 'theirs'],
  it: ['its'],
}

// ---- form builders ----------------------------------------------------------

function verbForms(w: string, base: string): WordForm[] {
  const irr = IRREGULAR_VERBS[w]
  const forms: WordForm[] = [
    { value: base, hint: '' },
    { value: addS(w), hint: 'he/she' },
    { value: addIng(w), hint: 'now (-ing)' },
    { value: irr ? irr[0] : addEd(w), hint: 'past' },
  ]
  if (irr && irr[1] !== irr[0]) forms.push({ value: irr[1], hint: 'have done' })
  return forms
}

function nounForms(w: string, base: string): WordForm[] {
  return [
    { value: base, hint: '' },
    { value: IRREGULAR_PLURALS[w] ?? addS(w), hint: 'more than one' },
    { value: possessive(base), hint: "belongs to ('s)" },
  ]
}

function adjectiveForms(w: string, base: string): WordForm[] {
  const irr = IRREGULAR_COMPARATIVE[w]
  return [
    { value: base, hint: '' },
    { value: irr ? irr[0] : addEr(w, 'er'), hint: 'more' },
    { value: irr ? irr[1] : addEr(w, 'est'), hint: 'most' },
  ]
}

function pronounForms(w: string, base: string): WordForm[] {
  const alt = PRONOUNS[w]
  if (!alt) return [{ value: base, hint: '' }]
  const hints = ['object', 'belongs to', 'mine/yours']
  return [
    { value: base, hint: '' },
    ...alt.map((value, i) => ({ value, hint: hints[i] ?? '' })),
  ]
}

// Unknown part of speech (user-typed words) — offer the common endings.
function genericForms(w: string, base: string): WordForm[] {
  return [
    { value: base, hint: '' },
    { value: addS(w), hint: '-s' },
    { value: addIng(w), hint: '-ing' },
    { value: addEd(w), hint: '-ed' },
    { value: possessive(base), hint: "'s" },
  ]
}

// Returns the base plus its inflected forms; a length of 1 means there's
// nothing useful to offer (function words), so the caller can skip the popup.
export function englishWordForms(word: string, pos?: PartOfSpeech): WordForm[] {
  const base = word.trim()
  const w = base.toLowerCase()
  if (!w) return []
  let forms: WordForm[]
  switch (pos) {
    case 'verb':
      forms = verbForms(w, base)
      break
    case 'noun':
      forms = nounForms(w, base)
      break
    case 'descriptor':
      forms = adjectiveForms(w, base)
      break
    case 'pronoun':
      forms = pronounForms(w, base)
      break
    case 'little':
    case 'social':
      forms = [{ value: base, hint: '' }] // function words don't inflect
      break
    default:
      forms = genericForms(w, base)
  }
  // de-duplicate forms that collapse to the same string (e.g. put/put/put)
  const seen = new Set<string>()
  return forms.filter((f) => (seen.has(f.value) ? false : seen.add(f.value)))
}

/**
 * Word forms for the active language. `language` is a BCP-47 tag (the value
 * on `UserProfile.language`); anything unrecognised falls back to English so
 * a profile from a future version still opens.
 *
 * `context` carries what is already in the message bar. English ignores it;
 * Spanish uses it to agree an adjective with the noun it follows.
 */
export function wordForms(
  word: string,
  pos?: PartOfSpeech,
  language?: string,
  context?: MorphContext,
): WordForm[] {
  switch (langCode(language)) {
    case 'es':
      return spanishWordForms(word, pos, context)
    case 'pl':
      return polishWordForms(word, pos, context)
    default:
      return englishWordForms(word, pos)
  }
}
