// Generates src/data/coreWords.pt.json — the Brazilian Portuguese boards (§19.7).
//
// Structurally the closest board to the Spanish one — two copulas, pro-drop,
// gender agreement — so the LAYOUT transfers even though every word is chosen
// again. What differs:
//
//  - CONTRACTIONS earn core cells. `de`, `em`, `a` and `por` all fuse with a
//    following article (de+o=do, em+a=na, a+o=ao), and the fusion is
//    obligatory, not stylistic. They are the highest-value function words on
//    a Portuguese board precisely because so much depends on them, so `de` and
//    `em` sit in the persistent core rather than on the Palavrinhas page.
//  - `gostar` needs its preposition. "eu gosto DE bolo" — the verb is useless
//    without `de` next to it, which is another reason `de` is core.
//  - FEWER PERSON FORMS. Brazilian usage puts `você` on the third person, so
//    the board carries `eu / você / ele-ela / nós / vocês-eles` and the verb
//    paradigm has four distinct forms, not five.
//  - pt-BR, not pt-PT. `você` rather than `tu`, gerund rather than `a` +
//    infinitive, `ônibus`/`celular`/`trem` rather than the European words.
//
// Word lists adapted from published Brazilian core vocabulary work
// (vocabulário nuclear / CAA materials from Brazilian practice) per the
// project's `adapt, don't invent` rule. §19.6 review is OUTSTANDING.
//
// Usage: node scripts/vocabulary/build-portuguese-core.mjs

import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outPath = join(here, '..', '..', 'src', 'data', 'coreWords.pt.json')

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
  name: 'Vocabulário nuclear (simplificado)',
  shortName: 'Simplificado',
  rows: 3,
  columns: 4,
  coreColumns: 2,
  core: core([
    ['eu', 'pronoun'], ['quero', 'verb'],
    ['ir', 'verb'], ['mais', 'little'],
    ['meu', 'pronoun'], ['não', 'social'],
  ]),
  topicLevels: { Palavras: 1, Sentimentos: 1, Comida: 1, Bebida: 1, Pessoas: 1 },
  corePages: { Palavras: 'verb', Sentimentos: 'descriptor' },
  topics: {
    Palavras: core([['ajuda', 'noun'], ['parar', 'verb'], ['isso', 'pronoun'], ['isto', 'pronoun']]),
    Sentimentos: core([['feliz', 'descriptor'], ['triste', 'descriptor'], ['bravo', 'descriptor'], ['cansado', 'descriptor']]),
    Comida: core([['comer', 'verb'], ['fome', 'noun'], ['bolacha', 'noun'], ['maçã', 'noun']]),
    Bebida: core([['beber', 'verb'], ['sede', 'noun'], ['água', 'noun'], ['leite', 'noun']]),
    Pessoas: core([['mamãe', 'noun'], ['papai', 'noun'], ['professora', 'noun'], ['amigo', 'noun']]),
  },
}

// ---------------------------------------------------------------------------
// 5×6 — the standard board. 15 core cells.
//
//   eu      você     isso        people and deixis
//   quero   gosto    mais        what I want
//   é       está     ir          the two copulas + the most-used verb
//   ajuda   parar    fazer       regulation
//   de      sim      não         the contracting preposition + polarity

