// Generates src/data/seedSymbolMap.es.json — Spanish label → ARASAAC id.
//
// ARASAAC pictogram ids are language-neutral: the picture for `arasaac:2617`
// is the same whether the button under it reads "I" or "yo". So rather than
// re-running the symbol pipeline against the Spanish ARASAAC index (a 20 MB
// network fetch that would produce the same ids), this maps each Spanish
// board label to the English concept already curated in seedSymbolMap.json
// and reuses its id.
//
// Words with no equivalent concept are left unmapped and render as text —
// conventional in AAC for function words, and the same thing the English
// boards do for words the pipeline could not match.
//
// Usage: node scripts/vocabulary/build-spanish-symbols.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, '..', '..', 'src', 'data')

const english = JSON.parse(await readFile(join(dataDir, 'seedSymbolMap.json'), 'utf8'))
const boards = JSON.parse(await readFile(join(dataDir, 'coreWords.es.json'), 'utf8'))

// Spanish board label → the English concept key in seedSymbolMap.json.
// Only concepts that actually exist there are worth listing.
const CONCEPT = {
  // page / topic names
  Acciones: 'Actions', Animales: 'Animals', Cuerpo: 'Body', Ropa: 'Clothes',
  Describir: 'Describing', Bebidas: 'Drinks', Sentimientos: 'Feelings',
  Comida: 'Food', 'Palabras de apoyo': 'Helping Words', Casa: 'House',
  'Palabras pequeñas': 'Little Words', Personas: 'People', Lugares: 'Places',
  Jugar: 'Play', Pronombres: 'Pronouns', Cantidad: 'Quantity',
  Preguntas: 'Questions', Colegio: 'School', Social: 'Social', Tiempo: 'Time',
  Clima: 'Weather', Palabras: 'Little Words',

  // pronouns and deixis
  yo: 'I', tú: 'you', él: 'he', ella: 'she', nosotros: 'we', ellos: 'they',
  ellas: 'they', mi: 'my', mío: 'mine', tuyo: 'yours', su: 'her',
  nuestro: 'our', eso: 'that', esto: 'this', este: 'this', esta: 'this',
  ese: 'that', esa: 'that', aquel: 'that', usted: 'you',
  alguien: 'someone', nadie: 'nobody',
  algo: 'some', nada: 'nothing', todos: 'everyone', me: 'me', otro: 'other',

  // core verbs
  quiero: 'want', necesito: 'need', gusta: 'like', tengo: 'have',
  ir: 'go', ayuda: 'help', parar: 'stop', hacer: 'do', mira: 'look',
  comer: 'eat', beber: 'drink', dormir: 'sleep', jugar: 'play',
  abrir: 'open', cerrar: 'close', dar: 'give', coger: 'take', poner: 'put',
  lavar: 'wash', leer: 'read', escribir: 'write', cantar: 'sing',
  bailar: 'dance', correr: 'run', saltar: 'jump', sentarse: 'sit',
  esperar: 'wait', buscar: 'look', encontrar: 'get', tirar: 'throw',
  empujar: 'push', abrazar: 'hug', pintar: 'paint', cortar: 'cut',
  limpiar: 'clean', escuchar: 'listen', hablar: 'talk', venir: 'come',
  salir: 'out', subir: 'up', bajar: 'down', quitar: 'take',
  ponerse: 'put', quitarse: 'take', duele: 'hurt', entrar: 'inside',

  // copulas / auxiliaries — one picture per lemma
  es: 'be', está: 'be', soy: 'be', estoy: 'be', eres: 'be', estás: 'be',
  somos: 'be', estamos: 'be', son: 'be', están: 'be', era: 'be',
  estaba: 'be', fue: 'be', estuvo: 'be', hay: 'be',
  tienes: 'have', tiene: 'have', tenemos: 'have', tienen: 'have',
  puedo: 'can', puedes: 'can', puede: 'can', podemos: 'can',
  quiere: 'want', queremos: 'want', quieren: 'want',
  he: 'have', has: 'have', ha: 'have', hemos: 'have',
  'voy a': 'go', 'vas a': 'go', 'va a': 'go', 'vamos a': 'go',

  // polarity, social
  sí: 'yes', no: 'no', 'por favor': 'please', gracias: 'thanks',
  hola: 'hello', adiós: 'goodbye', perdón: 'sorry', 'lo siento': 'sorry',
  vale: 'okay', 'buenos días': 'morning', 'buenas noches': 'night',
  'buenas tardes': 'afternoon', 'hasta luego': 'see you later',
  'te quiero': 'love', 'qué tal': 'how', quizá: 'maybe', claro: 'yes',
  'me toca': 'my turn', 'otra vez': 'again',
  'ya está': 'done', espera: 'wait', 'no sé': "i don't know",
  'qué gracioso': 'funny', felicidades: 'surprised', 'de nada': 'welcome',

  // questions
  qué: 'what', quién: 'who', dónde: 'where', cuándo: 'when', cómo: 'how',
  'por qué': 'why', cuánto: 'how much', cuántos: 'how many', adónde: 'where',
  'con quién': 'who', 'de quién': 'who', 'para qué': 'why',
  'qué es': 'what', 'quién es': 'who', 'dónde está': 'where',
  cuál: 'what', 'cuánto falta': 'how much',

  // little words
  en: 'in', a: 'to', con: 'with', de: 'of', para: 'for', por: 'for',
  y: 'and', pero: 'but', o: 'or', porque: 'because',
  si: 'if', que: 'that', arriba: 'up', abajo: 'down', dentro: 'inside',
  fuera: 'outside', sobre: 'over', debajo: 'under', aquí: 'here',
  allí: 'there', el: 'the', la: 'the', un: 'a', una: 'a', más: 'more',
  también: 'too', ya: 'now', menos: 'few',

  // time
  ahora: 'now', después: 'later', antes: 'before', hoy: 'today',
  mañana: 'tomorrow', ayer: 'yesterday', siempre: 'always', nunca: 'never',
  tarde: 'late', hora: 'hour', día: 'day', semana: 'week',
  'por la mañana': 'morning', 'por la tarde': 'afternoon',
  'por la noche': 'night', minuto: 'minute',
  uno: 'one', dos: 'two', tres: 'three', cuatro: 'four', cinco: 'five',

  // describing
  grande: 'big', pequeño: 'little', bueno: 'good', malo: 'bad',
  bonito: 'pretty', rápido: 'fast', lento: 'slow', caliente: 'hot',
  frío: 'cold', limpio: 'clean', sucio: 'dirty', nuevo: 'new', viejo: 'old',
  alto: 'tall', bajo: 'short', largo: 'long', corto: 'short',
  suave: 'soft', lleno: 'full', vacío: 'empty', roto: 'broken',
  igual: 'same', diferente: 'different', blando: 'soft',
  mucho: 'lots', poco: 'little', todo: 'all', muchos: 'many',
  medio: 'half', ninguno: 'none', pocos: 'few',

  // feelings
  feliz: 'happy', triste: 'sad', enfadado: 'angry', cansado: 'tired',
  asustado: 'scared', nervioso: 'nervous', enfermo: 'sick',
  contento: 'happy', tranquilo: 'calm', aburrido: 'bored',
  orgulloso: 'proud', preocupado: 'worried', emocionado: 'excited',
  sorprendido: 'surprised', solo: 'lonely', seguro: 'safe',
  confundido: 'confused',
  valiente: 'brave', hambre: 'hungry', sed: 'thirsty',
  hambriento: 'hungry', sediento: 'thirsty', cómodo: 'comfortable',
  dolorido: 'hurt',

  // food and drink
  galleta: 'cookie', manzana: 'apple', plátano: 'banana', pan: 'bread',
  pizza: 'pizza', queso: 'cheese', bocadillo: 'sandwich', arroz: 'rice',
  yogur: 'yogurt', cereales: 'cereal', huevo: 'egg', pollo: 'chicken',
  sopa: 'soup', patatas: 'potato', naranja: 'orange', agua: 'water',
  leche: 'milk', zumo: 'juice', batido: 'smoothie', té: 'tea',
  refresco: 'soda', limonada: 'lemonade', café: 'coffee', vaso: 'glass',
  taza: 'cup', botella: 'bottle', pajita: 'straw', comida: 'lunch',
  hielo: 'ice', cantimplora: 'bottle',

  // play, people, places, school, body
  pelota: 'ball', muñeca: 'doll', coche: 'car', bloques: 'blocks',
  libro: 'book', música: 'music', burbujas: 'bubbles', columpio: 'swing',
  puzle: 'puzzle', parque: 'park', tobogán: 'slide',
  juego: 'game', peluche: 'toy', baile: 'dance',
  mamá: 'mom', papá: 'dad', hermano: 'brother', hermana: 'sister',
  abuelo: 'grandpa', abuela: 'grandma', amigo: 'friend', amiga: 'friend',
  profe: 'teacher', bebé: 'baby', niño: 'boy', niña: 'girl',
  médico: 'doctor', familia: 'family', vecino: 'neighbor',
  enfermera: 'nurse', compañero: 'friend', primo: 'cousin',
  casa: 'home', colegio: 'school', baño: 'bathroom', cocina: 'kitchen',
  tienda: 'store', calle: 'road', playa: 'beach', hospital: 'hospital',
  ciudad: 'city', biblioteca: 'library', jardín: 'garden', piscina: 'pool',
  campo: 'farm', restaurante: 'restaurant',
  clase: 'class', lápiz: 'pencil', papel: 'paper', mesa: 'table',
  silla: 'chair', mochila: 'backpack', recreo: 'recess', deberes: 'homework',
  tijeras: 'scissors', pintura: 'paint', ordenador: 'computer',
  cabeza: 'head', mano: 'hands', pie: 'feet', ojo: 'eyes', boca: 'mouth',
  nariz: 'nose', oreja: 'ears', brazo: 'arm', pierna: 'leg', pelo: 'hair',
  diente: 'teeth', barriga: 'tummy', dedo: 'fingers', cuello: 'neck',
  hombro: 'shoulder', espalda: 'back',

  // animals, clothes, house, weather
  perro: 'dog', gato: 'cat', pájaro: 'bird', pez: 'fish', caballo: 'horse',
  vaca: 'cow', cerdo: 'pig', oveja: 'sheep', conejo: 'rabbit',
  oso: 'bear', león: 'lion', elefante: 'elephant', mono: 'monkey',
  tortuga: 'turtle', pato: 'duck',
  camiseta: 'shirt', pantalón: 'pants', zapatos: 'shoes',
  calcetines: 'socks', abrigo: 'coat', vestido: 'dress', falda: 'skirt',
  jersey: 'sweater', gorro: 'hat', bufanda: 'scarf', guantes: 'gloves',
  botas: 'boots', botón: 'button',
  cama: 'bed', puerta: 'door', ventana: 'window', sofá: 'couch',
  ducha: 'water', manta: 'blanket', almohada: 'pillow', nevera: 'fridge',
  jabón: 'clean', toalla: 'towel', luz: 'light', televisión: 'tv',
  sol: 'sunny', lluvia: 'rainy', nieve: 'snow', viento: 'windy',
  nube: 'cloudy', calor: 'hot', tormenta: 'rainy', soleado: 'sunny',
  nublado: 'cloudy', lloviendo: 'rainy', nevando: 'snowy',
  arcoíris: 'rainbow', paraguas: 'umbrella',
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

for (const label of [...labels].sort((a, b) => a.localeCompare(b, 'es'))) {
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
  join(dataDir, 'seedSymbolMap.es.json'),
  `${JSON.stringify(map, null, 2)}\n`,
  'utf8',
)

const coverage = ((Object.keys(map).length / labels.size) * 100).toFixed(1)
console.log(
  `${Object.keys(map).length} of ${labels.size} Spanish labels mapped (${coverage}%)`,
)
console.log(`\nText-only (no symbol): ${unmapped.length}`)
console.log(unmapped.join(', '))
