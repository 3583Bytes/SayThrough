// Generates src/data/coreWords.it.json — the Italian boards (§19.7).
//
// Structurally the closest board to the Spanish one — two copulas, pro-drop,
// gender agreement, person on the verb — so the LAYOUT transfers even though
// every word is chosen again. What differs:
//
//  - CONTRACTIONS earn core cells, as in Portuguese. `di` and `a` fuse with a
//    following article (di+il=del, a+il=al) and the fusion is obligatory, not
//    stylistic: `vado a il parco` is not clumsy, it is wrong. They are the
//    highest-value function words on an Italian board precisely because so
//    much depends on them, so they sit in the persistent core rather than on
//    the Paroline page. See src/services/contractions.ts.
//  - `mi piace` IS THE VERB. Italian inverts the subject — it is the thing
//    that pleases, not the person who likes — so there is no single-word
//    button for "like". `mi piace` is what a speaker actually says and it
//    goes on one cell, exactly as `gusta`/`gosto` do on the Spanish and
//    Portuguese boards.
//  - SIX PERSONS. Italian has not collapsed `voi` the way Brazilian usage
//    collapsed `você`, so the Parole di aiuto page carries a fuller auxiliary
//    set than the Portuguese one and the word-forms popup offers six.
//  - `c'è` earns a cell. Italian existentials are so frequent in requests
//    ("c'è il gelato?") that the board is noticeably poorer without it.
//
// Word lists adapted from published Italian core vocabulary work (vocabolario
// nucleare / CAA materials from Italian practice) per the project's
// `adapt, don't invent` rule. §19.6 review is OUTSTANDING.
//
// Usage: node scripts/vocabulary/build-italian-core.mjs

import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outPath = join(here, '..', '..', 'src', 'data', 'coreWords.it.json')

function leveled(words, firstShare = 2 / 13, secondShare = 4 / 13) {
  const n = words.length
  const firstEnd = Math.max(1, Math.round(n * firstShare))
  const secondEnd = firstEnd + Math.max(1, Math.round(n * secondShare))
  return words.map(([label, pos], i) => [
    label,
    pos,
    i < firstEnd ? 1 : i < secondEnd ? 2 : 3,
  ])
}

const core = (words) => words.map(([label, pos]) => [label, pos, 1])

// ---------------------------------------------------------------------------
// 3×4 — emergent communicators.

const SIZE_3X4 = {
  name: 'Vocabolario nucleare (semplificato)',
  shortName: 'Semplificato',
  rows: 3,
  columns: 4,
  coreColumns: 2,
  core: core([
    ['io', 'pronoun'], ['voglio', 'verb'],
    ['andare', 'verb'], ['più', 'little'],
    ['mio', 'pronoun'], ['no', 'social'],
  ]),
  topicLevels: { Parole: 1, Sentimenti: 1, Cibo: 1, Bevande: 1, Persone: 1 },
  corePages: { Parole: 'verb', Sentimenti: 'descriptor' },
  topics: {
    Parole: core([['aiuto', 'noun'], ['basta', 'verb'], ['questo', 'pronoun'], ['quello', 'pronoun']]),
    Sentimenti: core([['felice', 'descriptor'], ['triste', 'descriptor'], ['arrabbiato', 'descriptor'], ['stanco', 'descriptor']]),
    Cibo: core([['mangiare', 'verb'], ['fame', 'noun'], ['biscotto', 'noun'], ['mela', 'noun']]),
    Bevande: core([['bere', 'verb'], ['sete', 'noun'], ['acqua', 'noun'], ['latte', 'noun']]),
    Persone: core([['mamma', 'noun'], ['papà', 'noun'], ['maestra', 'noun'], ['amico', 'noun']]),
  },
}

// ---------------------------------------------------------------------------
// 5×6 — the standard board.