const SIZE_5X6 = {
  name: 'Vocabulário nuclear',
  shortName: 'Nuclear',
  rows: 5,
  columns: 6,
  coreColumns: 3,
  core: core([
    ['eu', 'pronoun'], ['você', 'pronoun'], ['isso', 'pronoun'],
    ['quero', 'verb'], ['gosto', 'verb'], ['mais', 'little'],
    ['é', 'verb'], ['está', 'verb'], ['ir', 'verb'],
    ['ajuda', 'noun'], ['parar', 'verb'], ['fazer', 'verb'],
    ['de', 'little'], ['sim', 'social'], ['não', 'social'],
  ]),
  topicLevels: {
    Ações: 1, 'Palavras de apoio': 1, Descrever: 1, Sentimentos: 1,
    Social: 1, Perguntas: 1, Palavrinhas: 1, Comida: 1, Bebida: 1,
    Brincar: 1, Pessoas: 1, Lugares: 2, Escola: 2, Corpo: 2,
  },
  corePages: {
    Ações: 'verb', 'Palavras de apoio': 'verb', Descrever: 'descriptor',
    Sentimentos: 'descriptor', Social: 'social', Perguntas: 'question',
    Palavrinhas: 'little',
  },
  topics: {
    Ações: leveled([
      ['abrir', 'verb'], ['fechar', 'verb'], ['dar', 'verb'], ['pegar', 'verb'],
      ['pôr', 'verb'], ['lavar', 'verb'], ['ler', 'verb'], ['escrever', 'verb'],
      ['cantar', 'verb'], ['dançar', 'verb'], ['correr', 'verb'], ['pular', 'verb'],
      ['sentar', 'verb'],
    ]),
    'Palavras de apoio': leveled([
      ['sou', 'verb'], ['estou', 'verb'], ['somos', 'verb'], ['estamos', 'verb'],
      ['são', 'verb'], ['estão', 'verb'], ['tenho', 'verb'], ['tem', 'verb'],
      ['posso', 'verb'], ['pode', 'verb'], ['vou', 'verb'], ['vai', 'verb'],
      ['tem que', 'verb'],
    ]),
    Descrever: leveled([
      ['grande', 'descriptor'], ['pequeno', 'descriptor'], ['bom', 'descriptor'],
      ['ruim', 'descriptor'], ['bonito', 'descriptor'], ['feio', 'descriptor'],
      ['rápido', 'descriptor'], ['devagar', 'descriptor'], ['quente', 'descriptor'],
      ['frio', 'descriptor'], ['limpo', 'descriptor'], ['sujo', 'descriptor'],
      ['novo', 'descriptor'],
    ]),
    Sentimentos: leveled([
      ['feliz', 'descriptor'], ['triste', 'descriptor'], ['bravo', 'descriptor'],
      ['cansado', 'descriptor'], ['assustado', 'descriptor'], ['nervoso', 'descriptor'],
      ['doente', 'descriptor'], ['dói', 'verb'], ['contente', 'descriptor'],
      ['calmo', 'descriptor'], ['entediado', 'descriptor'], ['orgulhoso', 'descriptor'],
      ['preocupado', 'descriptor'],
    ]),
    Social: leveled([
      ['oi', 'social'], ['tchau', 'social'], ['obrigado', 'social'],
      ['por favor', 'social'], ['desculpa', 'social'], ['tudo bem', 'social'],
      ['bom dia', 'social'], ['boa noite', 'social'], ['até logo', 'social'],
      ['eu te amo', 'social'], ['sinto muito', 'social'], ['como vai', 'social'],
      ['prazer', 'social'],
    ]),
    Perguntas: leveled([
      ['o que', 'question'], ['quem', 'question'], ['onde', 'question'],
      ['quando', 'question'], ['como', 'question'], ['por que', 'question'],
      ['qual', 'question'], ['quanto', 'question'], ['quantos', 'question'],
      ['para onde', 'question'], ['para que', 'question'], ['com quem', 'question'],
      ['de quem', 'question'],
    ]),
    Palavrinhas: leveled([
      ['em', 'little'], ['a', 'little'], ['com', 'little'], ['para', 'little'],
      ['por', 'little'], ['e', 'little'], ['mas', 'little'], ['ou', 'little'],
      ['em cima', 'little'], ['embaixo', 'little'], ['dentro', 'little'],
      ['fora', 'little'], ['sem', 'little'],
    ]),
    Comida: leveled([
      ['comer', 'verb'], ['fome', 'noun'], ['bolacha', 'noun'],
      ['maçã', 'noun'], ['banana', 'noun'], ['pão', 'noun'], ['pizza', 'noun'],
      ['queijo', 'noun'], ['sanduíche', 'noun'], ['arroz', 'noun'],
      ['iogurte', 'noun'], ['ovo', 'noun'], ['feijão', 'noun'],
    ]),
    Bebida: leveled([
      ['beber', 'verb'], ['sede', 'noun'], ['água', 'noun'], ['leite', 'noun'],
      ['suco', 'noun'], ['vitamina', 'noun'], ['chá', 'noun'],
      ['achocolatado', 'noun'], ['refrigerante', 'noun'], ['limonada', 'noun'],
      ['café', 'noun'], ['gelo', 'noun'], ['copo', 'noun'],
    ]),
    Brincar: leveled([
      ['brincar', 'verb'], ['bola', 'noun'], ['boneca', 'noun'], ['carrinho', 'noun'],
      ['blocos', 'noun'], ['livro', 'noun'], ['música', 'noun'], ['bolha', 'noun'],
      ['balanço', 'noun'], ['quebra-cabeça', 'noun'], ['pintar', 'verb'],
      ['bicicleta', 'noun'], ['parque', 'noun'],
    ]),
    Pessoas: leveled([
      ['mamãe', 'noun'], ['papai', 'noun'], ['irmão', 'noun'], ['irmã', 'noun'],
      ['vovô', 'noun'], ['vovó', 'noun'], ['amigo', 'noun'], ['professora', 'noun'],
      ['bebê', 'noun'], ['menino', 'noun'], ['menina', 'noun'], ['médico', 'noun'],
      ['família', 'noun'],
    ]),
    Lugares: leveled([
      ['casa', 'noun'], ['escola', 'noun'], ['banheiro', 'noun'], ['cozinha', 'noun'],
      ['loja', 'noun'], ['rua', 'noun'], ['praia', 'noun'], ['ônibus', 'noun'],
      ['hospital', 'noun'], ['cidade', 'noun'], ['quintal', 'noun'],
      ['piscina', 'noun'], ['praça', 'noun'],
    ]),
    Escola: leveled([
      ['sala', 'noun'], ['livro', 'noun'], ['lápis', 'noun'], ['papel', 'noun'],
      ['mesa', 'noun'], ['cadeira', 'noun'], ['mochila', 'noun'], ['colega', 'noun'],
      ['recreio', 'noun'], ['tarefa', 'noun'], ['lousa', 'noun'],
      ['tesoura', 'noun'], ['cola', 'noun'],
    ]),
    Corpo: leveled([
      ['cabeça', 'noun'], ['mão', 'noun'], ['pé', 'noun'], ['olho', 'noun'],
      ['boca', 'noun'], ['nariz', 'noun'], ['orelha', 'noun'], ['braço', 'noun'],
      ['perna', 'noun'], ['cabelo', 'noun'], ['dente', 'noun'], ['barriga', 'noun'],
      ['dedo', 'noun'],
    ]),
  },
}

