import type { PartOfSpeech } from '../constants/colors'
import type { MorphContext, WordForm } from './morphologyTypes'

// Brazilian Portuguese word forms (§19.7). Structurally the closest engine to
// Spanish — two copulas, gender/number agreement, person on the verb — so this
// file deliberately mirrors `morphology.es.ts`. What differs:
//
//  - NASAL PLURALS. `-ão` splits three ways with no rule that predicts it:
//    pão→pães, mão→mãos, coração→corações. A table decides; the majority
//    pattern (-ões) is the fallback.
//  - CONSONANT-FINAL PLURALS. -l → -is (papel→papéis), -m → -ns
//    (homem→homens). Spanish has neither.
//  - FEWER PERSON FORMS. Brazilian Portuguese uses `você` with the third
//    person, and `vocês` for the plural, so the paradigm a board needs is
//    eu / você-ele / nós / vocês-eles — four, not Spanish's five. That is a
//    real simplification, not a shortcut.
//  - CONTRACTIONS live in `contractions.ts`, not here: `de + o = do` fuses two
//    TOKENS rather than inflecting one word, so it belongs to the message bar.
//
// Pure + unit-tested.

type Gender = 'm' | 'f'

const VOWELS = 'aeiouáéíóúâêôãõà'

// ---- plurals ----------------------------------------------------------------

// -ão is the one ending Portuguese gives no rule for. These are the board
// words that do NOT take the majority -ões.
const AO_PLURAL: Record<string, string> = {
  pão: 'pães', cão: 'cães', alemão: 'alemães', capitão: 'capitães',
  mão: 'mãos', irmão: 'irmãos', cristão: 'cristãos', órfão: 'órfãos',
  grão: 'grãos', chão: 'chãos', sótão: 'sótãos',
}

/** Plural of a noun or adjective. */
export function pluralize(word: string): string {
  const w = word
  if (!w) return w

  if (/ão$/.test(w)) return AO_PLURAL[w] ?? `${w.slice(0, -2)}ões`

  // -m → -ns (homem → homens, jardim → jardins)
  if (/m$/.test(w)) return `${w.slice(0, -1)}ns`

  // -l → -is, with the stressed vowel taking an accent (papel → papéis).
  // -il unstressed → -eis (fácil → fáceis) is handled by the accent check.
  if (/l$/.test(w)) {
    const stem = w.slice(0, -1)
    if (/al$|ol$|ul$/.test(w)) return `${stem}is`
    if (/el$/.test(w)) return `${w.slice(0, -2)}éis`
    if (/il$/.test(w)) return /[áéíóúâêô]/.test(w) ? `${w.slice(0, -2)}eis` : `${stem}is`
    return `${stem}is`
  }

  // -r, -z, -s (stressed final) take -es
  if (/(r|z)$/.test(w)) return `${w}es`
  if (/ês$/.test(w)) return `${w.slice(0, -2)}eses`
  if (/s$/.test(w)) {
    // Unstressed final syllable in -s is invariable (o lápis → os lápis)
    return /[áéíóúâêô]s$/.test(w) ? `${w.slice(0, -1)}ses` : w
  }

  if (VOWELS.includes(w.slice(-1))) return `${w}s`
  return `${w}es`
}

function looksPlural(word: string): boolean {
  const w = word.toLowerCase()
  if (w.length < 3) return false
  if (!/s$/.test(w)) return false
  if (/(lápis|ônibus|pires|vírus|atlas)$/.test(w)) return false
  return true
}

// ---- gender -----------------------------------------------------------------

// Portuguese gender is largely readable off the ending; these are the everyday
// words where it is not. The Greek -ma nouns and the -agem set are the two
// families a rule gets wrong.
const GENDER_EXCEPTIONS: Record<string, Gender> = {
  // -a but masculine
  dia: 'm', mapa: 'm', problema: 'm', sistema: 'm', tema: 'm', programa: 'm',
  clima: 'm', sofá: 'm', pijama: 'm', planeta: 'm', cinema: 'm',
  // -o / consonant but feminine
  mão: 'f', foto: 'f', moto: 'f', tribo: 'f',
  viagem: 'f', imagem: 'f', mensagem: 'f', garagem: 'f', coragem: 'f',
  // -e that are feminine
  noite: 'f', tarde: 'f', chave: 'f', carne: 'f', gente: 'f', ponte: 'f',
  fonte: 'f', febre: 'f', nuvem: 'f', árvore: 'f', flor: 'f', cor: 'f',
  dor: 'f', vez: 'f', luz: 'f', voz: 'f', paz: 'f', pele: 'f',
  // -e / consonant that are masculine and might read otherwise
  leite: 'm', dente: 'm', pé: 'm', café: 'm', chá: 'm', peixe: 'm',
  nome: 'm', filme: 'm', parque: 'm', tapete: 'm', papel: 'm', sal: 'm',
  lápis: 'm', ônibus: 'm', pão: 'm', coração: 'm', avião: 'm',
}

