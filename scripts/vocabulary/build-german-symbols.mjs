// Generates src/data/seedSymbolMap.de.json — German label → ARASAAC id.
//
// ARASAAC pictogram ids are language-neutral: the picture for `arasaac:2617`
// is the same whether the button under it reads "I" or "ich". So rather than
// re-running the symbol pipeline against the German ARASAAC index (a 20 MB
// network fetch that would produce the same ids), this maps each German board
// label to the English concept already curated in seedSymbolMap.json and
// reuses its id.
//
// Words with no equivalent concept are left unmapped and render as text —
// conventional in AAC for function words, and better than a near-miss: a
// wrong picture is worse than no picture, because the learner memorises the
// image rather than the word beneath it.
//
// Usage: node scripts/vocabulary/build-german-symbols.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, '..', '..', 'src', 'data')

const english = JSON.parse(await readFile(join(dataDir, 'seedSymbolMap.json'), 'utf8'))
const boards = JSON.parse(await readFile(join(dataDir, 'coreWords.de.json'), 'utf8'))

// German board label → the English concept key in seedSymbolMap.json.
const CONCEPT = {
  // page / topic names
  Tun: 'Actions', Tiere: 'Animals', Körper: 'Body', Kleidung: 'Clothes',
  Beschreiben: 'Describing', Trinken: 'Drinks', Gefühle: 'Feelings',
  Essen: 'Food', Hilfswörter: 'Helping Words', 'Zu Hause': 'House',
  Kleine: 'Little Words', Menschen: 'People', Orte: 'Places',
  Spielen: 'Play', Fürwörter: 'Pronouns', Menge: 'Quantity',
  Fragen: 'Questions', Schule: 'School', Soziales: 'Social', Zeit: 'Time',
  Wetter: 'Weather', Wörter: 'Little Words',

  // pronouns and deixis
  ich: 'I', du: 'you', er: 'he', sie: 'she', es: 'it', wir: 'we',
  ihr: 'you', das: 'that', dieser: 'this', diese: 'this', dieses: 'this',
  jener: 'that', mein: 'my', dein: 'your', sein: 'his', unser: 'our',
  mich: 'me', mir: 'me', dich: 'you', dir: 'you', uns: 'us', euch: 'you',
  ihn: 'him', ihm: 'him', jemand: 'someone', niemand: 'nobody',
  etwas: 'some', nichts: 'nothing', alle: 'everyone', alles: 'all',
  andere: 'other', selbst: 'itself', jeder: 'everyone', beide: 'both',
  wen: 'who', wem: 'who',

  // core verbs
  will: 'want', möchte: 'want', mag: 'like', habe: 'have', ist: 'be',
  kann: 'can', muss: 'need', machen: 'do', gehen: 'go', Hilfe: 'help',
  stopp: 'stop', schau: 'look', essen: 'eat', trinken: 'drink',
  schlafen: 'sleep', spielen: 'play', aufmachen: 'open', zumachen: 'close',
  geben: 'give', nehmen: 'take', legen: 'put', waschen: 'wash',
  lesen: 'read', schreiben: 'write', singen: 'sing', tanzen: 'dance',
  laufen: 'run', springen: 'jump', sitzen: 'sit', aufstehen: 'up',
  kommen: 'come', anziehen: 'put', ausziehen: 'take', suchen: 'look',
  finden: 'get', hören: 'listen', anfassen: 'feel', warten: 'wait',
  aufhören: 'stop', kaufen: 'store', putzen: 'clean', kochen: 'cook',
  malen: 'paint', bauen: 'build', helfen: 'help',

  // sein / haben / werden / modals — one picture per lemma
  bin: 'be', bist: 'be', sind: 'be', seid: 'be', war: 'be', waren: 'be',
  hat: 'have', hast: 'have', haben: 'have', wird: 'will', werden: 'will',
  darf: 'can', soll: 'need', weiß: 'know', brauche: 'need',
  denke: 'think', glaube: 'think', hoffe: 'want', gehe: 'go',
  komme: 'come', bleibe: 'wait', 'weiß nicht': "i don't know",
  'lass uns': 'together',

  // describing
  groß: 'big', klein: 'little', schön: 'pretty', neu: 'new', alt: 'old',
  heiß: 'hot', kalt: 'cold', schnell: 'fast', langsam: 'slow',
  schmutzig: 'dirty', sauber: 'clean', gut: 'good', schlecht: 'bad',
  laut: 'loud', leise: 'quiet', weich: 'soft', lang: 'long',
  kurz: 'short', hoch: 'tall', voll: 'full', leer: 'empty',
  leicht: 'easy', richtig: 'right', falsch: 'wrong', lustig: 'funny',
  langweilig: 'bored', lieblings: 'favorite', fertig: 'ready',
  kaputt: 'broken', nass: 'wet', trocken: 'dry', warm: 'warm',

  // feelings
  froh: 'happy', glücklich: 'happy', traurig: 'sad', wütend: 'angry',
  müde: 'tired', krank: 'sick', ängstlich: 'scared', gelangweilt: 'bored',
  zufrieden: 'happy', besorgt: 'worried', allein: 'alone', einsam: 'lonely',
  stolz: 'proud', aufgeregt: 'excited', ruhig: 'quiet', nervös: 'nervous',
  überrascht: 'surprised', verwirrt: 'confused', enttäuscht: 'sad',
  peinlich: 'shy', frustriert: 'mad', sicher: 'safe', okay: 'okay',
  Schmerzen: 'hurt', Angst: 'scared', Durst: 'thirsty', Hunger: 'hungry',

  // social
  hallo: 'hi', tschüss: 'bye', danke: 'thanks', bitte: 'please',
  entschuldigung: 'sorry', 'wie geht es dir': 'how', 'guten Morgen': 'morning',
  'guten Abend': 'night', 'gute Nacht': 'night', 'bis später': 'see you later',
  'tut mir leid': 'sorry', willkommen: 'welcome', 'ich bin dran': 'my turn',
  'du bist dran': 'your', 'toll gemacht': 'high five', warte: 'wait',
  'schau mal': 'look', 'komm her': 'come', 'lass mich': 'leave me alone',
  'alles klar': 'okay', 'nicht okay': 'wrong', nochmal: 'again',
  'bis morgen': 'tomorrow', 'gern geschehen': 'welcome',
  'keine Ahnung': "i don't know",

  // questions
  was: 'what', wo: 'where', wer: 'who', wann: 'when', warum: 'why',
  wie: 'how', welche: 'what', 'wie viel': 'how much', 'wie viele': 'how many',
  'wer ist das': 'who', 'was ist das': 'what', 'wo ist': 'where',
  'warum nicht': 'why', wieso: 'why', wohin: 'where', woher: 'where',
  'darf ich': 'can', 'und dann': 'then',

  // little words
  der: 'the', die: 'the', dem: 'the', ein: 'a', eine: 'a', und: 'and',
  oder: 'or', aber: 'but', in: 'in', auf: 'on', mit: 'with', für: 'for',
  zu: 'to', an: 'at', von: 'from', bei: 'at', ohne: 'none', über: 'over',
  unter: 'under', vor: 'before', drinnen: 'inside', draußen: 'outside',
  hier: 'here', da: 'there', auch: 'too', noch: 'again', schon: 'done',
  weil: 'because', wenn: 'if', dass: 'that', sehr: 'very', nicht: 'not',
  mehr: 'more', ja: 'yes', nein: 'no',

  // time
  jetzt: 'now', später: 'later', vorher: 'before', heute: 'today',
  morgen: 'tomorrow', gestern: 'yesterday', Morgen: 'morning',
  Abend: 'night', Nacht: 'night', spät: 'late', immer: 'always',
  nie: 'never', manchmal: 'sometimes', sofort: 'now', Minute: 'minute',
  Stunde: 'hour', Tag: 'day', Woche: 'week',

  // quantity
  viel: 'lots', wenig: 'few', alles: 'all', 'noch eins': 'another',
  genug: 'full', 'zu viel': 'lots', halb: 'half', eins: 'one',
  zwei: 'two', drei: 'three', vier: 'four', fünf: 'five', viele: 'many',

  // food
  Brot: 'bread', Nudeln: 'rice', Pizza: 'pizza', Apfel: 'apple',
  Banane: 'banana', Keks: 'cookie', Käse: 'cheese', Reis: 'rice',
  Suppe: 'soup', Eis: 'ice', Pommes: 'potato', Ei: 'egg',
  Hähnchen: 'chicken', Fisch: 'fish', Gemüse: 'carrot', Obst: 'apple',
  Joghurt: 'yogurt',

  // drinks
  Wasser: 'water', Milch: 'milk', Saft: 'juice', Tee: 'tea',
  Kaffee: 'coffee', Limo: 'soda', Glas: 'glass', Strohhalm: 'straw',
  Flasche: 'bottle', Tasse: 'cup', Smoothie: 'smoothie',
  Apfelsaft: 'juice', Orangensaft: 'juice', Eiswürfel: 'ice',

  // play
  Ball: 'ball', Spiel: 'game', Musik: 'music', Buch: 'book',
  Schaukel: 'swing', Seifenblasen: 'bubbles', Puzzle: 'puzzle',
  Puppe: 'doll', Verstecken: 'game', Tablet: 'computer',
  Fernseher: 'tv', Film: 'tv', Lied: 'music', Fahrrad: 'car',
  Rutsche: 'slide', Sand: 'sand', Bausteine: 'blocks', Ballon: 'kite',

  // people
  Mama: 'mom', Papa: 'dad', Oma: 'grandma', Opa: 'grandpa',
  Bruder: 'brother', Schwester: 'sister', Freund: 'friend',
  Freundin: 'friend', Lehrerin: 'teacher', Arzt: 'doctor', Junge: 'boy',
  Mädchen: 'girl', Familie: 'family', Tante: 'woman', Onkel: 'man',
  Baby: 'baby', Frau: 'woman', Mann: 'man', Kind: 'kid',

  // places
  Haus: 'home', Schule: 'school', Bad: 'bathroom', Küche: 'kitchen',
  Zimmer: 'bedroom', Park: 'park', Laden: 'store', Auto: 'car',
  Garten: 'garden', Krankenhaus: 'hospital', Strand: 'beach',
  Schwimmbad: 'pool', Straße: 'road', Kino: 'tv', Restaurant: 'restaurant',
  Spielplatz: 'playground', Zoo: 'zoo',

  // school
  Klasse: 'class', Heft: 'paper', Stift: 'pencil', Tisch: 'desk',
  Rucksack: 'backpack', Hausaufgaben: 'homework', Pause: 'recess',
  Mensa: 'lunch', Kleber: 'art', Schere: 'scissors', Papier: 'paper',
  Turnhalle: 'playground', Stuhl: 'chair', Buchstaben: 'letters',
  Zahlen: 'numbers',

  // body
  Kopf: 'head', Hand: 'hands', Fuß: 'feet', Bauch: 'tummy', Auge: 'eyes',
  Ohr: 'ears', Mund: 'mouth', Nase: 'nose', Arm: 'arm', Bein: 'leg',
  Haar: 'hair', Zahn: 'teeth', Rücken: 'back', Finger: 'fingers',
  Schulter: 'shoulder', Hals: 'neck', Gesicht: 'head', Haut: 'skin',

  // animals
  Hund: 'dog', Katze: 'cat', Vogel: 'bird', Pferd: 'horse', Kuh: 'cow',
  Schwein: 'pig', Schaf: 'sheep', Hase: 'rabbit', Löwe: 'lion',
  Elefant: 'elephant', Affe: 'monkey', Bär: 'bear', Schlange: 'snake',
  Ente: 'duck', Huhn: 'chicken', Frosch: 'frog',

  // clothes
  Hemd: 'shirt', Hose: 'pants', Schuh: 'shoes', Socken: 'socks',
  Jacke: 'jacket', Mütze: 'hat', Kleid: 'dress', Rock: 'skirt',
  Pullover: 'sweater', Handschuhe: 'gloves', Schal: 'scarf',
  Stiefel: 'boots', Mantel: 'coat', Knopf: 'button',
  Reißverschluss: 'zipper', Badeanzug: 'swim',

  // house
  Bett: 'bed', Sofa: 'couch', Tür: 'door', Fenster: 'window',
  Licht: 'light', Dusche: 'bathroom', Seife: 'wash', Handtuch: 'towel',
  Zahnbürste: 'teeth', Kamm: 'hair', Decke: 'blanket', Kissen: 'pillow',
  Messer: 'cut', Kühlschrank: 'fridge', Treppe: 'stairs',

  // weather
  Sonne: 'sunny', Regen: 'rainy', Schnee: 'snow', Wind: 'windy',
  Wolke: 'cloudy', Gewitter: 'rainy', Regenbogen: 'rainbow',
  Nebel: 'cloudy', Regenschirm: 'umbrella', Himmel: 'sky',
  sonnig: 'sunny', windig: 'windy',
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

for (const label of [...labels].sort((a, b) => a.localeCompare(b, 'de'))) {
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
  join(dataDir, 'seedSymbolMap.de.json'),
  `${JSON.stringify(map, null, 2)}\n`,
  'utf8',
)

const coverage = ((Object.keys(map).length / labels.size) * 100).toFixed(1)
console.log(
  `${Object.keys(map).length} of ${labels.size} German labels mapped (${coverage}%)`,
)
console.log(`\nText-only (no symbol): ${unmapped.length}`)
console.log(unmapped.join(', '))
