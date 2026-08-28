// Generates src/data/coreWords.es.json — the Spanish authored boards (§19.7).
//
// This is NOT a translation of coreWords.json. Spanish core vocabulary differs
// from English in ways that change what belongs on the board:
//
//  - TWO copulas. `ser` and `estar` are both high-frequency and not
//    interchangeable ("es bueno" vs "está bueno"). Both are in the persistent
//    core, and the Palabras de apoyo page carries their person forms — the
//    Spanish counterpart of the English "to be" audit, and a bigger hole here
//    because there are two verbs to miss instead of one.
//  - PRO-DROP. Person lives on the verb, so the frame words a board uses
//    constantly (`quiero`, `necesito`, `gusta`, `tengo`) are carried already
//    conjugated in the 1st/3rd person; everything else is an infinitive that
//    the word-forms popup conjugates. This is how published Spanish AAC
//    boards are built.
//  - `gustar` is not `like`. It takes an experiencer clitic ("me gusta"), so
//    the core carries `gusta` rather than the infinitive.
//  - Articles and determiners inflect, so they earn core-page space that the
//    English board spends on other function words.
//
// Word lists are adapted from published Spanish core vocabulary work
// (vocabulario nuclear; ARASAAC's Aragonese materials) following the
// project's `adapt, don't invent` rule. §19.6 SLP review is OUTSTANDING for
// these boards exactly as it is for the English ones — see docs/slp-review.md.
//
// Usage: node scripts/vocabulary/build-spanish-core.mjs

import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outPath = join(here, '..', '..', 'src', 'data', 'coreWords.es.json')

// ---------------------------------------------------------------------------
// Levels. A word's level is the level at which it is INTRODUCED. Positions
// come from the array index, so levels only ever un-hide cells — nothing
// moves when a level is raised (§19.1). Proportions mirror the English
// boards: roughly the first sixth at level 1, the next third at level 2.

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

/** Core words are always level 1 — they are the highest-value cells. */
const core = (words) => words.map(([label, pos]) => [label, pos, 1])

// ---------------------------------------------------------------------------
// 3×4 — emergent communicators. 6 core words against 5 short topics.

const SIZE_3X4 = {
  name: 'Vocabulario nuclear (simplificado)',
  shortName: 'Simplificado',
  rows: 3,
  columns: 4,
  coreColumns: 2,
  core: core([
    ['yo', 'pronoun'], ['quiero', 'verb'],
    ['ir', 'verb'], ['más', 'little'],
    ['mi', 'pronoun'], ['no', 'social'],
  ]),
  topicLevels: { Palabras: 1, Sentimientos: 1, Comida: 1, Bebidas: 1, Personas: 1 },
  corePages: { Palabras: 'verb', Sentimientos: 'descriptor' },
  topics: {
    Palabras: core([['ayuda', 'verb'], ['parar', 'verb'], ['esto', 'pronoun'], ['eso', 'pronoun']]),
    Sentimientos: core([['feliz', 'descriptor'], ['triste', 'descriptor'], ['enfadado', 'descriptor'], ['cansado', 'descriptor']]),
    Comida: core([['comer', 'verb'], ['hambre', 'descriptor'], ['galleta', 'noun'], ['manzana', 'noun']]),
    Bebidas: core([['beber', 'verb'], ['sed', 'descriptor'], ['agua', 'noun'], ['leche', 'noun']]),
    Personas: core([['mamá', 'noun'], ['papá', 'noun'], ['profe', 'noun'], ['amigo', 'noun']]),
  },
}

// ---------------------------------------------------------------------------
// 5×6 — the standard board. 15 core cells, 14 topic pages of 13 words.
//
// Core layout (row-major over 5 rows × 3 columns):
//   yo    tú     eso        people and deixis
//   quiero gusta más        what I want
//   es    está  ir          the two copulas + the most-used verb
//   ayuda parar hacer       regulation
//   mira  sí    no          attention + polarity

