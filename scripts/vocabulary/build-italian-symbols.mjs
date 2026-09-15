// Generates src/data/seedSymbolMap.it.json — Italian label → ARASAAC id.
//
// ARASAAC pictogram ids are language-neutral: the picture for `arasaac:2617`
// is the same whether the button under it reads "I" or "io". So rather than
// re-running the symbol pipeline against the Italian ARASAAC index (a 20 MB
// network fetch that would produce the same ids), this maps each Italian
// board label to the English concept already curated in seedSymbolMap.json
// and reuses its id.
//
// Words with no equivalent concept are left unmapped and render as text —
// conventional in AAC for function words, and the same thing the English
// boards do for words the pipeline could not match.
//
// Usage: node scripts/vocabulary/build-italian-symbols.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, '..', '..', 'src', 'data')

const english = JSON.parse(await readFile(join(dataDir, 'seedSymbolMap.json'), 'utf8'))
const boards = JSON.parse(await readFile(join(dataDir, 'coreWords.it.json'), 'utf8'))

// Italian board label → the English concept key in seedSymbolMap.json.
const CONCEPT = {
  // page / topic names
  Azioni: 'Actions', Animali: 'Animals', Corpo: 'Body', Vestiti: 'Clothes',
  Descrivere: 'Describing', Bevande: 'Drinks', Sentimenti: 'Feelings',
  Cibo: 'Food', 'Parole di aiuto': 'Helping Words', 'In casa': 'House',
  Paroline: 'Little Words', Persone: 'People', Luoghi: 'Places',
  Giocare: 'Play', Pronomi: 'Pronouns', 'Quantità': 'Quantity',
  Domande: 'Questions', Scuola: 'School', Sociale: 'Social', Tempo: 'Time',
  Meteo: 'Weather', Parole: 'Little Words',

  // pronouns and deixis
  io: 'I', tu: 'you', lui: 'he', lei: 'she', noi: 'we', voi: 'you',
  loro: 'they', questo: 'this', quello: 'that', questi: 'these',
  quelli: 'those', mio: 'my', tuo: 'your', suo: 'his', nostro: 'our',
  vostro: 'your', mi: 'me', ti: 'you', ci: 'us', vi: 'you', me: 'me',
  te: 'you', lo: 'it', la: 'it', li: 'them', le: 'them', gli: 'them',
  'sé': 'itself', qualcuno: 'someone', nessuno: 'nobody',
  qualcosa: 'some', niente: 'nothing', tutti: 'everyone', tutto: 'all',
  altro: 'other', stesso: 'same', ognuno: 'everyone', chiunque: 'anyone',

  // core verbs
  voglio: 'want', 'ho bisogno': 'need', 'mi piace': 'like', ho: 'have',
  andare: 'go', aiuto: 'help', basta: 'stop', fare: 'do', guarda: 'look',
  mangiare: 'eat', bere: 'drink', dormire: 'sleep', giocare: 'play',
  aprire: 'open', chiudere: 'close', dare: 'give', prendere: 'take',
  mettere: 'put', lavare: 'wash', leggere: 'read', scrivere: 'write',
  cantare: 'sing', ballare: 'dance', correre: 'run', saltare: 'jump',
  sedersi: 'sit', aspettare: 'wait', cercare: 'look', trovare: 'get',
  toccare: 'feel', finire: 'done', comprare: 'store',
  pulire: 'clean', cucinare: 'cook', camminare: 'go', disegnare: 'draw',
  costruire: 'build', venire: 'come', uscire: 'out', entrare: 'inside',
  alzarsi: 'up', sentire: 'listen',

  // essere / stare / avere / potere — one picture per lemma
  'è': 'be', sono: 'be', siamo: 'be', siete: 'be', era: 'be',
  'sarà': 'will', sarei: 'will', sta: 'be', sto: 'be', stiamo: 'be',
  erano: 'be', hai: 'have', abbiamo: 'have', avete: 'have', hanno: 'have',
  "c'è": 'be', posso: 'can', puoi: 'can', 'può': 'can', possiamo: 'can',
  devo: 'need', devi: 'need', deve: 'need', andiamo: 'go', facciamo: 'do',
  'mi serve': 'need', so: 'know', 'non so': "i don't know", credo: 'think',
  spero: 'want', vorrei: 'want', 'voglio andare': 'go',

  // describing
  grande: 'big', piccolo: 'little', bello: 'pretty', brutto: 'bad',
  nuovo: 'new', vecchio: 'old', caldo: 'hot', freddo: 'cold',
  veloce: 'fast', lento: 'slow', sporco: 'dirty', pulito: 'clean',
  buono: 'good', cattivo: 'bad', forte: 'loud', piano: 'quiet',
  morbido: 'soft', lungo: 'long', corto: 'short',
  alto: 'tall', basso: 'short', pieno: 'full', vuoto: 'empty',
  facile: 'easy', giusto: 'right', sbagliato: 'wrong',
  divertente: 'funny', noioso: 'bored', preferito: 'favorite',
  pronto: 'ready', rotto: 'broken', bagnato: 'wet', asciutto: 'dry',

  // feelings
  felice: 'happy', triste: 'sad', arrabbiato: 'angry', stanco: 'tired',
  malato: 'sick', spaventato: 'scared', annoiato: 'bored', contento: 'happy',
  preoccupato: 'worried', solo: 'alone', orgoglioso: 'proud', calmo: 'calm', nervoso: 'nervous', emozionato: 'excited',
  confuso: 'confused', sorpreso: 'surprised', deluso: 'sad',
  imbarazzato: 'shy', frustrato: 'mad', tranquillo: 'quiet', male: 'hurt',
  dolore: 'hurt', paura: 'scared', sicuro: 'safe', 'a posto': 'okay',
  'così così': 'okay',

  // social
  ciao: 'hi', grazie: 'thanks', 'per favore': 'please', scusa: 'sorry',
  prego: 'welcome', arrivederci: 'bye', 'come stai': 'how', bene: 'good',
  buongiorno: 'morning', buonasera: 'night', buonanotte: 'night',
  'a dopo': 'see you later', 'mi dispiace': 'sorry', benvenuto: 'welcome',
  'tocca a me': 'my turn', 'tocca a te': 'your', bravo: 'high five',
  aspetta: 'wait', 'guarda qui': 'look', 'vieni qui': 'come',
  'lasciami stare': 'leave me alone', 'va bene': 'okay',
  'non va bene': 'wrong', 'di nuovo': 'again', auguri: 'happy',
  complimenti: 'high five', 'buon appetito': 'eat',
  'a domani': 'tomorrow', piacere: 'nice', // questions
  cosa: 'what', dove: 'where', chi: 'who', quando: 'when', 'perché': 'why',
  come: 'how', quale: 'what', quanto: 'how much', quanti: 'how many',
  'chi è': 'who', "cos'è": 'what', "dov'è": 'where', 'perché no': 'why',
  'come mai': 'why', 'che cosa': 'what', 'quanto costa': 'how much',
  'a che ora': 'when', vero: 'right', 'e poi': 'then',
  'di chi': 'who',

  // little words
  il: 'the', un: 'a', una: 'a', i: 'the', e: 'and', o: 'or', ma: 'but',
  a: 'to', in: 'in', con: 'with', per: 'for', su: 'on', da: 'from',
  di: 'of', tra: 'with', senza: 'none', sopra: 'over', sotto: 'under',
  dentro: 'inside', fuori: 'outside', vicino: 'at', qui: 'here', 'lì': 'there', anche: 'too', ancora: 'again', 'già': 'done',
  se: 'if', che: 'that', non: 'not', 'più': 'more', 'sì': 'yes', no: 'no',

  // time
  adesso: 'now', dopo: 'after', prima: 'before', oggi: 'today',
  domani: 'tomorrow', ieri: 'yesterday', mattina: 'morning',
  pomeriggio: 'afternoon', sera: 'night', notte: 'night', tardi: 'late', sempre: 'always', mai: 'never', 'a volte': 'sometimes',
  subito: 'now', minuto: 'minute', ora: 'hour', giorno: 'day',
  settimana: 'week', // quantity
  tanto: 'lots', poco: 'few', 'un altro': 'another', troppo: 'lots', 'metà': 'half', uno: 'one', due: 'two', tre: 'three',
  quattro: 'four', cinque: 'five', sei: 'two', tanti: 'many',

  // food
  pane: 'bread', pizza: 'pizza', mela: 'apple',
  banana: 'banana', biscotto: 'cookie', formaggio: 'cheese', riso: 'rice',
  zuppa: 'soup', gelato: 'ice', fame: 'hungry',
  patatine: 'potato', uovo: 'egg', pollo: 'chicken', pesce: 'fish',
  verdura: 'carrot', frutta: 'apple', // drinks
  acqua: 'water', latte: 'milk', succo: 'juice', 'tè': 'tea',
  'caffè': 'coffee', bibita: 'soda', bicchiere: 'glass', cannuccia: 'straw',
  limonata: 'lemonade', tazza: 'cup', sete: 'thirsty',
  bottiglia: 'bottle', ghiaccio: 'ice', tisana: 'tea', spremuta: 'juice',
  frullato: 'smoothie', aranciata: 'soda', borraccia: 'bottle',

  // play
  palla: 'ball', gioco: 'game', musica: 'music', libro: 'book',
  altalena: 'swing', bolle: 'bubbles', puzzle: 'puzzle', macchinina: 'car',
  bambola: 'doll', nascondino: 'game', tablet: 'computer',
  televisione: 'tv', film: 'tv', canzone: 'music', pallone: 'ball',
  scivolo: 'slide', sabbia: 'sand',
  costruzioni: 'blocks',

  // people
  mamma: 'mom', 'papà': 'dad', nonna: 'grandma', nonno: 'grandpa',
  fratello: 'brother', sorella: 'sister', amico: 'friend', amica: 'friend',
  maestra: 'teacher', dottore: 'doctor', bambino: 'boy', bambina: 'girl',
  famiglia: 'family', zia: 'woman', zio: 'man', cugino: 'cousin',
  signora: 'woman', signore: 'man', compagno: 'friend',

  // places
  casa: 'home', scuola: 'school', bagno: 'bathroom', cucina: 'kitchen',
  camera: 'bedroom', parco: 'park', negozio: 'store', macchina: 'car',
  giardino: 'garden', ospedale: 'hospital', spiaggia: 'beach',
  piscina: 'pool', strada: 'road', ristorante: 'restaurant', // school
  classe: 'class', quaderno: 'paper', matita: 'pencil', banco: 'desk',
  zaino: 'backpack', compiti: 'homework', ricreazione: 'recess',
  mensa: 'lunch', colla: 'art',
  forbici: 'scissors', penna: 'pencil',
  pennarello: 'paint', foglio: 'paper', palestra: 'playground',
  // body
  testa: 'head', mano: 'hands', piede: 'feet', pancia: 'tummy',
  occhio: 'eyes', orecchio: 'ears', bocca: 'mouth', naso: 'nose',
  braccio: 'arm', gamba: 'leg', capelli: 'hair', dente: 'teeth',
  schiena: 'back', dito: 'fingers', spalla: 'shoulder',
  collo: 'neck', faccia: 'head', // animals
  cane: 'dog', gatto: 'cat', uccello: 'bird', cavallo: 'horse',
  mucca: 'cow', maiale: 'pig', pecora: 'sheep', coniglio: 'rabbit',
  leone: 'lion', elefante: 'elephant', scimmia: 'monkey',
  orso: 'bear', serpente: 'snake', anatra: 'duck', gallina: 'chicken',

  // clothes
  maglietta: 'shirt', pantaloni: 'pants', scarpe: 'shoes',
  calzini: 'socks', giacca: 'jacket', cappello: 'hat', vestito: 'dress',
  gonna: 'skirt', maglione: 'sweater', guanti: 'gloves',
  sciarpa: 'scarf', stivali: 'boots', cappotto: 'coat', zip: 'zipper', bottone: 'button', costume: 'swim', // house
  letto: 'bed', sedia: 'chair', tavolo: 'table', porta: 'door',
  finestra: 'window', luce: 'light', divano: 'couch', doccia: 'bathroom',
  sapone: 'wash', asciugamano: 'towel', spazzolino: 'teeth',
  pettine: 'hair', coperta: 'blanket', cuscino: 'pillow', coltello: 'cut',
  frigorifero: 'fridge',

  // weather
  sole: 'sunny', pioggia: 'rainy', neve: 'snow', vento: 'windy',
  nuvola: 'cloudy', temporale: 'rainy', arcobaleno: 'rainbow',
  nebbia: 'cloudy', ombrello: 'umbrella', cielo: 'sky',
}