export function inferGender(noun: string): Gender {
  const w = noun.trim().toLowerCase()
  const exact = GENDER_EXCEPTIONS[w]
  if (exact) return exact

  if (/(ção|são|dade|tude|agem|ice|ez|eza)$/.test(w)) return 'f'
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

  // -ão → -ã (alemão → alemã) MUST be tested before the plain -o rule, which
  // would otherwise match the same word and produce `alemãa`.
  if (/ão$/.test(lower)) {
    const fem = `${w.slice(0, -2)}ã`
    return { ms: w, fs: fem, mp: pluralize(w), fp: pluralize(fem) }
  }

  // -o → -o/-a/-os/-as
  if (/o$/.test(lower)) {
    const stem = w.slice(0, -1)
    return { ms: w, fs: `${stem}a`, mp: `${stem}os`, fp: `${stem}as` }
  }

  // -ês → -esa (português → portuguesa); -or → -ora
  if (/ês$/.test(lower)) {
    const fem = `${w.slice(0, -2)}esa`
    return { ms: w, fs: fem, mp: pluralize(w), fp: pluralize(fem) }
  }
  if (/or$/.test(lower) && !/(melhor|pior|maior|menor)$/.test(lower)) {
    const fem = `${w}a`
    return { ms: w, fs: fem, mp: pluralize(w), fp: pluralize(fem) }
  }

  // Everything else (-e, -l, -z, -m) marks number only
  const plural = pluralize(w)
  return { ms: w, fs: w, mp: plural, fp: plural }
}

const IRREGULAR_COMPARATIVE: Record<string, string> = {
  bom: 'melhor', boa: 'melhor',
  mau: 'pior', má: 'pior', ruim: 'pior',
  grande: 'maior',
  pequeno: 'menor', pequena: 'menor',
}

// ---- verbs ------------------------------------------------------------------

export interface VerbForms {
  eu: string
  /** `você` and `ele/ela` share the third-person form in Brazilian usage. */
  voce: string
  nos: string
  eles: string
  /** Pretérito perfeito, 1st person singular. */
  passado: string
  gerundio: string
}