const SIZE_5X6 = {
  name: 'Vocabolario nucleare',
  shortName: 'Standard',
  rows: 5,
  columns: 6,
  coreColumns: 3,
  core: core([
    ['io', 'pronoun'], ['tu', 'pronoun'], ['questo', 'pronoun'],
    ['voglio', 'verb'], ['mi piace', 'verb'], ['più', 'little'],
    ['è', 'verb'], ['sta', 'verb'], ['andare', 'verb'],
    ['aiuto', 'noun'], ['basta', 'verb'], ['fare', 'verb'],
    ['di', 'little'], ['sì', 'social'], ['no', 'social'],
  ]),
  topicLevels: {
    Azioni: 1, 'Parole di aiuto': 1, Descrivere: 1, Sentimenti: 1, Sociale: 1,
    Domande: 1, Paroline: 1, Cibo: 1, Bevande: 1, Giocare: 1, Persone: 1,
    Luoghi: 2, Scuola: 2, Corpo: 2,
  },
  corePages: {
    Azioni: 'verb', 'Parole di aiuto': 'verb', Descrivere: 'descriptor',
    Sentimenti: 'descriptor', Sociale: 'social', Domande: 'question',
    Paroline: 'little',
  },
  topics: {
    Azioni: leveled([
      ['aprire', 'verb'], ['chiudere', 'verb'], ['dare', 'verb'], ['prendere', 'verb'],
      ['mettere', 'verb'], ['lavare', 'verb'], ['leggere', 'verb'], ['scrivere', 'verb'],
      ['cantare', 'verb'], ['ballare', 'verb'], ['correre', 'verb'], ['saltare', 'verb'],
      ['sedersi', 'verb'],
    ]),
    'Parole di aiuto': leveled([
      ['non', 'little'], ['posso', 'verb'], ['sono', 'verb'], ['ho', 'verb'],
      ['puoi', 'verb'], ['devo', 'verb'], ['sei', 'verb'], ['hai', 'verb'],
      ['siamo', 'verb'], ['abbiamo', 'verb'], ['era', 'verb'], ['sarà', 'verb'],
      ['andiamo', 'verb'],
    ]),
    Descrivere: leveled([
      ['grande', 'descriptor'], ['piccolo', 'descriptor'], ['bello', 'descriptor'],
      ['brutto', 'descriptor'], ['nuovo', 'descriptor'], ['vecchio', 'descriptor'],
      ['caldo', 'descriptor'], ['freddo', 'descriptor'], ['veloce', 'descriptor'],
      ['lento', 'descriptor'], ['sporco', 'descriptor'], ['pulito', 'descriptor'],
      ['buono', 'descriptor'],
    ]),
    Sentimenti: leveled([
      ['felice', 'descriptor'], ['triste', 'descriptor'], ['arrabbiato', 'descriptor'],
      ['stanco', 'descriptor'], ['malato', 'descriptor'], ['spaventato', 'descriptor'],
      ['annoiato', 'descriptor'], ['contento', 'descriptor'], ['preoccupato', 'descriptor'],
      ['solo', 'descriptor'], ['orgoglioso', 'descriptor'], ['geloso', 'descriptor'],
      ['calmo', 'descriptor'],
    ]),
    Sociale: leveled([
      ['ciao', 'social'], ['grazie', 'social'], ['per favore', 'social'],
      ['scusa', 'social'], ['prego', 'social'], ['arrivederci', 'social'],
      ['come stai', 'social'], ['bene', 'social'], ['buongiorno', 'social'],
      ['buonanotte', 'social'], ['a dopo', 'social'], ['mi dispiace', 'social'],
      ['benvenuto', 'social'],
    ]),
    Domande: leveled([
      ['cosa', 'question'], ['dove', 'question'], ['chi', 'question'],
      ['quando', 'question'], ['perché', 'question'], ['come', 'question'],
      ['quale', 'question'], ['quanto', 'question'], ['quanti', 'question'],
      ['chi è', 'question'], ["cos'è", 'question'], ["dov'è", 'question'],
      ['perché no', 'question'],
    ]),
    Paroline: leveled([
      ['il', 'little'], ['la', 'little'], ['un', 'little'], ['una', 'little'],
      ['e', 'little'], ['o', 'little'], ['ma', 'little'], ['a', 'little'],
      ['in', 'little'], ['con', 'little'], ['per', 'little'], ['su', 'little'],
      ['da', 'little'],
    ]),
    Cibo: leveled([
      ['mangiare', 'verb'], ['fame', 'noun'], ['pane', 'noun'], ['pasta', 'noun'],
      ['pizza', 'noun'], ['mela', 'noun'], ['banana', 'noun'], ['biscotto', 'noun'],
      ['formaggio', 'noun'], ['riso', 'noun'], ['carne', 'noun'], ['zuppa', 'noun'],
      ['gelato', 'noun'],
    ]),
    Bevande: leveled([
      ['bere', 'verb'], ['sete', 'noun'], ['acqua', 'noun'], ['latte', 'noun'],
      ['succo', 'noun'], ['tè', 'noun'], ['caffè', 'noun'], ['bibita', 'noun'],
      ['bicchiere', 'noun'], ['cannuccia', 'noun'], ['cioccolata', 'noun'],
      ['limonata', 'noun'], ['tazza', 'noun'],
    ]),
    Giocare: leveled([
      ['giocare', 'verb'], ['palla', 'noun'], ['gioco', 'noun'], ['musica', 'noun'],
      ['libro', 'noun'], ['disegnare', 'verb'], ['costruire', 'verb'], ['altalena', 'noun'],
      ['bolle', 'noun'], ['puzzle', 'noun'], ['macchinina', 'noun'], ['bambola', 'noun'],
      ['nascondino', 'noun'],
    ]),
    Persone: leveled([
      ['mamma', 'noun'], ['papà', 'noun'], ['nonna', 'noun'], ['nonno', 'noun'],
      ['fratello', 'noun'], ['sorella', 'noun'], ['amico', 'noun'], ['amica', 'noun'],
      ['maestra', 'noun'], ['dottore', 'noun'], ['bambino', 'noun'], ['bambina', 'noun'],
      ['famiglia', 'noun'],
    ]),
    Luoghi: leveled([
      ['casa', 'noun'], ['scuola', 'noun'], ['fuori', 'noun'], ['dentro', 'noun'],
      ['bagno', 'noun'], ['cucina', 'noun'], ['camera', 'noun'], ['parco', 'noun'],
      ['negozio', 'noun'], ['macchina', 'noun'], ['giardino', 'noun'], ['ospedale', 'noun'],
      ['spiaggia', 'noun'],
    ]),
    Scuola: leveled([
      ['classe', 'noun'], ['quaderno', 'noun'], ['matita', 'noun'], ['banco', 'noun'],
      ['zaino', 'noun'], ['compiti', 'noun'], ['ricreazione', 'noun'], ['mensa', 'noun'],
      ['campanella', 'noun'], ['lavagna', 'noun'], ['colla', 'noun'], ['forbici', 'noun'],
      ['gomma', 'noun'],
    ]),
    Corpo: leveled([
      ['testa', 'noun'], ['mano', 'noun'], ['piede', 'noun'], ['pancia', 'noun'],
      ['occhio', 'noun'], ['orecchio', 'noun'], ['bocca', 'noun'], ['naso', 'noun'],
      ['braccio', 'noun'], ['gamba', 'noun'], ['capelli', 'noun'], ['dente', 'noun'],
      ['schiena', 'noun'],
    ]),
  },
}