const SIZE_5X6 = {
  name: 'Vocabulario nuclear',
  shortName: 'Nuclear',
  rows: 5,
  columns: 6,
  coreColumns: 3,
  core: core([
    ['yo', 'pronoun'], ['tú', 'pronoun'], ['eso', 'pronoun'],
    ['quiero', 'verb'], ['gusta', 'verb'], ['más', 'little'],
    ['es', 'verb'], ['está', 'verb'], ['ir', 'verb'],
    ['ayuda', 'verb'], ['parar', 'verb'], ['hacer', 'verb'],
    ['mira', 'verb'], ['sí', 'social'], ['no', 'social'],
  ]),
  topicLevels: {
    Acciones: 1, 'Palabras de apoyo': 1, Describir: 1, Sentimientos: 1,
    Social: 1, Preguntas: 1, 'Palabras pequeñas': 1, Comida: 1, Bebidas: 1,
    Jugar: 1, Personas: 1, Lugares: 2, Colegio: 2, Cuerpo: 2,
  },
  corePages: {
    Acciones: 'verb', 'Palabras de apoyo': 'verb', Describir: 'descriptor',
    Sentimientos: 'descriptor', Social: 'social', Preguntas: 'question',
    'Palabras pequeñas': 'little',
  },
  topics: {
    Acciones: leveled([
      ['abrir', 'verb'], ['cerrar', 'verb'], ['dar', 'verb'], ['coger', 'verb'],
      ['poner', 'verb'], ['lavar', 'verb'], ['leer', 'verb'], ['escribir', 'verb'],
      ['cantar', 'verb'], ['bailar', 'verb'], ['correr', 'verb'], ['saltar', 'verb'],
      ['sentarse', 'verb'],
    ]),
    // The Spanish "to be" page: both copulas, person by person, plus the
    // auxiliaries. Without these the board only produces telegraphic speech.
    'Palabras de apoyo': leveled([
      ['soy', 'verb'], ['estoy', 'verb'], ['eres', 'verb'], ['estás', 'verb'],
      ['somos', 'verb'], ['estamos', 'verb'], ['son', 'verb'], ['están', 'verb'],
      ['tengo', 'verb'], ['tienes', 'verb'], ['puedo', 'verb'], ['puedes', 'verb'],
      ['hay', 'verb'],
    ]),
    Describir: leveled([
      ['grande', 'descriptor'], ['pequeño', 'descriptor'], ['bueno', 'descriptor'],
      ['malo', 'descriptor'], ['bonito', 'descriptor'], ['feo', 'descriptor'],
      ['rápido', 'descriptor'], ['lento', 'descriptor'], ['caliente', 'descriptor'],
      ['frío', 'descriptor'], ['limpio', 'descriptor'], ['sucio', 'descriptor'],
      ['nuevo', 'descriptor'],
    ]),
    Sentimientos: leveled([
      ['feliz', 'descriptor'], ['triste', 'descriptor'], ['enfadado', 'descriptor'],
      ['cansado', 'descriptor'], ['asustado', 'descriptor'], ['nervioso', 'descriptor'],
      ['enfermo', 'descriptor'], ['duele', 'verb'], ['contento', 'descriptor'],
      ['tranquilo', 'descriptor'], ['aburrido', 'descriptor'], ['orgulloso', 'descriptor'],
      ['preocupado', 'descriptor'],
    ]),
    Social: leveled([
      ['hola', 'social'], ['adiós', 'social'], ['gracias', 'social'],
      ['por favor', 'social'], ['perdón', 'social'], ['vale', 'social'],
      ['buenos días', 'social'], ['buenas noches', 'social'], ['hasta luego', 'social'],
      ['te quiero', 'social'], ['lo siento', 'social'], ['qué tal', 'social'],
      ['mucho gusto', 'social'],
    ]),
    Preguntas: leveled([
      ['qué', 'question'], ['quién', 'question'], ['dónde', 'question'],
      ['cuándo', 'question'], ['cómo', 'question'], ['por qué', 'question'],
      ['cuál', 'question'], ['cuánto', 'question'], ['cuántos', 'question'],
      ['adónde', 'question'], ['para qué', 'question'], ['con quién', 'question'],
      ['de quién', 'question'],
    ]),
    'Palabras pequeñas': leveled([
      ['en', 'little'], ['a', 'little'], ['con', 'little'], ['de', 'little'],
      ['para', 'little'], ['y', 'little'], ['pero', 'little'], ['o', 'little'],
      ['arriba', 'little'], ['abajo', 'little'], ['dentro', 'little'],
      ['fuera', 'little'], ['sobre', 'little'],
    ]),
    Comida: leveled([
      ['comer', 'verb'], ['hambre', 'descriptor'], ['galleta', 'noun'],
      ['manzana', 'noun'], ['plátano', 'noun'], ['pan', 'noun'], ['pizza', 'noun'],
      ['queso', 'noun'], ['bocadillo', 'noun'], ['arroz', 'noun'], ['yogur', 'noun'],
      ['cereales', 'noun'], ['huevo', 'noun'],
    ]),
    Bebidas: leveled([
      ['beber', 'verb'], ['sed', 'descriptor'], ['agua', 'noun'], ['leche', 'noun'],
      ['zumo', 'noun'], ['batido', 'noun'], ['té', 'noun'], ['chocolate', 'noun'],
      ['refresco', 'noun'], ['limonada', 'noun'], ['café', 'noun'], ['hielo', 'noun'],
      ['vaso', 'noun'],
    ]),
    Jugar: leveled([
      ['jugar', 'verb'], ['pelota', 'noun'], ['muñeca', 'noun'], ['coche', 'noun'],
      ['bloques', 'noun'], ['libro', 'noun'], ['música', 'noun'], ['burbujas', 'noun'],
      ['columpio', 'noun'], ['puzle', 'noun'], ['pintar', 'verb'], ['bici', 'noun'],
      ['parque', 'noun'],
    ]),
    Personas: leveled([
      ['mamá', 'noun'], ['papá', 'noun'], ['hermano', 'noun'], ['hermana', 'noun'],
      ['abuelo', 'noun'], ['abuela', 'noun'], ['amigo', 'noun'], ['profe', 'noun'],
      ['bebé', 'noun'], ['niño', 'noun'], ['niña', 'noun'], ['médico', 'noun'],
      ['familia', 'noun'],
    ]),
    Lugares: leveled([
      ['casa', 'noun'], ['colegio', 'noun'], ['baño', 'noun'], ['cocina', 'noun'],
      ['tienda', 'noun'], ['calle', 'noun'], ['playa', 'noun'], ['autobús', 'noun'],
      ['hospital', 'noun'], ['ciudad', 'noun'], ['biblioteca', 'noun'],
      ['jardín', 'noun'], ['piscina', 'noun'],
    ]),
    Colegio: leveled([
      ['clase', 'noun'], ['libro', 'noun'], ['lápiz', 'noun'], ['papel', 'noun'],
      ['mesa', 'noun'], ['silla', 'noun'], ['mochila', 'noun'], ['compañero', 'noun'],
      ['recreo', 'noun'], ['deberes', 'noun'], ['pizarra', 'noun'],
      ['tijeras', 'noun'], ['pegamento', 'noun'],
    ]),
    Cuerpo: leveled([
      ['cabeza', 'noun'], ['mano', 'noun'], ['pie', 'noun'], ['ojo', 'noun'],
      ['boca', 'noun'], ['nariz', 'noun'], ['oreja', 'noun'], ['brazo', 'noun'],
      ['pierna', 'noun'], ['pelo', 'noun'], ['diente', 'noun'], ['barriga', 'noun'],
      ['dedo', 'noun'],
    ]),
  },
}