const IRREGULAR_VERBS: Record<string, VerbForms> = {
  ser: { eu: 'sou', voce: 'é', nos: 'somos', eles: 'são', passado: 'fui', gerundio: 'sendo' },
  estar: { eu: 'estou', voce: 'está', nos: 'estamos', eles: 'estão', passado: 'estive', gerundio: 'estando' },
  ir: { eu: 'vou', voce: 'vai', nos: 'vamos', eles: 'vão', passado: 'fui', gerundio: 'indo' },
  ter: { eu: 'tenho', voce: 'tem', nos: 'temos', eles: 'têm', passado: 'tive', gerundio: 'tendo' },
  fazer: { eu: 'faço', voce: 'faz', nos: 'fazemos', eles: 'fazem', passado: 'fiz', gerundio: 'fazendo' },
  poder: { eu: 'posso', voce: 'pode', nos: 'podemos', eles: 'podem', passado: 'pude', gerundio: 'podendo' },
  querer: { eu: 'quero', voce: 'quer', nos: 'queremos', eles: 'querem', passado: 'quis', gerundio: 'querendo' },
  ver: { eu: 'vejo', voce: 'vê', nos: 'vemos', eles: 'veem', passado: 'vi', gerundio: 'vendo' },
  dar: { eu: 'dou', voce: 'dá', nos: 'damos', eles: 'dão', passado: 'dei', gerundio: 'dando' },
  dizer: { eu: 'digo', voce: 'diz', nos: 'dizemos', eles: 'dizem', passado: 'disse', gerundio: 'dizendo' },
  vir: { eu: 'venho', voce: 'vem', nos: 'vimos', eles: 'vêm', passado: 'vim', gerundio: 'vindo' },
  pôr: { eu: 'ponho', voce: 'põe', nos: 'pomos', eles: 'põem', passado: 'pus', gerundio: 'pondo' },
  saber: { eu: 'sei', voce: 'sabe', nos: 'sabemos', eles: 'sabem', passado: 'soube', gerundio: 'sabendo' },
  sair: { eu: 'saio', voce: 'sai', nos: 'saímos', eles: 'saem', passado: 'saí', gerundio: 'saindo' },
  ouvir: { eu: 'ouço', voce: 'ouve', nos: 'ouvimos', eles: 'ouvem', passado: 'ouvi', gerundio: 'ouvindo' },
  dormir: { eu: 'durmo', voce: 'dorme', nos: 'dormimos', eles: 'dormem', passado: 'dormi', gerundio: 'dormindo' },
  pedir: { eu: 'peço', voce: 'pede', nos: 'pedimos', eles: 'pedem', passado: 'pedi', gerundio: 'pedindo' },
  sentir: { eu: 'sinto', voce: 'sente', nos: 'sentimos', eles: 'sentem', passado: 'senti', gerundio: 'sentindo' },
  perder: { eu: 'perco', voce: 'perde', nos: 'perdemos', eles: 'perdem', passado: 'perdi', gerundio: 'perdendo' },
  trazer: { eu: 'trago', voce: 'traz', nos: 'trazemos', eles: 'trazem', passado: 'trouxe', gerundio: 'trazendo' },
  ler: { eu: 'leio', voce: 'lê', nos: 'lemos', eles: 'leem', passado: 'li', gerundio: 'lendo' },
  subir: { eu: 'subo', voce: 'sobe', nos: 'subimos', eles: 'sobem', passado: 'subi', gerundio: 'subindo' },
  // `gostar` needs its preposition: "eu gosto DE bolo"
  gostar: { eu: 'gosto', voce: 'gosta', nos: 'gostamos', eles: 'gostam', passado: 'gostei', gerundio: 'gostando' },
  haver: { eu: 'hei', voce: 'há', nos: 'havemos', eles: 'hão', passado: 'houve', gerundio: 'havendo' },
  brincar: { eu: 'brinco', voce: 'brinca', nos: 'brincamos', eles: 'brincam', passado: 'brinquei', gerundio: 'brincando' },
  ficar: { eu: 'fico', voce: 'fica', nos: 'ficamos', eles: 'ficam', passado: 'fiquei', gerundio: 'ficando' },
  chegar: { eu: 'chego', voce: 'chega', nos: 'chegamos', eles: 'chegam', passado: 'cheguei', gerundio: 'chegando' },
  começar: { eu: 'começo', voce: 'começa', nos: 'começamos', eles: 'começam', passado: 'comecei', gerundio: 'começando' },
  doer: { eu: 'doo', voce: 'dói', nos: 'doemos', eles: 'doem', passado: 'doeu', gerundio: 'doendo' },
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
        eu: `${stem}o`, voce: `${stem}a`, nos: `${stem}amos`, eles: `${stem}am`,
        passado: `${stem}ei`, gerundio: `${stem}ando`,
      }
    case 'er':
      return {
        eu: `${stem}o`, voce: `${stem}e`, nos: `${stem}emos`, eles: `${stem}em`,
        passado: `${stem}i`, gerundio: `${stem}endo`,
      }
    case 'ir':
      return {
        eu: `${stem}o`, voce: `${stem}e`, nos: `${stem}imos`, eles: `${stem}em`,
        passado: `${stem}i`, gerundio: `${stem}indo`,
      }
    default:
      return null
  }
}

// ---- pronouns and determiners ------------------------------------------------

const PRONOUNS: Record<string, Array<[string, string]>> = {
  eu: [['me', 'a mim'], ['mim', 'depois de preposição'], ['meu', 'minha coisa'], ['comigo', 'comigo']],
  você: [['te', 'a você'], ['seu', 'sua coisa'], ['com você', 'com você']],
  ele: [['o', 'a ele'], ['lhe', 'para ele'], ['dele', 'coisa dele'], ['com ele', 'com ele']],
  ela: [['a', 'a ela'], ['lhe', 'para ela'], ['dela', 'coisa dela'], ['com ela', 'com ela']],
  nós: [['nos', 'a nós'], ['nosso', 'nossa coisa'], ['com a gente', 'com a gente']],
  eles: [['os', 'a eles'], ['lhes', 'para eles'], ['deles', 'coisa deles']],
  elas: [['as', 'a elas'], ['lhes', 'para elas'], ['delas', 'coisa delas']],
}