// ---------------------------------------------------------------------------
// 6×10 — expanded. 24 core cells.
//
//   eu      você      ele      ela
//   isso    isto      o que    onde
//   quero   preciso   gosto    tenho
//   é       está      tem      fazer
//   ir      ajuda     parar    olha
//   de      em        sim      não

const SIZE_6X10 = {
  name: 'Vocabulário nuclear (ampliado)',
  shortName: 'Ampliado',
  rows: 6,
  columns: 10,
  coreColumns: 4,
  core: core([
    ['eu', 'pronoun'], ['você', 'pronoun'], ['ele', 'pronoun'], ['ela', 'pronoun'],
    ['isso', 'pronoun'], ['isto', 'pronoun'], ['o que', 'question'], ['onde', 'question'],
    ['quero', 'verb'], ['preciso', 'verb'], ['gosto', 'verb'], ['tenho', 'verb'],
    ['é', 'verb'], ['está', 'verb'], ['tem', 'verb'], ['fazer', 'verb'],
    ['ir', 'verb'], ['ajuda', 'noun'], ['parar', 'verb'], ['olha', 'verb'],
    ['de', 'little'], ['em', 'little'], ['sim', 'social'], ['não', 'social'],
  ]),
  topicLevels: {
    Ações: 1, 'Palavras de apoio': 1, Pronomes: 1, Descrever: 1, Sentimentos: 1,
    Social: 1, Perguntas: 1, Palavrinhas: 1, Tempo: 1, Quantidade: 1,
    Comida: 1, Bebida: 1, Brincar: 1, Pessoas: 1, Lugares: 2, Escola: 2,
    Corpo: 2, Animais: 2, Roupa: 3, 'Em casa': 3, Clima: 3,
  },
  corePages: {
    Ações: 'verb', 'Palavras de apoio': 'verb', Pronomes: 'pronoun',
    Descrever: 'descriptor', Sentimentos: 'descriptor', Social: 'social',
    Perguntas: 'question', Palavrinhas: 'little', Tempo: 'little',
    Quantidade: 'descriptor',
  },
  topics: {
    Ações: leveled([
      ['abrir', 'verb'], ['fechar', 'verb'], ['dar', 'verb'], ['pegar', 'verb'],
      ['pôr', 'verb'], ['tirar', 'verb'], ['vir', 'verb'], ['sair', 'verb'],
      ['entrar', 'verb'], ['subir', 'verb'], ['descer', 'verb'], ['lavar', 'verb'],
      ['comer', 'verb'], ['beber', 'verb'], ['dormir', 'verb'], ['brincar', 'verb'],
      ['ler', 'verb'], ['escrever', 'verb'], ['cantar', 'verb'], ['dançar', 'verb'],
      ['correr', 'verb'], ['pular', 'verb'], ['sentar', 'verb'], ['esperar', 'verb'],
      ['procurar', 'verb'], ['achar', 'verb'], ['jogar', 'verb'], ['empurrar', 'verb'],
      ['abraçar', 'verb'], ['pintar', 'verb'], ['cortar', 'verb'], ['limpar', 'verb'],
      ['ouvir', 'verb'], ['falar', 'verb'],
    ]),
    'Palavras de apoio': leveled([
      ['sou', 'verb'], ['estou', 'verb'], ['somos', 'verb'], ['estamos', 'verb'],
      ['são', 'verb'], ['estão', 'verb'], ['era', 'verb'], ['estava', 'verb'],
      ['foi', 'verb'], ['esteve', 'verb'], ['temos', 'verb'], ['têm', 'verb'],
      ['posso', 'verb'], ['pode', 'verb'], ['podemos', 'verb'], ['podem', 'verb'],
      ['vou', 'verb'], ['vai', 'verb'], ['vamos', 'verb'], ['vão', 'verb'],
      ['quer', 'verb'], ['queremos', 'verb'], ['querem', 'verb'], ['tem que', 'verb'],
      ['preciso de', 'verb'], ['acabou', 'verb'], ['vai ser', 'verb'],
      ['está sendo', 'verb'], ['tinha', 'verb'], ['havia', 'verb'], ['dá para', 'verb'],
    ]),
    Pronomes: leveled([
      ['nós', 'pronoun'], ['vocês', 'pronoun'], ['eles', 'pronoun'], ['elas', 'pronoun'],
      ['a gente', 'pronoun'], ['me', 'pronoun'], ['te', 'pronoun'], ['lhe', 'pronoun'],
      ['nos', 'pronoun'], ['mim', 'pronoun'], ['comigo', 'pronoun'],
      ['meu', 'pronoun'], ['minha', 'pronoun'], ['seu', 'pronoun'], ['sua', 'pronoun'],
      ['nosso', 'pronoun'], ['dele', 'pronoun'], ['dela', 'pronoun'],
      ['este', 'pronoun'], ['esta', 'pronoun'], ['esse', 'pronoun'], ['essa', 'pronoun'],
      ['aquele', 'pronoun'], ['aquela', 'pronoun'], ['aquilo', 'pronoun'],
      ['alguém', 'pronoun'], ['ninguém', 'pronoun'], ['algo', 'pronoun'],
      ['nada', 'pronoun'], ['todos', 'pronoun'], ['outro', 'pronoun'],
      ['mesmo', 'pronoun'],
    ]),
    Descrever: leveled([
      ['grande', 'descriptor'], ['pequeno', 'descriptor'], ['bom', 'descriptor'],
      ['ruim', 'descriptor'], ['bonito', 'descriptor'], ['feio', 'descriptor'],
      ['rápido', 'descriptor'], ['devagar', 'descriptor'], ['quente', 'descriptor'],
      ['frio', 'descriptor'], ['limpo', 'descriptor'], ['sujo', 'descriptor'],
      ['novo', 'descriptor'], ['velho', 'descriptor'], ['alto', 'descriptor'],
      ['baixo', 'descriptor'], ['longo', 'descriptor'], ['curto', 'descriptor'],
      ['forte', 'descriptor'], ['macio', 'descriptor'], ['duro', 'descriptor'],
      ['cheio', 'descriptor'], ['vazio', 'descriptor'], ['quebrado', 'descriptor'],
      ['igual', 'descriptor'], ['diferente', 'descriptor'], ['vermelho', 'descriptor'],
      ['azul', 'descriptor'], ['verde', 'descriptor'], ['amarelo', 'descriptor'],
      ['preto', 'descriptor'], ['branco', 'descriptor'], ['barulhento', 'descriptor'],
    ]),
    Sentimentos: leveled([
      ['feliz', 'descriptor'], ['triste', 'descriptor'], ['bravo', 'descriptor'],
      ['cansado', 'descriptor'], ['assustado', 'descriptor'], ['nervoso', 'descriptor'],
      ['doente', 'descriptor'], ['dói', 'verb'], ['contente', 'descriptor'],
      ['calmo', 'descriptor'], ['entediado', 'descriptor'], ['orgulhoso', 'descriptor'],
      ['preocupado', 'descriptor'], ['animado', 'descriptor'], ['surpreso', 'descriptor'],
      ['sozinho', 'descriptor'], ['seguro', 'descriptor'], ['corajoso', 'descriptor'],
      ['com ciúmes', 'descriptor'], ['envergonhado', 'descriptor'],
      ['confuso', 'descriptor'], ['frustrado', 'descriptor'], ['com fome', 'descriptor'],
      ['com sede', 'descriptor'], ['com sono', 'descriptor'], ['melhor', 'descriptor'],
      ['pior', 'descriptor'], ['confortável', 'descriptor'],
    ]),
    Social: leveled([
      ['oi', 'social'], ['tchau', 'social'], ['obrigado', 'social'],
      ['desculpa', 'social'], ['tudo bem', 'social'], ['bom dia', 'social'],
      ['boa tarde', 'social'], ['boa noite', 'social'], ['até logo', 'social'],
      ['eu te amo', 'social'], ['sinto muito', 'social'], ['como vai', 'social'],
      ['prazer', 'social'], ['de nada', 'social'], ['claro', 'social'],
      ['talvez', 'social'], ['minha vez', 'social'], ['sua vez', 'social'],
      ['olha isso', 'social'], ['que legal', 'social'], ['que engraçado', 'social'],
      ['tudo certo', 'social'], ['de novo', 'social'], ['acabou', 'social'],
      ['espera', 'social'], ['vem cá', 'social'], ['me deixa', 'social'],
      ['não quero', 'social'], ['não sei', 'social'], ['não gosto', 'social'],
      ['parabéns', 'social'],
    ]),
    Perguntas: leveled([
      ['quem', 'question'], ['quando', 'question'], ['como', 'question'],
      ['por que', 'question'], ['qual', 'question'], ['quanto', 'question'],
      ['quantos', 'question'], ['para onde', 'question'], ['para que', 'question'],
      ['com quem', 'question'], ['de quem', 'question'], ['o que é', 'question'],
      ['quem é', 'question'], ['onde está', 'question'], ['o que houve', 'question'],
      ['falta quanto', 'question'], ['né', 'question'], ['posso', 'question'],
      ['me ajuda', 'question'], ['e agora', 'question'],
    ]),
    Palavrinhas: leveled([
      ['a', 'little'], ['com', 'little'], ['para', 'little'], ['por', 'little'],
      ['sem', 'little'], ['e', 'little'], ['mas', 'little'], ['ou', 'little'],
      ['porque', 'little'], ['se', 'little'], ['que', 'little'],
      ['em cima', 'little'], ['embaixo', 'little'], ['dentro', 'little'],
      ['fora', 'little'], ['atrás', 'little'], ['na frente', 'little'],
      ['entre', 'little'], ['perto', 'little'], ['longe', 'little'],
      ['aqui', 'little'], ['ali', 'little'], ['o', 'little'], ['a gente', 'little'],
      ['um', 'little'], ['uma', 'little'], ['outro', 'little'], ['também', 'little'],
      ['só', 'little'], ['já', 'little'], ['ainda', 'little'], ['junto', 'little'],
      ['de novo', 'little'], ['muito', 'little'],
    ]),
    Tempo: leveled([
      ['agora', 'little'], ['depois', 'little'], ['antes', 'little'],
      ['hoje', 'little'], ['amanhã', 'little'], ['ontem', 'little'],
      ['sempre', 'little'], ['nunca', 'little'], ['logo', 'little'],
      ['tarde', 'little'], ['cedo', 'little'], ['ainda não', 'little'],
      ['de manhã', 'little'], ['de tarde', 'little'], ['de noite', 'little'],
      ['mais tarde', 'little'], ['hora', 'noun'], ['dia', 'noun'],
      ['semana', 'noun'], ['mês', 'noun'], ['ano', 'noun'], ['minuto', 'noun'],
      ['fim de semana', 'noun'], ['aniversário', 'noun'],
    ]),
    Quantidade: leveled([
      ['muito', 'descriptor'], ['pouco', 'descriptor'], ['tudo', 'descriptor'],
      ['nada', 'descriptor'], ['algum', 'descriptor'], ['outro', 'descriptor'],
      ['menos', 'descriptor'], ['bastante', 'descriptor'], ['demais', 'descriptor'],
      ['metade', 'descriptor'], ['um', 'descriptor'], ['dois', 'descriptor'],
      ['três', 'descriptor'], ['quatro', 'descriptor'], ['cinco', 'descriptor'],
      ['muitos', 'descriptor'], ['poucos', 'descriptor'], ['nenhum', 'descriptor'],
      ['cada', 'descriptor'],
    ]),
    Comida: leveled([
      ['fome', 'noun'], ['bolacha', 'noun'], ['maçã', 'noun'], ['banana', 'noun'],
      ['pão', 'noun'], ['pizza', 'noun'], ['queijo', 'noun'], ['sanduíche', 'noun'],
      ['arroz', 'noun'], ['iogurte', 'noun'], ['ovo', 'noun'], ['feijão', 'noun'],
      ['macarrão', 'noun'], ['frango', 'noun'], ['sopa', 'noun'], ['batata', 'noun'],
      ['laranja', 'noun'], ['sorvete', 'noun'], ['almoço', 'noun'],
    ]),
    Bebida: leveled([
      ['sede', 'noun'], ['água', 'noun'], ['leite', 'noun'], ['suco', 'noun'],
      ['vitamina', 'noun'], ['chá', 'noun'], ['achocolatado', 'noun'],
      ['refrigerante', 'noun'], ['limonada', 'noun'], ['café', 'noun'],
      ['gelo', 'noun'], ['copo', 'noun'], ['xícara', 'noun'], ['garrafa', 'noun'],
      ['canudo', 'noun'], ['quente', 'descriptor'], ['gelado', 'descriptor'],
      ['garrafinha', 'noun'], ['bebida', 'noun'],
    ]),
    Brincar: leveled([
      ['bola', 'noun'], ['boneca', 'noun'], ['carrinho', 'noun'], ['blocos', 'noun'],
      ['livro', 'noun'], ['música', 'noun'], ['bolha', 'noun'], ['balanço', 'noun'],
      ['quebra-cabeça', 'noun'], ['bicicleta', 'noun'], ['parque', 'noun'],
      ['escorregador', 'noun'], ['jogo', 'noun'], ['tablet', 'noun'],
      ['pelúcia', 'noun'], ['fantasia', 'noun'], ['dança', 'noun'],
      ['brinquedo', 'noun'], ['desenho', 'noun'],
    ]),
    Pessoas: leveled([
      ['mamãe', 'noun'], ['papai', 'noun'], ['irmão', 'noun'], ['irmã', 'noun'],
      ['vovô', 'noun'], ['vovó', 'noun'], ['amigo', 'noun'], ['amiga', 'noun'],
      ['professora', 'noun'], ['bebê', 'noun'], ['menino', 'noun'],
      ['menina', 'noun'], ['médico', 'noun'], ['família', 'noun'], ['tio', 'noun'],
      ['tia', 'noun'], ['primo', 'noun'], ['vizinho', 'noun'], ['enfermeira', 'noun'],
    ]),
    Lugares: leveled([
      ['casa', 'noun'], ['escola', 'noun'], ['banheiro', 'noun'], ['cozinha', 'noun'],
      ['loja', 'noun'], ['rua', 'noun'], ['praia', 'noun'], ['ônibus', 'noun'],
      ['hospital', 'noun'], ['cidade', 'noun'], ['quintal', 'noun'],
      ['piscina', 'noun'], ['praça', 'noun'], ['carro', 'noun'], ['mercado', 'noun'],
      ['sítio', 'noun'], ['cinema', 'noun'], ['restaurante', 'noun'],
      ['biblioteca', 'noun'],
    ]),
    Escola: leveled([
      ['sala', 'noun'], ['livro', 'noun'], ['lápis', 'noun'], ['papel', 'noun'],
      ['mesa', 'noun'], ['cadeira', 'noun'], ['mochila', 'noun'], ['colega', 'noun'],
      ['recreio', 'noun'], ['tarefa', 'noun'], ['lousa', 'noun'], ['tesoura', 'noun'],
      ['cola', 'noun'], ['caderno', 'noun'], ['giz de cera', 'noun'],
      ['computador', 'noun'], ['refeitório', 'noun'], ['aula', 'noun'],
    ]),
    Corpo: leveled([
      ['cabeça', 'noun'], ['mão', 'noun'], ['pé', 'noun'], ['olho', 'noun'],
      ['boca', 'noun'], ['nariz', 'noun'], ['orelha', 'noun'], ['braço', 'noun'],
      ['perna', 'noun'], ['cabelo', 'noun'], ['dente', 'noun'], ['barriga', 'noun'],
      ['dedo', 'noun'], ['rosto', 'noun'], ['costas', 'noun'], ['pescoço', 'noun'],
      ['joelho', 'noun'], ['ombro', 'noun'], ['coração', 'noun'],
    ]),
    Animais: leveled([
      ['cachorro', 'noun'], ['gato', 'noun'], ['passarinho', 'noun'], ['peixe', 'noun'],
      ['cavalo', 'noun'], ['vaca', 'noun'], ['porco', 'noun'], ['ovelha', 'noun'],
      ['galinha', 'noun'], ['coelho', 'noun'], ['rato', 'noun'], ['urso', 'noun'],
      ['leão', 'noun'], ['elefante', 'noun'], ['macaco', 'noun'],
      ['tartaruga', 'noun'], ['aranha', 'noun'], ['borboleta', 'noun'],
      ['pato', 'noun'],
    ]),
    Roupa: leveled([
      ['camiseta', 'noun'], ['calça', 'noun'], ['sapato', 'noun'], ['meia', 'noun'],
      ['casaco', 'noun'], ['vestido', 'noun'], ['saia', 'noun'], ['blusa', 'noun'],
      ['boné', 'noun'], ['cachecol', 'noun'], ['luva', 'noun'], ['pijama', 'noun'],
      ['bota', 'noun'], ['sunga', 'noun'], ['cinto', 'noun'], ['óculos', 'noun'],
      ['vestir', 'verb'], ['tirar', 'verb'], ['botão', 'noun'],
    ]),
    'Em casa': leveled([
      ['cama', 'noun'], ['porta', 'noun'], ['janela', 'noun'], ['sofá', 'noun'],
      ['mesa', 'noun'], ['cadeira', 'noun'], ['chuveiro', 'noun'],
      ['cobertor', 'noun'], ['travesseiro', 'noun'], ['geladeira', 'noun'],
      ['prato', 'noun'], ['colher', 'noun'], ['garfo', 'noun'], ['faca', 'noun'],
      ['sabonete', 'noun'], ['toalha', 'noun'], ['luz', 'noun'], ['chave', 'noun'],
      ['televisão', 'noun'],
    ]),
    Clima: leveled([
      ['sol', 'noun'], ['chuva', 'noun'], ['neve', 'noun'], ['vento', 'noun'],
      ['nuvem', 'noun'], ['calor', 'noun'], ['frio', 'descriptor'],
      ['tempestade', 'noun'], ['ensolarado', 'descriptor'], ['nublado', 'descriptor'],
      ['chovendo', 'verb'], ['neblina', 'noun'], ['arco-íris', 'noun'],
      ['guarda-chuva', 'noun'],
    ]),
  },
}

// ---------------------------------------------------------------------------

const doc = {
  _comment: [
    'Authored Brazilian Portuguese layouts for the bundled Vocabulário nuclear',
    'set (§19.7).',
    '',
    'GENERATED by scripts/vocabulary/build-portuguese-core.mjs — edit that',
    'file, not this one, and re-run `npm run portuguese-core`.',
    '',
    'Same schema as coreWords.json: one entry per GRID SIZE, each word is',
    '[label, partOfSpeech, level].',
    '',
    'pt-BR, not pt-PT. The prepositions `de` and `em` sit in the persistent',
    'core because they CONTRACT obligatorily with a following article',
    '(de+o=do, em+a=na) — see src/services/contractions.ts — and because',
    '`gostar` needs `de` next to it to mean anything.',
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
  console.error('Portuguese board problems:\n  ' + problems.join('\n  '))
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