// ---------------------------------------------------------------------------
// 6×10 — expanded. 24 core cells, 21 topic pages.
//
// Core layout (6 rows × 4 columns):
//   yo      tú        él      ella
//   eso     esto      qué     dónde
//   quiero  necesito  gusta   tengo
//   es      está      hay     hacer
//   ir      ayuda     parar   mira
//   más     no        sí      por favor

const SIZE_6X10 = {
  name: 'Vocabulario nuclear (ampliado)',
  shortName: 'Ampliado',
  rows: 6,
  columns: 10,
  coreColumns: 4,
  core: core([
    ['yo', 'pronoun'], ['tú', 'pronoun'], ['él', 'pronoun'], ['ella', 'pronoun'],
    ['eso', 'pronoun'], ['esto', 'pronoun'], ['qué', 'question'], ['dónde', 'question'],
    ['quiero', 'verb'], ['necesito', 'verb'], ['gusta', 'verb'], ['tengo', 'verb'],
    ['es', 'verb'], ['está', 'verb'], ['hay', 'verb'], ['hacer', 'verb'],
    ['ir', 'verb'], ['ayuda', 'verb'], ['parar', 'verb'], ['mira', 'verb'],
    ['más', 'little'], ['no', 'social'], ['sí', 'social'], ['por favor', 'social'],
  ]),
  topicLevels: {
    Acciones: 1, 'Palabras de apoyo': 1, Pronombres: 1, Describir: 1,
    Sentimientos: 1, Social: 1, Preguntas: 1, 'Palabras pequeñas': 1,
    Tiempo: 1, Cantidad: 1, Comida: 1, Bebidas: 1, Jugar: 1, Personas: 1,
    Lugares: 2, Colegio: 2, Cuerpo: 2, Animales: 2, Ropa: 3, Casa: 3, Clima: 3,
  },
  corePages: {
    Acciones: 'verb', 'Palabras de apoyo': 'verb', Pronombres: 'pronoun',
    Describir: 'descriptor', Sentimientos: 'descriptor', Social: 'social',
    Preguntas: 'question', 'Palabras pequeñas': 'little', Tiempo: 'little',
    Cantidad: 'descriptor',
  },
  topics: {
    Acciones: leveled([
      ['abrir', 'verb'], ['cerrar', 'verb'], ['dar', 'verb'], ['coger', 'verb'],
      ['poner', 'verb'], ['quitar', 'verb'], ['venir', 'verb'], ['salir', 'verb'],
      ['entrar', 'verb'], ['subir', 'verb'], ['bajar', 'verb'], ['lavar', 'verb'],
      ['comer', 'verb'], ['beber', 'verb'], ['dormir', 'verb'], ['jugar', 'verb'],
      ['leer', 'verb'], ['escribir', 'verb'], ['cantar', 'verb'], ['bailar', 'verb'],
      ['correr', 'verb'], ['saltar', 'verb'], ['sentarse', 'verb'], ['esperar', 'verb'],
      ['buscar', 'verb'], ['encontrar', 'verb'], ['tirar', 'verb'], ['empujar', 'verb'],
      ['abrazar', 'verb'], ['pintar', 'verb'], ['cortar', 'verb'], ['limpiar', 'verb'],
      ['escuchar', 'verb'], ['hablar', 'verb'],
    ]),
    'Palabras de apoyo': leveled([
      ['soy', 'verb'], ['estoy', 'verb'], ['eres', 'verb'], ['estás', 'verb'],
      ['somos', 'verb'], ['estamos', 'verb'], ['son', 'verb'], ['están', 'verb'],
      ['era', 'verb'], ['estaba', 'verb'], ['fue', 'verb'], ['estuvo', 'verb'],
      ['tienes', 'verb'], ['tiene', 'verb'], ['tenemos', 'verb'], ['tienen', 'verb'],
      ['puedo', 'verb'], ['puedes', 'verb'], ['puede', 'verb'], ['podemos', 'verb'],
      ['voy a', 'verb'], ['vas a', 'verb'], ['va a', 'verb'], ['vamos a', 'verb'],
      ['he', 'verb'], ['has', 'verb'], ['ha', 'verb'], ['hemos', 'verb'],
      ['quiere', 'verb'], ['queremos', 'verb'], ['quieren', 'verb'],
    ]),
    Pronombres: leveled([
      ['nosotros', 'pronoun'], ['ellos', 'pronoun'], ['ellas', 'pronoun'],
      ['usted', 'pronoun'], ['me', 'pronoun'], ['te', 'pronoun'], ['le', 'pronoun'],
      ['nos', 'pronoun'], ['les', 'pronoun'], ['lo', 'pronoun'], ['la', 'pronoun'],
      ['los', 'pronoun'], ['las', 'pronoun'], ['mi', 'pronoun'], ['tu', 'pronoun'],
      ['su', 'pronoun'], ['nuestro', 'pronoun'], ['mío', 'pronoun'], ['tuyo', 'pronoun'],
      ['suyo', 'pronoun'], ['mí', 'pronoun'], ['ti', 'pronoun'], ['este', 'pronoun'],
      ['esta', 'pronoun'], ['ese', 'pronoun'], ['esa', 'pronoun'], ['aquel', 'pronoun'],
      ['alguien', 'pronoun'], ['nadie', 'pronoun'], ['algo', 'pronoun'],
      ['nada', 'pronoun'], ['todos', 'pronoun'],
    ]),
    Describir: leveled([
      ['grande', 'descriptor'], ['pequeño', 'descriptor'], ['bueno', 'descriptor'],
      ['malo', 'descriptor'], ['bonito', 'descriptor'], ['feo', 'descriptor'],
      ['rápido', 'descriptor'], ['lento', 'descriptor'], ['caliente', 'descriptor'],
      ['frío', 'descriptor'], ['limpio', 'descriptor'], ['sucio', 'descriptor'],
      ['nuevo', 'descriptor'], ['viejo', 'descriptor'], ['alto', 'descriptor'],
      ['bajo', 'descriptor'], ['largo', 'descriptor'], ['corto', 'descriptor'],
      ['fuerte', 'descriptor'], ['suave', 'descriptor'], ['duro', 'descriptor'],
      ['blando', 'descriptor'], ['lleno', 'descriptor'], ['vacío', 'descriptor'],
      ['roto', 'descriptor'], ['igual', 'descriptor'], ['diferente', 'descriptor'],
      ['rojo', 'descriptor'], ['azul', 'descriptor'], ['verde', 'descriptor'],
      ['amarillo', 'descriptor'], ['negro', 'descriptor'], ['blanco', 'descriptor'],
    ]),
    Sentimientos: leveled([
      ['feliz', 'descriptor'], ['triste', 'descriptor'], ['enfadado', 'descriptor'],
      ['cansado', 'descriptor'], ['asustado', 'descriptor'], ['nervioso', 'descriptor'],
      ['enfermo', 'descriptor'], ['duele', 'verb'], ['contento', 'descriptor'],
      ['tranquilo', 'descriptor'], ['aburrido', 'descriptor'], ['orgulloso', 'descriptor'],
      ['preocupado', 'descriptor'], ['emocionado', 'descriptor'], ['sorprendido', 'descriptor'],
      ['solo', 'descriptor'], ['seguro', 'descriptor'], ['valiente', 'descriptor'],
      ['celoso', 'descriptor'], ['avergonzado', 'descriptor'], ['confundido', 'descriptor'],
      ['frustrado', 'descriptor'], ['hambriento', 'descriptor'], ['sediento', 'descriptor'],
      ['dolorido', 'descriptor'], ['mejor', 'descriptor'], ['peor', 'descriptor'],
      ['cómodo', 'descriptor'],
    ]),
    Social: leveled([
      ['hola', 'social'], ['adiós', 'social'], ['gracias', 'social'],
      ['perdón', 'social'], ['vale', 'social'], ['buenos días', 'social'],
      ['buenas tardes', 'social'], ['buenas noches', 'social'], ['hasta luego', 'social'],
      ['te quiero', 'social'], ['lo siento', 'social'], ['qué tal', 'social'],
      ['mucho gusto', 'social'], ['de nada', 'social'], ['claro', 'social'],
      ['quizá', 'social'], ['me toca', 'social'], ['te toca', 'social'],
      ['mira esto', 'social'], ['qué guay', 'social'], ['qué gracioso', 'social'],
      ['no pasa nada', 'social'], ['otra vez', 'social'], ['ya está', 'social'],
      ['espera', 'social'], ['ven aquí', 'social'], ['déjame', 'social'],
      ['no quiero', 'social'], ['no sé', 'social'], ['no me gusta', 'social'],
      ['felicidades', 'social'],
    ]),
    Preguntas: leveled([
      ['quién', 'question'], ['cuándo', 'question'], ['cómo', 'question'],
      ['por qué', 'question'], ['cuál', 'question'], ['cuánto', 'question'],
      ['cuántos', 'question'], ['adónde', 'question'], ['para qué', 'question'],
      ['con quién', 'question'], ['de quién', 'question'], ['qué es', 'question'],
      ['quién es', 'question'], ['dónde está', 'question'], ['qué pasa', 'question'],
      ['cuánto falta', 'question'], ['verdad', 'question'], ['puedo', 'question'],
      ['me ayudas', 'question'], ['qué hago', 'question'],
    ]),
    'Palabras pequeñas': leveled([
      ['en', 'little'], ['a', 'little'], ['con', 'little'], ['de', 'little'],
      ['para', 'little'], ['por', 'little'], ['sin', 'little'], ['y', 'little'],
      ['pero', 'little'], ['o', 'little'], ['porque', 'little'], ['si', 'little'],
      ['que', 'little'], ['arriba', 'little'], ['abajo', 'little'],
      ['dentro', 'little'], ['fuera', 'little'], ['sobre', 'little'],
      ['debajo', 'little'], ['detrás', 'little'], ['delante', 'little'],
      ['entre', 'little'], ['cerca', 'little'], ['lejos', 'little'],
      ['aquí', 'little'], ['allí', 'little'], ['el', 'little'], ['la', 'little'],
      ['un', 'little'], ['una', 'little'], ['otro', 'little'], ['también', 'little'],
      ['tampoco', 'little'], ['ya', 'little'],
    ]),
    Tiempo: leveled([
      ['ahora', 'little'], ['después', 'little'], ['antes', 'little'],
      ['hoy', 'little'], ['mañana', 'little'], ['ayer', 'little'],
      ['siempre', 'little'], ['nunca', 'little'], ['pronto', 'little'],
      ['tarde', 'little'], ['temprano', 'little'], ['todavía', 'little'],
      ['otra vez', 'little'], ['por la mañana', 'little'], ['por la tarde', 'little'],
      ['por la noche', 'little'], ['hora', 'noun'], ['día', 'noun'],
      ['semana', 'noun'], ['mes', 'noun'], ['año', 'noun'], ['minuto', 'noun'],
      ['fin de semana', 'noun'], ['cumpleaños', 'noun'],
    ]),
    Cantidad: leveled([
      ['mucho', 'descriptor'], ['poco', 'descriptor'], ['todo', 'descriptor'],
      ['nada', 'descriptor'], ['algo', 'descriptor'], ['otro', 'descriptor'],
      ['menos', 'descriptor'], ['bastante', 'descriptor'], ['demasiado', 'descriptor'],
      ['medio', 'descriptor'], ['uno', 'descriptor'], ['dos', 'descriptor'],
      ['tres', 'descriptor'], ['cuatro', 'descriptor'], ['cinco', 'descriptor'],
      ['muchos', 'descriptor'], ['pocos', 'descriptor'], ['ninguno', 'descriptor'],
      ['cada', 'descriptor'],
    ]),
    Comida: leveled([
      ['comer', 'verb'], ['hambre', 'descriptor'], ['galleta', 'noun'],
      ['manzana', 'noun'], ['plátano', 'noun'], ['pan', 'noun'], ['pizza', 'noun'],
      ['queso', 'noun'], ['bocadillo', 'noun'], ['arroz', 'noun'], ['yogur', 'noun'],
      ['cereales', 'noun'], ['huevo', 'noun'], ['pasta', 'noun'], ['pollo', 'noun'],
      ['sopa', 'noun'], ['patatas', 'noun'], ['naranja', 'noun'], ['helado', 'noun'],
    ]),
    Bebidas: leveled([
      ['beber', 'verb'], ['sed', 'descriptor'], ['agua', 'noun'], ['leche', 'noun'],
      ['zumo', 'noun'], ['batido', 'noun'], ['té', 'noun'], ['chocolate', 'noun'],
      ['refresco', 'noun'], ['limonada', 'noun'], ['café', 'noun'], ['hielo', 'noun'],
      ['vaso', 'noun'], ['taza', 'noun'], ['botella', 'noun'], ['pajita', 'noun'],
      ['caliente', 'descriptor'], ['frío', 'descriptor'], ['cantimplora', 'noun'],
    ]),
    Jugar: leveled([
      ['jugar', 'verb'], ['pelota', 'noun'], ['muñeca', 'noun'], ['coche', 'noun'],
      ['bloques', 'noun'], ['libro', 'noun'], ['música', 'noun'], ['burbujas', 'noun'],
      ['columpio', 'noun'], ['puzle', 'noun'], ['pintar', 'verb'], ['bici', 'noun'],
      ['parque', 'noun'], ['tobogán', 'noun'], ['juego', 'noun'], ['tableta', 'noun'],
      ['peluche', 'noun'], ['disfraz', 'noun'], ['baile', 'noun'],
    ]),
    Personas: leveled([
      ['mamá', 'noun'], ['papá', 'noun'], ['hermano', 'noun'], ['hermana', 'noun'],
      ['abuelo', 'noun'], ['abuela', 'noun'], ['amigo', 'noun'], ['amiga', 'noun'],
      ['profe', 'noun'], ['bebé', 'noun'], ['niño', 'noun'], ['niña', 'noun'],
      ['médico', 'noun'], ['familia', 'noun'], ['tío', 'noun'], ['tía', 'noun'],
      ['primo', 'noun'], ['vecino', 'noun'], ['enfermera', 'noun'],
    ]),
    Lugares: leveled([
      ['casa', 'noun'], ['colegio', 'noun'], ['baño', 'noun'], ['cocina', 'noun'],
      ['tienda', 'noun'], ['calle', 'noun'], ['playa', 'noun'], ['autobús', 'noun'],
      ['hospital', 'noun'], ['ciudad', 'noun'], ['biblioteca', 'noun'],
      ['jardín', 'noun'], ['piscina', 'noun'], ['parque', 'noun'], ['coche', 'noun'],
      ['campo', 'noun'], ['montaña', 'noun'], ['restaurante', 'noun'], ['cine', 'noun'],
    ]),
    Colegio: leveled([
      ['clase', 'noun'], ['libro', 'noun'], ['lápiz', 'noun'], ['papel', 'noun'],
      ['mesa', 'noun'], ['silla', 'noun'], ['mochila', 'noun'], ['compañero', 'noun'],
      ['recreo', 'noun'], ['deberes', 'noun'], ['pizarra', 'noun'], ['tijeras', 'noun'],
      ['pegamento', 'noun'], ['pintura', 'noun'], ['cuaderno', 'noun'],
      ['ordenador', 'noun'], ['comedor', 'noun'], ['autobús', 'noun'],
    ]),
    Cuerpo: leveled([
      ['cabeza', 'noun'], ['mano', 'noun'], ['pie', 'noun'], ['ojo', 'noun'],
      ['boca', 'noun'], ['nariz', 'noun'], ['oreja', 'noun'], ['brazo', 'noun'],
      ['pierna', 'noun'], ['pelo', 'noun'], ['diente', 'noun'], ['barriga', 'noun'],
      ['dedo', 'noun'], ['cara', 'noun'], ['espalda', 'noun'], ['cuello', 'noun'],
      ['rodilla', 'noun'], ['hombro', 'noun'], ['corazón', 'noun'],
    ]),
    Animales: leveled([
      ['perro', 'noun'], ['gato', 'noun'], ['pájaro', 'noun'], ['pez', 'noun'],
      ['caballo', 'noun'], ['vaca', 'noun'], ['cerdo', 'noun'], ['oveja', 'noun'],
      ['pollo', 'noun'], ['conejo', 'noun'], ['ratón', 'noun'], ['oso', 'noun'],
      ['león', 'noun'], ['elefante', 'noun'], ['mono', 'noun'], ['tortuga', 'noun'],
      ['araña', 'noun'], ['mariposa', 'noun'], ['pato', 'noun'],
    ]),
    Ropa: leveled([
      ['camiseta', 'noun'], ['pantalón', 'noun'], ['zapatos', 'noun'],
      ['calcetines', 'noun'], ['abrigo', 'noun'], ['vestido', 'noun'],
      ['falda', 'noun'], ['jersey', 'noun'], ['gorro', 'noun'], ['bufanda', 'noun'],
      ['guantes', 'noun'], ['pijama', 'noun'], ['botas', 'noun'], ['bañador', 'noun'],
      ['cinturón', 'noun'], ['gafas', 'noun'], ['ponerse', 'verb'],
      ['quitarse', 'verb'], ['botón', 'noun'],
    ]),
    Casa: leveled([
      ['cama', 'noun'], ['puerta', 'noun'], ['ventana', 'noun'], ['sofá', 'noun'],
      ['mesa', 'noun'], ['silla', 'noun'], ['ducha', 'noun'], ['manta', 'noun'],
      ['almohada', 'noun'], ['nevera', 'noun'], ['plato', 'noun'], ['cuchara', 'noun'],
      ['tenedor', 'noun'], ['cuchillo', 'noun'], ['jabón', 'noun'], ['toalla', 'noun'],
      ['luz', 'noun'], ['llave', 'noun'], ['televisión', 'noun'],
    ]),
    Clima: leveled([
      ['sol', 'noun'], ['lluvia', 'noun'], ['nieve', 'noun'], ['viento', 'noun'],
      ['nube', 'noun'], ['calor', 'noun'], ['frío', 'descriptor'],
      ['tormenta', 'noun'], ['soleado', 'descriptor'], ['nublado', 'descriptor'],
      ['lloviendo', 'verb'], ['nevando', 'verb'], ['arcoíris', 'noun'],
      ['paraguas', 'noun'],
    ]),
  },
}

