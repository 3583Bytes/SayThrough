// Generates src/data/seedSymbolMap.pt.json — Portuguese label → ARASAAC id.
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
// Usage: node scripts/vocabulary/build-portuguese-symbols.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, '..', '..', 'src', 'data')

const english = JSON.parse(await readFile(join(dataDir, 'seedSymbolMap.json'), 'utf8'))
const boards = JSON.parse(await readFile(join(dataDir, 'coreWords.pt.json'), 'utf8'))

// Portuguese board label → the English concept key in seedSymbolMap.json.
const CONCEPT = {
  // page / topic names
  'Ações': 'Actions', Animais: 'Animals', Corpo: 'Body', Roupa: 'Clothes',
  Descrever: 'Describing', Bebida: 'Drinks', Sentimentos: 'Feelings',
  Comida: 'Food', 'Palavras de apoio': 'Helping Words', 'Em casa': 'House',
  Palavrinhas: 'Little Words', Pessoas: 'People', Lugares: 'Places',
  Brincar: 'Play', Pronomes: 'Pronouns', Quantidade: 'Quantity',
  Perguntas: 'Questions', Escola: 'School', Social: 'Social', Tempo: 'Time',
  Clima: 'Weather', Palavras: 'Little Words',

  // pronouns and deixis
  eu: 'I', 'você': 'you', ele: 'he', ela: 'she', 'nós': 'we',
  'vocês': 'you', eles: 'they', elas: 'they', 'a gente': 'we',
  isso: 'that', isto: 'this', este: 'this', esta: 'this', esse: 'that',
  essa: 'that', aquele: 'that', aquela: 'that', aquilo: 'that',
  meu: 'my', minha: 'my', seu: 'your', sua: 'your', nosso: 'our',
  dele: 'his', dela: 'her', me: 'me', mim: 'me', 'alguém': 'someone',
  'ninguém': 'nobody', algo: 'some', nada: 'nothing', todos: 'everyone',
  outro: 'other', mesmo: 'same',

  // core verbs
  quero: 'want', preciso: 'need', gosto: 'like', tenho: 'have',
  ir: 'go', ajuda: 'help', parar: 'stop', fazer: 'do', olha: 'look',
  comer: 'eat', beber: 'drink', dormir: 'sleep', brincar: 'play',
  abrir: 'open', fechar: 'close', dar: 'give', pegar: 'take',
  'pôr': 'put', lavar: 'wash', ler: 'read', escrever: 'write',
  cantar: 'sing', 'dançar': 'dance', correr: 'run', pular: 'jump',
  sentar: 'sit', esperar: 'wait', procurar: 'look', achar: 'get',
  jogar: 'throw', empurrar: 'push', 'abraçar': 'hug', pintar: 'paint',
  cortar: 'cut', limpar: 'clean', ouvir: 'listen', falar: 'talk',
  vir: 'come', sair: 'out', subir: 'up', descer: 'down', entrar: 'inside',
  tirar: 'take', vestir: 'put', 'dói': 'hurt', chovendo: 'rainy',

  // ser / estar / ter / poder / ir — one picture per lemma
  'é': 'be', 'está': 'be', sou: 'be', estou: 'be', somos: 'be',
  estamos: 'be', 'são': 'be', 'estão': 'be', era: 'be', estava: 'be',
  foi: 'be', esteve: 'be', 'vai ser': 'be', 'está sendo': 'be',
  tem: 'have', temos: 'have', 'têm': 'have', tinha: 'have', havia: 'have',
  posso: 'can', pode: 'can', podemos: 'can', podem: 'can', 'dá para': 'can',
  vou: 'go', vai: 'go', vamos: 'go', 'vão': 'go',
  quer: 'want', queremos: 'want', querem: 'want', 'tem que': 'need',
  'preciso de': 'need', acabou: 'done',

  // polarity and social
  sim: 'yes', 'não': 'no', 'por favor': 'please', obrigado: 'thanks',
  oi: 'hello', tchau: 'goodbye', desculpa: 'sorry', 'sinto muito': 'sorry',
  'tudo bem': 'okay', 'bom dia': 'morning', 'boa noite': 'night',
  'boa tarde': 'afternoon', 'até logo': 'see you later',
  'eu te amo': 'love', 'como vai': 'how', talvez: 'maybe', claro: 'yes',
  'minha vez': 'my turn', 'de novo': 'again',
  espera: 'wait', 'não sei': "i don't know", 'que engraçado': 'funny',
  'de nada': 'welcome', 'olha isso': 'look', 'parabéns': 'surprised',

  // questions
  'o que': 'what', quem: 'who', onde: 'where', quando: 'when', como: 'how',
  'por que': 'why', qual: 'what', quanto: 'how much', quantos: 'how many',
  'para onde': 'where', 'para que': 'why', 'com quem': 'who',
  'de quem': 'who', 'o que é': 'what', 'quem é': 'who', 'onde está': 'where',

  // little words
  em: 'in', a: 'to', com: 'with', de: 'of', para: 'for', por: 'for',
  e: 'and', mas: 'but', ou: 'or', porque: 'because', se: 'if',
  que: 'that', 'em cima': 'up', embaixo: 'down', dentro: 'inside',
  fora: 'outside', perto: 'here',
  longe: 'there', aqui: 'here', ali: 'there', o: 'the', um: 'a',
  uma: 'a', mais: 'more', 'também': 'too', 'já': 'now', menos: 'few',
  junto: 'together',

  // time
  agora: 'now', depois: 'later', antes: 'before', hoje: 'today',
  'amanhã': 'tomorrow', ontem: 'yesterday', sempre: 'always',
  nunca: 'never', tarde: 'late', hora: 'hour', dia: 'day',
  semana: 'week', minuto: 'minute', 'de manhã': 'morning',
  'de tarde': 'afternoon', 'de noite': 'night', 'mais tarde': 'later',

  // describing
  grande: 'big', pequeno: 'little', bom: 'good', ruim: 'bad',
  bonito: 'pretty', 'rápido': 'fast', devagar: 'slow',
  quente: 'hot', frio: 'cold', limpo: 'clean', sujo: 'dirty',
  novo: 'new', velho: 'old', alto: 'tall', baixo: 'short',
  longo: 'long', curto: 'short', macio: 'soft', cheio: 'full',
  vazio: 'empty', quebrado: 'broken', igual: 'same',
  diferente: 'different', barulhento: 'loud',
  muito: 'lots', pouco: 'little', tudo: 'all', muitos: 'many',
  metade: 'half', nenhum: 'none', poucos: 'few', cada: 'all',
  dois: 'two', 'três': 'three', quatro: 'four', cinco: 'five',

  // feelings
  feliz: 'happy', triste: 'sad', bravo: 'angry', cansado: 'tired',
  assustado: 'scared', nervoso: 'nervous', doente: 'sick',
  contente: 'happy', calmo: 'calm', entediado: 'bored',
  orgulhoso: 'proud', preocupado: 'worried', animado: 'excited',
  surpreso: 'surprised', sozinho: 'lonely', seguro: 'safe',
  corajoso: 'brave', 'com fome': 'hungry', 'com sede': 'thirsty',
  'com sono': 'tired', melhor: 'good', 'confortável': 'comfortable',
  fome: 'hungry', sede: 'thirsty', confuso: 'confused',

  // food and drink
  bolacha: 'cookie', 'maçã': 'apple', banana: 'banana', 'pão': 'bread',
  pizza: 'pizza', queijo: 'cheese', 'sanduíche': 'sandwich',
  arroz: 'rice', iogurte: 'yogurt', ovo: 'egg', frango: 'chicken',
  sopa: 'soup', batata: 'potato', laranja: 'orange', 'almoço': 'lunch',
  'água': 'water', leite: 'milk', suco: 'juice', vitamina: 'smoothie',
  'chá': 'tea', refrigerante: 'soda', limonada: 'lemonade',
  'café': 'coffee', gelo: 'ice', copo: 'glass', 'xícara': 'cup',
  garrafa: 'bottle', canudo: 'straw', garrafinha: 'bottle',
  gelado: 'cold',

  // play, people, places, school, body
  bola: 'ball', boneca: 'doll', carrinho: 'car', blocos: 'blocks',
  livro: 'book', 'música': 'music', bolha: 'bubbles',
  'balanço': 'swing', 'quebra-cabeça': 'puzzle', parque: 'park',
  escorregador: 'slide', jogo: 'game', 'pelúcia': 'toy',
  'dança': 'dance', brinquedo: 'toy', desenho: 'draw',
  'mamãe': 'mom', papai: 'dad', 'irmão': 'brother', 'irmã': 'sister',
  'vovô': 'grandpa', 'vovó': 'grandma', amigo: 'friend', amiga: 'friend',
  professora: 'teacher', 'bebê': 'baby', menino: 'boy', menina: 'girl',
  'médico': 'doctor', 'família': 'family', vizinho: 'neighbor',
  enfermeira: 'nurse', primo: 'cousin', colega: 'friend',
  casa: 'home', escola: 'school', banheiro: 'bathroom', cozinha: 'kitchen',
  loja: 'store', rua: 'road', praia: 'beach', hospital: 'hospital',
  cidade: 'city', quintal: 'garden', piscina: 'pool', carro: 'car',
  'sítio': 'farm', restaurante: 'restaurant', biblioteca: 'library',
  sala: 'class', 'lápis': 'pencil', papel: 'paper', mesa: 'table',
  cadeira: 'chair', mochila: 'backpack', recreio: 'recess',
  tarefa: 'homework', tesoura: 'scissors', computador: 'computer',
  aula: 'class',
  'cabeça': 'head', 'mão': 'hands', 'pé': 'feet', olho: 'eyes',
  boca: 'mouth', nariz: 'nose', orelha: 'ears', 'braço': 'arm',
  perna: 'leg', cabelo: 'hair', dente: 'teeth', barriga: 'tummy',
  dedo: 'fingers', costas: 'back', 'pescoço': 'neck',
  ombro: 'shoulder',

  // animals, clothes, home, weather
  cachorro: 'dog', gato: 'cat', passarinho: 'bird', peixe: 'fish',
  cavalo: 'horse', vaca: 'cow', porco: 'pig', ovelha: 'sheep',
  galinha: 'chicken', coelho: 'rabbit', urso: 'bear', 'leão': 'lion',
  elefante: 'elephant', macaco: 'monkey', tartaruga: 'turtle',
  pato: 'duck',
  camiseta: 'shirt', 'calça': 'pants', sapato: 'shoes', meia: 'socks',
  casaco: 'coat', vestido: 'dress', saia: 'skirt', blusa: 'sweater',
  'boné': 'hat', cachecol: 'scarf', luva: 'gloves', bota: 'boots',
  'botão': 'button', 'óculos': 'glass',
  cama: 'bed', porta: 'door', janela: 'window', 'sofá': 'couch',
  chuveiro: 'water', cobertor: 'blanket', travesseiro: 'pillow',
  geladeira: 'fridge', sabonete: 'clean', toalha: 'towel',
  luz: 'light', 'televisão': 'tv',
  sol: 'sunny', chuva: 'rainy', neve: 'snow', vento: 'windy',
  nuvem: 'cloudy', calor: 'hot', tempestade: 'rainy',
  ensolarado: 'sunny', nublado: 'cloudy', 'arco-íris': 'rainbow',
  'guarda-chuva': 'umbrella',
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

for (const label of [...labels].sort((a, b) => a.localeCompare(b, 'pt'))) {
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
  join(dataDir, 'seedSymbolMap.pt.json'),
  `${JSON.stringify(map, null, 2)}\n`,
  'utf8',
)

const coverage = ((Object.keys(map).length / labels.size) * 100).toFixed(1)
console.log(
  `${Object.keys(map).length} of ${labels.size} Portuguese labels mapped (${coverage}%)`,
)
console.log(`\nText-only (no symbol): ${unmapped.length}`)
console.log(unmapped.join(', '))