const DETERMINERS: Record<string, AdjectiveForms> = {
  o: { ms: 'o', fs: 'a', mp: 'os', fp: 'as' },
  a: { ms: 'o', fs: 'a', mp: 'os', fp: 'as' },
  um: { ms: 'um', fs: 'uma', mp: 'uns', fp: 'umas' },
  uma: { ms: 'um', fs: 'uma', mp: 'uns', fp: 'umas' },
  este: { ms: 'este', fs: 'esta', mp: 'estes', fp: 'estas' },
  esse: { ms: 'esse', fs: 'essa', mp: 'esses', fp: 'essas' },
  aquele: { ms: 'aquele', fs: 'aquela', mp: 'aqueles', fp: 'aquelas' },
  outro: { ms: 'outro', fs: 'outra', mp: 'outros', fp: 'outras' },
  muito: { ms: 'muito', fs: 'muita', mp: 'muitos', fp: 'muitas' },
  pouco: { ms: 'pouco', fs: 'pouca', mp: 'poucos', fp: 'poucas' },
  todo: { ms: 'todo', fs: 'toda', mp: 'todos', fp: 'todas' },
  meu: { ms: 'meu', fs: 'minha', mp: 'meus', fp: 'minhas' },
  seu: { ms: 'seu', fs: 'sua', mp: 'seus', fp: 'suas' },
}

const INVARIABLE = new Set([
  'e', 'ou', 'mas', 'porque', 'que', 'de', 'a', 'em', 'com', 'sem', 'por',
  'para', 'sim', 'não', 'mais', 'menos', 'muito', 'também', 'aqui', 'ali',
  'lá', 'agora', 'depois', 'sempre', 'nunca', 'hoje', 'ontem', 'amanhã',
  'oi', 'olá', 'tchau', 'obrigado', 'obrigada', 'quando', 'onde', 'como',
  'quê', 'quem', 'quanto', 'por favor', 'já', 'ainda',
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
    { value: forms.eu, hint: 'eu' },
    { value: forms.voce, hint: 'você / ele / ela' },
    { value: forms.nos, hint: 'nós' },
    { value: forms.eles, hint: 'vocês / eles' },
    { value: forms.passado, hint: 'passado' },
    { value: forms.gerundio, hint: 'agora' },
  ]
}

function nounFormList(word: string, base: string): WordForm[] {
  const gender = inferGender(word)
  return [
    { value: base, hint: '' },
    { value: pluralize(base), hint: 'mais de um' },
    // No possessive 's — Portuguese uses `de`, which then contracts with the
    // article (de + o = do). See contractions.ts.
    { value: `de ${base}`, hint: 'de quem' },
    { value: `${gender === 'f' ? 'a' : 'o'} ${base}`, hint: 'com artigo' },
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
    { value: agreement.fs, hint: 'feminino', key: 'fs' },
    { value: agreement.mp, hint: 'masculino plural', key: 'mp' },
    { value: agreement.fp, hint: 'feminino plural', key: 'fp' },
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

  const comparative = IRREGULAR_COMPARATIVE[word] ?? `mais ${base}`
  return [...ordered.map(({ value, hint }) => ({ value, hint })), { value: comparative, hint: 'mais' }]
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
    { value: forms.ms, hint: 'masculino' },
    { value: forms.fs, hint: 'feminino' },
    { value: forms.mp, hint: 'masculino plural' },
    { value: forms.fp, hint: 'feminino plural' },
  ]
}

function genericFormList(
  word: string,
  base: string,
  context: MorphContext | undefined,
): WordForm[] {
  if (/(ar|er|ir|ôr)$/.test(word) && word.length > 3 && conjugate(word)) {
    return verbFormList(word, base)
  }
  if (/(o|a)$/.test(word)) return adjectiveFormList(word, base, context)
  return [
    { value: base, hint: '' },
    { value: pluralize(base), hint: 'mais de um' },
  ]
}

/** Portuguese counterpart of `wordForms`. Same contract as the other engines. */
export function portugueseWordForms(
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
