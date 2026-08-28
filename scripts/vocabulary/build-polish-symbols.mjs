// Generates src/data/seedSymbolMap.pl.json — Polish label → ARASAAC id.
//
// Same approach as the Spanish map: ARASAAC pictogram ids are language-neutral,
// so each Polish board label maps to the English concept already curated in
// seedSymbolMap.json and reuses its id. Words with no equivalent concept are
// left unmapped and render as text — conventional in AAC for function words.
//
// Usage: node scripts/vocabulary/build-polish-symbols.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, '..', '..', 'src', 'data')

const english = JSON.parse(await readFile(join(dataDir, 'seedSymbolMap.json'), 'utf8'))
const boards = JSON.parse(await readFile(join(dataDir, 'coreWords.pl.json'), 'utf8'))

// Polish board label → the English concept key in seedSymbolMap.json.
const CONCEPT = {
  // page / topic names
  Czynności: 'Actions', Zwierzęta: 'Animals', Ciało: 'Body', Ubrania: 'Clothes',
  Opisy: 'Describing', Picie: 'Drinks', Uczucia: 'Feelings', Jedzenie: 'Food',
  'Słowa pomocnicze': 'Helping Words', Mieszkanie: 'House',
  'Małe słowa': 'Little Words', Ludzie: 'People', Miejsca: 'Places',
  Zabawa: 'Play', Zaimki: 'Pronouns', Ilość: 'Quantity', Pytania: 'Questions',
  Szkoła: 'School', Grzeczność: 'Social', Czas: 'Time', Pogoda: 'Weather',
  Słowa: 'Little Words',

  // pronouns and deixis
  ja: 'I', ty: 'you', on: 'he', ona: 'she', my: 'we', wy: 'you',
  oni: 'they', one: 'they', to: 'this', tamto: 'that', ten: 'this',
  ta: 'this', tamten: 'that', mój: 'my', moja: 'my', moje: 'my',
  twój: 'your', twoja: 'your', nasz: 'our', jego: 'his', jej: 'her',
  mnie: 'me', mi: 'me', ktoś: 'someone', nikt: 'nobody', coś: 'some',
  nic: 'nothing', wszyscy: 'everyone', każdy: 'all', inny: 'other',

  // core verbs
  chcę: 'want', potrzebuję: 'need', lubię: 'like', mam: 'have',
  jest: 'be', są: 'be', mogę: 'can', robić: 'do', iść: 'go',
  pomoc: 'help', stop: 'stop', patrz: 'look',
  jeść: 'eat', pić: 'drink', spać: 'sleep', bawić: 'play',
  otworzyć: 'open', zamknąć: 'close', dać: 'give', brać: 'take',
  czytać: 'read', pisać: 'write', śpiewać: 'sing', tańczyć: 'dance',
  myć: 'wash', siedzieć: 'sit', biegać: 'run', skakać: 'jump',
  czekać: 'wait', szukać: 'look', słuchać: 'listen', mówić: 'talk',
  prosić: 'please', pomóc: 'help', widzieć: 'see', rysować: 'draw',
  ciąć: 'cut', sprzątać: 'clean', przytulić: 'hug', rzucać: 'throw',
  pchać: 'push', kończyć: 'done', boli: 'hurt', pada: 'rainy',
  ubrać: 'put', zdjąć: 'take', wiedzieć: 'know', wracać: 'back',

  // być / mieć / móc — one picture per lemma
  jestem: 'be', jesteś: 'be', jesteśmy: 'be', jesteście: 'be',
  byłem: 'be', byłam: 'be', był: 'be', była: 'be', było: 'be',
  będzie: 'be', będę: 'be', będziemy: 'be',
  masz: 'have', ma: 'have', mamy: 'have', 'nie ma': 'have',
  możesz: 'can', może: 'can', możemy: 'can', mogą: 'can',
  muszę: 'need', musisz: 'need', trzeba: 'need', chcesz: 'want', chce: 'want',
  chcemy: 'want', lubisz: 'like', lubi: 'like',

  // polarity and social
  tak: 'yes', nie: 'no', cześć: 'hello', 'dzień dobry': 'morning',
  'do widzenia': 'goodbye', dziękuję: 'thanks', proszę: 'please',
  przepraszam: 'sorry', dobranoc: 'night', 'kocham cię': 'love',
  'na razie': 'see you later', 'moja kolej': 'my turn',
  jasne: 'yes', 'jeszcze raz': 'again',
  zobacz: 'look', śmieszne: 'funny', poczekaj: 'wait',
  'nie wiem': "i don't know", dobrze: 'okay',
  'wszystkiego najlepszego': 'surprised', 'proszę bardzo': 'welcome',
  'jak się masz': 'how',

  // questions
  co: 'what', kto: 'who', gdzie: 'where', kiedy: 'when', jak: 'how',
  dlaczego: 'why', który: 'what', ile: 'how many', dokąd: 'where',
  'po co': 'why', 'z kim': 'who', 'co to': 'what', 'kto to': 'who',
  'gdzie jest': 'where', czyj: 'who', skąd: 'where', 'jak długo': 'how much',

  // little words
  w: 'in', na: 'on', do: 'to', z: 'with', od: 'from', dla: 'for',
  i: 'and', albo: 'or', ale: 'but', bo: 'because', że: 'that',
  jeśli: 'if', pod: 'under', nad: 'over', przed: 'before', za: 'after',
  blisko: 'here', daleko: 'there', tu: 'here', tam: 'there',
  'w górę': 'up', 'w dół': 'down', 'do środka': 'inside',
  'na zewnątrz': 'outside', bez: 'of', po: 'after', też: 'too',
  razem: 'together', znowu: 'again', jeszcze: 'more', się: 'itself',

  // time
  teraz: 'now', potem: 'later', przedtem: 'before', dziś: 'today',
  jutro: 'tomorrow', wczoraj: 'yesterday', zawsze: 'always',
  nigdy: 'never', późno: 'late', rano: 'morning',
  'po południu': 'afternoon', wieczorem: 'night', 'w nocy': 'night',
  godzina: 'hour', dzień: 'day', tydzień: 'week', minuta: 'minute',

  // describing
  duży: 'big', mały: 'little', dobry: 'good', zły: 'bad', ładny: 'pretty',
  szybki: 'fast', wolny: 'slow', gorący: 'hot', zimny: 'cold',
  czysty: 'clean', brudny: 'dirty', nowy: 'new', stary: 'old',
  wysoki: 'tall', niski: 'short', długi: 'long', krótki: 'short',
  miękki: 'soft', pełny: 'full', pusty: 'empty', zepsuty: 'broken',
  'taki sam': 'same', głośny: 'loud', ciepło: 'warm', zimno: 'cold',
  dużo: 'lots', mało: 'little', wszystko: 'all', trochę: 'some',
  mniej: 'few', więcej: 'more', pół: 'half', jeden: 'one', dwa: 'two',
  trzy: 'three', cztery: 'four', pięć: 'five', kilka: 'many',
  żaden: 'none', cały: 'all', sam: 'alone',

  // feelings
  wesoły: 'happy', smutny: 'sad', zmęczony: 'tired',
  przestraszony: 'scared', chory: 'sick', spokojny: 'calm',
  znudzony: 'bored', dumny: 'proud', zdenerwowany: 'nervous',
  głodny: 'hungry', spragniony: 'thirsty', szczęśliwy: 'happy',
  zaskoczony: 'surprised', samotny: 'lonely', bezpieczny: 'safe',
  odważny: 'brave', zdziwiony: 'surprised', podekscytowany: 'excited',
  senny: 'tired', lepiej: 'good', wygodnie: 'comfortable',

  // food and drink
  ciastko: 'cookie', jabłko: 'apple', banan: 'banana', chleb: 'bread',
  pizza: 'pizza', ser: 'cheese', kanapka: 'sandwich', zupa: 'soup',
  jajko: 'egg', ryż: 'rice', kurczak: 'chicken', ziemniak: 'potato',
  marchewka: 'carrot', obiad: 'lunch', woda: 'water', mleko: 'milk',
  sok: 'juice', herbata: 'tea', kubek: 'cup', szklanka: 'glass',
  butelka: 'bottle', słomka: 'straw', lód: 'ice', kawa: 'coffee',
  lemoniada: 'lemonade',

  // play, people, places, school, body
  piłka: 'ball', lalka: 'doll', samochód: 'car', klocki: 'blocks',
  książka: 'book', muzyka: 'music', bańki: 'bubbles',
  huśtawka: 'swing', puzzle: 'puzzle', park: 'park',
  zjeżdżalnia: 'slide', gra: 'game', miś: 'bear', zabawka: 'toy',
  taniec: 'dance',
  mama: 'mom', tata: 'dad', brat: 'brother', siostra: 'sister',
  babcia: 'grandma', dziadek: 'grandpa', kolega: 'friend',
  koleżanka: 'friend', pani: 'teacher', pan: 'man', dziecko: 'kid',
  lekarz: 'doctor', rodzina: 'family', sąsiad: 'neighbor',
  pielęgniarka: 'nurse', przyjaciel: 'friend', kuzyn: 'cousin',
  dom: 'home', szkoła: 'school', łazienka: 'bathroom', kuchnia: 'kitchen',
  sklep: 'store', ulica: 'road', plaża: 'beach',
  szpital: 'hospital', miasto: 'city', ogród: 'garden', basen: 'pool',
  las: 'farm', 'plac zabaw': 'playground', biblioteka: 'library',
  restauracja: 'restaurant',
  klasa: 'class', ołówek: 'pencil', papier: 'paper', stół: 'table',
  krzesło: 'chair', plecak: 'backpack', przerwa: 'recess',
  zadanie: 'homework', nożyczki: 'scissors', komputer: 'computer',
  nauczyciel: 'teacher',
  głowa: 'head', ręka: 'hands', noga: 'leg', oko: 'eyes', usta: 'mouth',
  nos: 'nose', ucho: 'ears', włosy: 'hair', ząb: 'teeth',
  brzuch: 'tummy', palec: 'fingers', plecy: 'back', szyja: 'neck',
  ramię: 'shoulder', stopa: 'feet',

  // animals, clothes, home, weather
  pies: 'dog', kot: 'cat', ptak: 'bird', ryba: 'fish', koń: 'horse',
  krowa: 'cow', świnia: 'pig', owca: 'sheep', królik: 'rabbit',
  niedźwiedź: 'bear', lew: 'lion', słoń: 'elephant', małpa: 'monkey',
  żółw: 'turtle', kaczka: 'duck', kura: 'chicken',
  koszulka: 'shirt', spodnie: 'pants', buty: 'shoes',
  skarpetki: 'socks', kurtka: 'coat', sukienka: 'dress',
  spódnica: 'skirt', sweter: 'sweater', czapka: 'hat', szalik: 'scarf',
  rękawiczki: 'gloves', kalosze: 'boots', guzik: 'button',
  łóżko: 'bed', drzwi: 'door', okno: 'window', kanapa: 'couch',
  prysznic: 'water', koc: 'blanket', poduszka: 'pillow',
  lodówka: 'fridge', mydło: 'clean', ręcznik: 'towel',
  światło: 'light', telewizor: 'tv',
  słońce: 'sunny', deszcz: 'rainy', śnieg: 'snow', wiatr: 'windy',
  chmura: 'cloudy', burza: 'rainy', słonecznie: 'sunny',
  pochmurno: 'cloudy', tęcza: 'rainbow', parasol: 'umbrella',
}

// ---- build -----------------------------------------------------------------

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

for (const label of [...labels].sort((a, b) => a.localeCompare(b, 'pl'))) {
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
  join(dataDir, 'seedSymbolMap.pl.json'),
  `${JSON.stringify(map, null, 2)}\n`,
  'utf8',
)

const coverage = ((Object.keys(map).length / labels.size) * 100).toFixed(1)
console.log(
  `${Object.keys(map).length} of ${labels.size} Polish labels mapped (${coverage}%)`,
)
console.log(`\nText-only (no symbol): ${unmapped.length}`)
console.log(unmapped.join(', '))