// ---------------------------------------------------------------------------

const doc = {
  _comment: [
    'Authored Spanish layouts for the bundled Vocabulario nuclear set (§19.7).',
    '',
    'GENERATED by scripts/vocabulary/build-spanish-core.mjs — edit that file,',
    'not this one, and re-run `npm run spanish-core`.',
    '',
    'Same schema as coreWords.json: one entry per GRID SIZE, each word is',
    '[label, partOfSpeech, level]. See coreWords.json for why sizes are',
    'authored separately (§19.2) and why levels reveal in place (§19.1).',
    '',
    'This is NOT a translation of the English boards. Spanish carries two',
    'copulas (ser/estar), marks person on the verb, and inflects its',
    'determiners, so the frame words, the Palabras de apoyo page and the',
    'core layout are all different by design. See the generator header.',
    '',
    'SLP REVIEW OUTSTANDING (§19.6) — as for the English boards. These lists',
    'were adapted from published Spanish core vocabulary work by a developer,',
    'not authored by a clinician.',
  ],
  sizes: { '5x6': SIZE_5X6, '3x4': SIZE_3X4, '6x10': SIZE_6X10 },
}

// ---- sanity checks: fail loudly rather than shipping a broken board --------

const problems = []
for (const [size, layout] of Object.entries(doc.sizes)) {
  const coreCells = layout.rows * layout.coreColumns
  if (layout.core.length !== coreCells) {
    problems.push(`${size}: core has ${layout.core.length} words for ${coreCells} cells`)
  }
  const contentCells = layout.rows * (layout.columns - layout.coreColumns)
  const navCapacity = contentCells - 1
  const topicCount = Object.keys(layout.topics).length
  if (topicCount > navCapacity) {
    problems.push(`${size}: ${topicCount} topics exceed ${navCapacity} home nav cells`)
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
  console.error('Spanish board problems:\n  ' + problems.join('\n  '))
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