// ---------------------------------------------------------------------------
// 6×10 — the expanded board.

const SIZE_6X10 = {
  name: 'Vocabolario nucleare (ampliato)',
  shortName: 'Ampliato',
  rows: 6,
  columns: 10,
  coreColumns: 4,
  core: core([
    ['io', 'pronoun'], ['tu', 'pronoun'], ['lui', 'pronoun'], ['lei', 'pronoun'],
    ['questo', 'pronoun'], ['quello', 'pronoun'], ['cosa', 'question'], ['dove', 'question'],
    ['voglio', 'verb'], ['mi piace', 'verb'], ['ho bisogno', 'verb'], ['ho', 'verb'],
    ['è', 'verb'], ['sta', 'verb'], ["c'è", 'verb'], ['fare', 'verb'],
    ['andare', 'verb'], ['aiuto', 'noun'], ['basta', 'verb'], ['guarda', 'verb'],
    ['più', 'little'], ['di', 'little'], ['sì', 'social'], ['no', 'social'],
  ]),
  topicLevels: {
    Azioni: 1, 'Parole di aiuto': 1, Pronomi: 1, Descrivere: 1, Sentimenti: 1,
    Sociale: 1, Domande: 1, Paroline: 1, Tempo: 1, Quantità: 1,
    Cibo: 1, Bevande: 1, Giocare: 1, Persone: 1, Luoghi: 2, Scuola: 2,
    Corpo: 2, Animali: 2, Vestiti: 2, 'In casa': 2, Meteo: 3,
  },
  corePages: {
    Azioni: 'verb', 'Parole di aiuto': 'verb', Pronomi: 'pronoun',
    Descrivere: 'descriptor', Sentimenti: 'descriptor', Sociale: 'social',
    Domande: 'question', Paroline: 'little', Tempo: 'little', Quantità: 'little',
  },
  topics: {
    Azioni: leveled([
      ['aprire', 'verb'], ['chiudere', 'verb'], ['dare', 'verb'], ['prendere', 'verb'],
      ['mettere', 'verb'], ['lavare', 'verb'], ['mangiare', 'verb'], ['bere', 'verb'],
      ['dormire', 'verb'], ['giocare', 'verb'], ['leggere', 'verb'], ['scrivere', 'verb'],
      ['cantare', 'verb'], ['ballare', 'verb'], ['correre', 'verb'], ['saltare', 'verb'],
      ['sedersi', 'verb'], ['alzarsi', 'verb'], ['venire', 'verb'], ['uscire', 'verb'],
      ['entrare', 'verb'], ['cercare', 'verb'], ['trovare', 'verb'], ['sentire', 'verb'],
      ['toccare', 'verb'], ['aspettare', 'verb'], ['finire', 'verb'], ['cominciare', 'verb'],
      ['comprare', 'verb'], ['pulire', 'verb'], ['cucinare', 'verb'], ['camminare', 'verb'],
      ['disegnare', 'verb'], ['costruire', 'verb'],
    ]),
    'Parole di aiuto': leveled([
      ['non', 'little'], ['posso', 'verb'], ['sono', 'verb'], ['sei', 'verb'],
      ['siamo', 'verb'], ['siete', 'verb'], ['hai', 'verb'], ['abbiamo', 'verb'],
      ['avete', 'verb'], ['hanno', 'verb'], ['puoi', 'verb'], ['può', 'verb'],
      ['possiamo', 'verb'], ['devo', 'verb'], ['devi', 'verb'], ['deve', 'verb'],
      ['voglio andare', 'verb'], ['era', 'verb'], ['erano', 'verb'], ['sarà', 'verb'],
      ['andiamo', 'verb'], ['facciamo', 'verb'], ['mi serve', 'verb'], ['so', 'verb'],
      ['non so', 'verb'], ['credo', 'verb'], ['spero', 'verb'], ['sto', 'verb'],
      ['stiamo', 'verb'], ['sarei', 'verb'], ['vorrei', 'verb'],
    ]),
    Pronomi: leveled([
      ['noi', 'pronoun'], ['voi', 'pronoun'], ['loro', 'pronoun'], ['mio', 'pronoun'],
      ['tuo', 'pronoun'], ['suo', 'pronoun'], ['nostro', 'pronoun'], ['vostro', 'pronoun'],
      ['mi', 'pronoun'], ['ti', 'pronoun'], ['ci', 'pronoun'], ['vi', 'pronoun'],
      ['lo', 'pronoun'], ['la', 'pronoun'], ['li', 'pronoun'], ['le', 'pronoun'],
      ['gli', 'pronoun'], ['me', 'pronoun'], ['te', 'pronoun'], ['sé', 'pronoun'],
      ['qualcuno', 'pronoun'], ['nessuno', 'pronoun'], ['qualcosa', 'pronoun'],
      ['niente', 'pronoun'], ['tutti', 'pronoun'], ['tutto', 'pronoun'],
      ['altro', 'pronoun'], ['stesso', 'pronoun'], ['questi', 'pronoun'],
      ['quelli', 'pronoun'], ['ognuno', 'pronoun'], ['chiunque', 'pronoun'],
    ]),
    Descrivere: leveled([
      ['grande', 'descriptor'], ['piccolo', 'descriptor'], ['bello', 'descriptor'],
      ['brutto', 'descriptor'], ['nuovo', 'descriptor'], ['vecchio', 'descriptor'],
      ['caldo', 'descriptor'], ['freddo', 'descriptor'], ['veloce', 'descriptor'],
      ['lento', 'descriptor'], ['sporco', 'descriptor'], ['pulito', 'descriptor'],
      ['buono', 'descriptor'], ['cattivo', 'descriptor'], ['forte', 'descriptor'],
      ['piano', 'descriptor'], ['duro', 'descriptor'], ['morbido', 'descriptor'],
      ['lungo', 'descriptor'], ['corto', 'descriptor'], ['alto', 'descriptor'],
      ['basso', 'descriptor'], ['pieno', 'descriptor'], ['vuoto', 'descriptor'],
      ['facile', 'descriptor'], ['difficile', 'descriptor'], ['giusto', 'descriptor'],
      ['sbagliato', 'descriptor'], ['divertente', 'descriptor'], ['noioso', 'descriptor'],
      ['preferito', 'descriptor'], ['pronto', 'descriptor'], ['rotto', 'descriptor'],
    ]),
    Sentimenti: leveled([
      ['felice', 'descriptor'], ['triste', 'descriptor'], ['arrabbiato', 'descriptor'],
      ['stanco', 'descriptor'], ['malato', 'descriptor'], ['spaventato', 'descriptor'],
      ['annoiato', 'descriptor'], ['contento', 'descriptor'], ['preoccupato', 'descriptor'],
      ['solo', 'descriptor'], ['orgoglioso', 'descriptor'], ['geloso', 'descriptor'],
      ['calmo', 'descriptor'], ['nervoso', 'descriptor'], ['emozionato', 'descriptor'],
      ['confuso', 'descriptor'], ['sorpreso', 'descriptor'], ['deluso', 'descriptor'],
      ['imbarazzato', 'descriptor'], ['frustrato', 'descriptor'], ['tranquillo', 'descriptor'],
      ['male', 'descriptor'], ['dolore', 'noun'], ['freddo', 'noun'], ['paura', 'noun'],
      ['sicuro', 'descriptor'], ['a posto', 'descriptor'], ['così così', 'descriptor'],
    ]),
    Sociale: leveled([
      ['ciao', 'social'], ['grazie', 'social'], ['per favore', 'social'],
      ['scusa', 'social'], ['prego', 'social'], ['arrivederci', 'social'],
      ['come stai', 'social'], ['bene', 'social'], ['buongiorno', 'social'],
      ['buonasera', 'social'], ['buonanotte', 'social'], ['a dopo', 'social'],
      ['mi dispiace', 'social'], ['benvenuto', 'social'], ['tocca a me', 'social'],
      ['tocca a te', 'social'], ['bravo', 'social'], ['aspetta', 'social'],
      ['guarda qui', 'social'], ['vieni qui', 'social'], ['lasciami stare', 'social'],
      ['va bene', 'social'], ['non va bene', 'social'], ['di nuovo', 'social'],
      ['auguri', 'social'], ['complimenti', 'social'], ['salute', 'social'],
      ['buon appetito', 'social'], ['a domani', 'social'], ['piacere', 'social'],
      ['segreto', 'social'],
    ]),
    Domande: leveled([
      ['chi', 'question'], ['quando', 'question'], ['perché', 'question'],
      ['come', 'question'], ['quale', 'question'], ['quanto', 'question'],
      ['quanti', 'question'], ['chi è', 'question'], ["cos'è", 'question'],
      ["dov'è", 'question'], ['perché no', 'question'], ['come mai', 'question'],
      ['che cosa', 'question'], ['quanto costa', 'question'], ['a che ora', 'question'],
      ['posso', 'question'], ['davvero', 'question'], ['vero', 'question'],
      ['e poi', 'question'], ['di chi', 'question'],
    ]),
    Paroline: leveled([
      ['il', 'little'], ['la', 'little'], ['lo', 'little'], ['i', 'little'],
      ['gli', 'little'], ['le', 'little'], ['un', 'little'], ['una', 'little'],
      ['e', 'little'], ['o', 'little'], ['ma', 'little'], ['a', 'little'],
      ['in', 'little'], ['con', 'little'], ['per', 'little'], ['su', 'little'],
      ['da', 'little'], ['tra', 'little'], ['senza', 'little'], ['sopra', 'little'],
      ['sotto', 'little'], ['dentro', 'little'], ['fuori', 'little'], ['vicino', 'little'],
      ['lontano', 'little'], ['qui', 'little'], ['lì', 'little'], ['anche', 'little'],
      ['solo', 'little'], ['ancora', 'little'], ['già', 'little'], ['perché', 'little'],
      ['se', 'little'], ['che', 'little'],
    ]),
    Tempo: leveled([
      ['adesso', 'little'], ['dopo', 'little'], ['prima', 'little'], ['oggi', 'little'],
      ['domani', 'little'], ['ieri', 'little'], ['mattina', 'noun'], ['pomeriggio', 'noun'],
      ['sera', 'noun'], ['notte', 'noun'], ['presto', 'little'], ['tardi', 'little'],
      ['sempre', 'little'], ['mai', 'little'], ['a volte', 'little'], ['subito', 'little'],
      ['minuto', 'noun'], ['ora', 'noun'], ['giorno', 'noun'], ['settimana', 'noun'],
      ['mese', 'noun'], ['anno', 'noun'], ['weekend', 'noun'], ['compleanno', 'noun'],
    ]),
    Quantità: leveled([
      ['tanto', 'little'], ['poco', 'little'], ['niente', 'little'], ['tutto', 'little'],
      ['un altro', 'little'], ['abbastanza', 'little'], ['troppo', 'little'],
      ['metà', 'little'], ['uno', 'little'], ['due', 'little'], ['tre', 'little'],
      ['quattro', 'little'], ['cinque', 'little'], ['sei', 'little'], ['sette', 'little'],
      ['otto', 'little'], ['nove', 'little'], ['dieci', 'little'], ['tanti', 'little'],
    ]),
    Cibo: leveled([
      ['pane', 'noun'], ['pasta', 'noun'], ['pizza', 'noun'], ['mela', 'noun'],
      ['banana', 'noun'], ['biscotto', 'noun'], ['formaggio', 'noun'], ['riso', 'noun'],
      ['carne', 'noun'], ['zuppa', 'noun'], ['gelato', 'noun'], ['fame', 'noun'],
      ['patatine', 'noun'], ['uovo', 'noun'], ['pollo', 'noun'], ['pesce', 'noun'],
      ['verdura', 'noun'], ['frutta', 'noun'], ['torta', 'noun'],
    ]),
    Bevande: leveled([
      ['acqua', 'noun'], ['latte', 'noun'], ['succo', 'noun'], ['tè', 'noun'],
      ['caffè', 'noun'], ['bibita', 'noun'], ['bicchiere', 'noun'], ['cannuccia', 'noun'],
      ['cioccolata', 'noun'], ['limonata', 'noun'], ['tazza', 'noun'], ['sete', 'noun'],
      ['bottiglia', 'noun'], ['ghiaccio', 'noun'], ['tisana', 'noun'], ['spremuta', 'noun'],
      ['frullato', 'noun'], ['aranciata', 'noun'], ['borraccia', 'noun'],
    ]),
    Giocare: leveled([
      ['palla', 'noun'], ['gioco', 'noun'], ['musica', 'noun'], ['libro', 'noun'],
      ['altalena', 'noun'], ['bolle', 'noun'], ['puzzle', 'noun'], ['macchinina', 'noun'],
      ['bambola', 'noun'], ['nascondino', 'noun'], ['tablet', 'noun'], ['televisione', 'noun'],
      ['film', 'noun'], ['canzone', 'noun'], ['pallone', 'noun'], ['bicicletta', 'noun'],
      ['scivolo', 'noun'], ['sabbia', 'noun'], ['costruzioni', 'noun'],
    ]),
    Persone: leveled([
      ['mamma', 'noun'], ['papà', 'noun'], ['nonna', 'noun'], ['nonno', 'noun'],
      ['fratello', 'noun'], ['sorella', 'noun'], ['amico', 'noun'], ['amica', 'noun'],
      ['maestra', 'noun'], ['dottore', 'noun'], ['bambino', 'noun'], ['bambina', 'noun'],
      ['famiglia', 'noun'], ['zia', 'noun'], ['zio', 'noun'], ['cugino', 'noun'],
      ['signora', 'noun'], ['signore', 'noun'], ['compagno', 'noun'],
    ]),
    Luoghi: leveled([
      ['casa', 'noun'], ['scuola', 'noun'], ['bagno', 'noun'], ['cucina', 'noun'],
      ['camera', 'noun'], ['parco', 'noun'], ['negozio', 'noun'], ['macchina', 'noun'],
      ['giardino', 'noun'], ['ospedale', 'noun'], ['spiaggia', 'noun'], ['piscina', 'noun'],
      ['strada', 'noun'], ['autobus', 'noun'], ['treno', 'noun'], ['chiesa', 'noun'],
      ['cinema', 'noun'], ['ristorante', 'noun'], ['montagna', 'noun'],
    ]),
    Scuola: leveled([
      ['classe', 'noun'], ['quaderno', 'noun'], ['matita', 'noun'], ['banco', 'noun'],
      ['zaino', 'noun'], ['compiti', 'noun'], ['ricreazione', 'noun'], ['mensa', 'noun'],
      ['campanella', 'noun'], ['lavagna', 'noun'], ['colla', 'noun'], ['forbici', 'noun'],
      ['gomma', 'noun'], ['penna', 'noun'], ['pennarello', 'noun'], ['foglio', 'noun'],
      ['palestra', 'noun'], ['gita', 'noun'],
    ]),
    Corpo: leveled([
      ['testa', 'noun'], ['mano', 'noun'], ['piede', 'noun'], ['pancia', 'noun'],
      ['occhio', 'noun'], ['orecchio', 'noun'], ['bocca', 'noun'], ['naso', 'noun'],
      ['braccio', 'noun'], ['gamba', 'noun'], ['capelli', 'noun'], ['dente', 'noun'],
      ['schiena', 'noun'], ['dito', 'noun'], ['ginocchio', 'noun'], ['spalla', 'noun'],
      ['collo', 'noun'], ['faccia', 'noun'], ['cuore', 'noun'],
    ]),
    Animali: leveled([
      ['cane', 'noun'], ['gatto', 'noun'], ['uccello', 'noun'], ['cavallo', 'noun'],
      ['mucca', 'noun'], ['maiale', 'noun'], ['pecora', 'noun'], ['coniglio', 'noun'],
      ['topo', 'noun'], ['leone', 'noun'], ['elefante', 'noun'], ['scimmia', 'noun'],
      ['orso', 'noun'], ['ape', 'noun'], ['farfalla', 'noun'], ['ragno', 'noun'],
      ['serpente', 'noun'], ['anatra', 'noun'], ['gallina', 'noun'],
    ]),
    Vestiti: leveled([
      ['maglietta', 'noun'], ['pantaloni', 'noun'], ['scarpe', 'noun'], ['calzini', 'noun'],
      ['giacca', 'noun'], ['cappello', 'noun'], ['vestito', 'noun'], ['gonna', 'noun'],
      ['maglione', 'noun'], ['pigiama', 'noun'], ['guanti', 'noun'], ['sciarpa', 'noun'],
      ['stivali', 'noun'], ['cappotto', 'noun'], ['occhiali', 'noun'], ['zip', 'noun'],
      ['bottone', 'noun'], ['costume', 'noun'], ['pannolino', 'noun'],
    ]),
    'In casa': leveled([
      ['letto', 'noun'], ['sedia', 'noun'], ['tavolo', 'noun'], ['porta', 'noun'],
      ['finestra', 'noun'], ['luce', 'noun'], ['divano', 'noun'], ['doccia', 'noun'],
      ['sapone', 'noun'], ['asciugamano', 'noun'], ['spazzolino', 'noun'], ['pettine', 'noun'],
      ['coperta', 'noun'], ['cuscino', 'noun'], ['piatto', 'noun'], ['forchetta', 'noun'],
      ['cucchiaio', 'noun'], ['coltello', 'noun'], ['frigorifero', 'noun'],
    ]),
    Meteo: leveled([
      ['sole', 'noun'], ['pioggia', 'noun'], ['neve', 'noun'], ['vento', 'noun'],
      ['nuvola', 'noun'], ['caldo', 'noun'], ['freddo', 'noun'], ['temporale', 'noun'],
      ['arcobaleno', 'noun'], ['nebbia', 'noun'], ['bagnato', 'descriptor'],
      ['asciutto', 'descriptor'], ['ombrello', 'noun'], ['cielo', 'noun'],
    ]),
  },
}