const labels = new Set()
for (const layout of Object.values(boards.sizes)) {
  for (const [label] of layout.core) labels.add(label)
  for (const [topic, words] of Object.entries(layout.topics)) {
    labels.add(topic)
    for (const [label] of words) labels.add(label)
  }
}

const map = {}
const unmapped = []
const brokenConcepts = []

for (const label of [...labels].sort((a, b) => a.localeCompare(b, 'it'))) {
  const concept = CONCEPT[label]
  if (!concept) {
    unmapped.push(label)
    continue
  }
  const id = english[concept]
  if (!id) {
    brokenConcepts.push(`${label} → ${concept}`)
    continue
  }
  map[label] = id
}

if (brokenConcepts.length) {
  console.error(
    `Concepts not present in seedSymbolMap.json:\n  ${brokenConcepts.join('\n  ')}`,
  )
  process.exit(1)
}

await writeFile(
  join(dataDir, 'seedSymbolMap.it.json'),
  `${JSON.stringify(map, null, 2)}\n`,
  'utf8',
)

const coverage = ((Object.keys(map).length / labels.size) * 100).toFixed(1)
console.log(
  `${Object.keys(map).length} of ${labels.size} Italian labels mapped (${coverage}%)`,
)
console.log(`\nText-only (no symbol): ${unmapped.length}`)
console.log(unmapped.join(', '))