const doc = {
  _comment: [
    'Authored Italian boards (§19.7). Generated by',
    'scripts/vocabulary/build-italian-core.mjs — edit that, not this file.',
    '',
    'Same shape as the Spanish board: two copulas, pro-drop, gender agreement.',
    '`di` and `a` sit in the persistent core because they CONTRACT obligatorily',
    'with a following article (di+il=del, a+il=al) — see',
    'src/services/contractions.ts. `mi piace` is one button because Italian',
    'inverts the subject and there is no single-word verb for it.',
    '',
    'SLP REVIEW OUTSTANDING (§19.6) — as for every language.',
  ],
  sizes: { '5x6': SIZE_5X6, '3x4': SIZE_3X4, '6x10': SIZE_6X10 },
}

// ---- sanity checks ---------------------------------------------------------

const problems = []
for (const [size, layout] of Object.entries(doc.sizes)) {
  const coreCells = layout.rows * layout.coreColumns
  if (layout.core.length !== coreCells) {
    problems.push(`${size}: core has ${layout.core.length} words for ${coreCells} cells`)
  }
  const contentCells = layout.rows * (layout.columns - layout.coreColumns)
  const topicCount = Object.keys(layout.topics).length
  if (topicCount > contentCells - 1) {
    problems.push(`${size}: ${topicCount} topics exceed ${contentCells - 1} home nav cells`)
  }
  for (const [topic, words] of Object.entries(layout.topics)) {
    const seen = new Set()
    for (const [label] of words) {
      if (seen.has(label)) problems.push(`${size}/${topic}: duplicate "${label}"`)
      seen.add(label)
    }
    if (!layout.topicLevels[topic]) problems.push(`${size}/${topic}: no topicLevel`)
  }
  const coreLabels = new Set(layout.core.map(([l]) => l))
  for (const [topic, words] of Object.entries(layout.topics)) {
    for (const [label] of words) {
      if (coreLabels.has(label)) {
        problems.push(`${size}/${topic}: "${label}" duplicates a persistent core word`)
      }
    }
  }
}
if (problems.length) {
  console.error('Italian board problems:\n  ' + problems.join('\n  '))
  process.exit(1)
}

await writeFile(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')

for (const [size, layout] of Object.entries(doc.sizes)) {
  const topicWords = Object.values(layout.topics).reduce((n, w) => n + w.length, 0)
  const corePageWords = Object.entries(layout.topics)
    .filter(([t]) => layout.corePages?.[t])
    .reduce((n, [, w]) => n + w.length, 0)
  console.log(
    `${size}: ${layout.core.length} persistent core + ${corePageWords} core-page ` +
      `= ${layout.core.length + corePageWords} core, ${layout.core.length + topicWords} total, ` +
      `${Object.keys(layout.topics).length} topics`,
  )
}
console.log(`\nWrote ${outPath}`)
