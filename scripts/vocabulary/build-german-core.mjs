// Generates src/data/coreWords.de.json — the German boards (§19.7).
//
// The first board here that is not a Romance or Slavic sibling. What drove the
// choices:
//
//  - MODALS ARE CORE, and not only because `ich will` is core AAC vocabulary.
//    German separable verbs put their prefix at the end of the clause
//    (*ich stehe … auf*), which a tap-a-word-at-a-time bar cannot produce — but
//    after a modal the verb stays whole and the sentence is correct:
//    `ich will aufstehen`. So `will`, `kann`, `muss` and `möchte` sit in the
//    persistent core, and the board is built to lean on them. See the header of
//    src/services/morphology.de.ts.
//  - CONTRACTIONS earn cells, as in Italian and Portuguese. `in`, `zu` and `an`
//    fuse with a following article (in+dem=im, zu+der=zur) and while German's
//    fusion is preferred rather than strictly required, `in dem Haus` sounds
//    stilted every single time. See src/services/contractions.ts.
//  - NOUNS ARE CAPITALISED. Not a style choice — a lowercase noun is a spelling
//    error, and the board is the thing teaching the written form.
//  - `mögen` vs `möchten`. `ich mag Kekse` is liking; `ich möchte Kekse` is
//    asking. A requesting board needs the second far more, so `möchte` takes
//    the cell and `mag` sits on the Hilfswörter page.
//
// Word lists adapted from published German Kernvokabular work (UK materials
// from German practice) per the project's `adapt, don't invent` rule.
// §19.6 review is OUTSTANDING.
//
// Usage: node scripts/vocabulary/build-german-core.mjs

import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outPath = join(here, '..', '..', 'src', 'data', 'coreWords.de.json')

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
  name: 'Kernwortschatz (einfach)',
  shortName: 'Einfach',
  rows: 3,
  columns: 4,
  coreColumns: 2,
  core: core([
    ['ich', 'pronoun'], ['will', 'verb'],
    ['gehen', 'verb'], ['mehr', 'little'],
    ['mein', 'pronoun'], ['nein', 'social'],
  ]),
  topicLevels: { Wörter: 1, Gefühle: 1, Essen: 1, Trinken: 1, Menschen: 1 },
  corePages: { Wörter: 'verb', Gefühle: 'descriptor' },
  topics: {
    Wörter: core([['Hilfe', 'noun'], ['stopp', 'verb'], ['das', 'pronoun'], ['nochmal', 'little']]),
    Gefühle: core([['froh', 'descriptor'], ['traurig', 'descriptor'], ['wütend', 'descriptor'], ['müde', 'descriptor']]),
    Essen: core([['essen', 'verb'], ['Hunger', 'noun'], ['Keks', 'noun'], ['Apfel', 'noun']]),
    Trinken: core([['trinken', 'verb'], ['Durst', 'noun'], ['Wasser', 'noun'], ['Milch', 'noun']]),
    Menschen: core([['Mama', 'noun'], ['Papa', 'noun'], ['Lehrerin', 'noun'], ['Freund', 'noun']]),
  },
}

// ---------------------------------------------------------------------------
// 5×6 — the standard board.

const SIZE_5X6 = {
  name: 'Kernwortschatz',
  shortName: 'Standard',
  rows: 5,
  columns: 6,
  coreColumns: 3,
  core: core([
    ['ich', 'pronoun'], ['du', 'pronoun'], ['das', 'pronoun'],
    ['will', 'verb'], ['mag', 'verb'], ['mehr', 'little'],
    ['ist', 'verb'], ['habe', 'verb'], ['gehen', 'verb'],
    ['Hilfe', 'noun'], ['stopp', 'verb'], ['machen', 'verb'],
    ['nicht', 'little'], ['ja', 'social'], ['nein', 'social'],
  ]),
  topicLevels: {
    Tun: 1, Hilfswörter: 1, Beschreiben: 1, Gefühle: 1, Soziales: 1,
    Fragen: 1, Kleine: 1, Essen: 1, Trinken: 1, Spielen: 1, Menschen: 1,
    Orte: 2, Schule: 2, Körper: 2,
  },
  corePages: {
    Tun: 'verb', Hilfswörter: 'verb', Beschreiben: 'descriptor',
    Gefühle: 'descriptor', Soziales: 'social', Fragen: 'question',
    Kleine: 'little',
  },
  topics: {
    Tun: leveled([
      ['aufmachen', 'verb'], ['zumachen', 'verb'], ['geben', 'verb'], ['nehmen', 'verb'],
      ['legen', 'verb'], ['waschen', 'verb'], ['lesen', 'verb'], ['schreiben', 'verb'],
      ['singen', 'verb'], ['tanzen', 'verb'], ['laufen', 'verb'], ['springen', 'verb'],
      ['sitzen', 'verb'],
    ]),
    Hilfswörter: leveled([
      ['kann', 'verb'], ['muss', 'verb'], ['möchte', 'verb'], ['bin', 'verb'],
      ['bist', 'verb'], ['sind', 'verb'], ['hat', 'verb'], ['war', 'verb'],
      ['wird', 'verb'], ['darf', 'verb'], ['soll', 'verb'], ['weiß', 'verb'],
      ['brauche', 'verb'],
    ]),
    Beschreiben: leveled([
      ['groß', 'descriptor'], ['klein', 'descriptor'], ['schön', 'descriptor'],
      ['neu', 'descriptor'], ['alt', 'descriptor'], ['heiß', 'descriptor'],
      ['kalt', 'descriptor'], ['schnell', 'descriptor'], ['langsam', 'descriptor'],
      ['schmutzig', 'descriptor'], ['sauber', 'descriptor'], ['gut', 'descriptor'],
      ['laut', 'descriptor'],
    ]),
    Gefühle: leveled([
      ['froh', 'descriptor'], ['traurig', 'descriptor'], ['wütend', 'descriptor'],
      ['müde', 'descriptor'], ['krank', 'descriptor'], ['ängstlich', 'descriptor'],
      ['gelangweilt', 'descriptor'], ['zufrieden', 'descriptor'], ['besorgt', 'descriptor'],
      ['allein', 'descriptor'], ['stolz', 'descriptor'], ['aufgeregt', 'descriptor'],
      ['ruhig', 'descriptor'],
    ]),
    Soziales: leveled([
      ['hallo', 'social'], ['tschüss', 'social'], ['danke', 'social'],
      ['bitte', 'social'], ['entschuldigung', 'social'], ['wie geht es dir', 'social'],
      ['gut', 'social'], ['guten Morgen', 'social'], ['gute Nacht', 'social'],
      ['bis später', 'social'], ['tut mir leid', 'social'], ['willkommen', 'social'],
      ['ich bin dran', 'social'],
    ]),
    Fragen: leveled([
      ['was', 'question'], ['wo', 'question'], ['wer', 'question'],
      ['wann', 'question'], ['warum', 'question'], ['wie', 'question'],
      ['welche', 'question'], ['wie viel', 'question'], ['wie viele', 'question'],
      ['wer ist das', 'question'], ['was ist das', 'question'], ['wo ist', 'question'],
      ['warum nicht', 'question'],
    ]),
    Kleine: leveled([
      // `dem` earns a cell at this size because it is the FUSING partner:
      // without it `im`, `zum` and `am` are unreachable on a 5×6 board, and
      // those are the forms a German speaker actually uses. `eine` is the one
      // it displaces, because the word-forms popup on `ein` still offers it.
      ['der', 'little'], ['die', 'little'], ['ein', 'little'], ['dem', 'little'],
      ['und', 'little'], ['oder', 'little'], ['aber', 'little'], ['in', 'little'],
      ['auf', 'little'], ['mit', 'little'], ['für', 'little'], ['zu', 'little'],
      ['an', 'little'],
    ]),
    Essen: leveled([
      ['essen', 'verb'], ['Hunger', 'noun'], ['Brot', 'noun'], ['Nudeln', 'noun'],
      ['Pizza', 'noun'], ['Apfel', 'noun'], ['Banane', 'noun'], ['Keks', 'noun'],
      ['Käse', 'noun'], ['Reis', 'noun'], ['Fleisch', 'noun'], ['Suppe', 'noun'],
      ['Eis', 'noun'],
    ]),
    Trinken: leveled([
      ['trinken', 'verb'], ['Durst', 'noun'], ['Wasser', 'noun'], ['Milch', 'noun'],
      ['Saft', 'noun'], ['Tee', 'noun'], ['Kaffee', 'noun'], ['Limo', 'noun'],
      ['Glas', 'noun'], ['Strohhalm', 'noun'], ['Kakao', 'noun'], ['Flasche', 'noun'],
      ['Tasse', 'noun'],
    ]),
    Spielen: leveled([
      ['spielen', 'verb'], ['Ball', 'noun'], ['Spiel', 'noun'], ['Musik', 'noun'],
      ['Buch', 'noun'], ['malen', 'verb'], ['bauen', 'verb'], ['Schaukel', 'noun'],
      ['Seifenblasen', 'noun'], ['Puzzle', 'noun'], ['Auto', 'noun'], ['Puppe', 'noun'],
      ['Verstecken', 'noun'],
    ]),
    Menschen: leveled([
      ['Mama', 'noun'], ['Papa', 'noun'], ['Oma', 'noun'], ['Opa', 'noun'],
      ['Bruder', 'noun'], ['Schwester', 'noun'], ['Freund', 'noun'], ['Freundin', 'noun'],
      ['Lehrerin', 'noun'], ['Arzt', 'noun'], ['Junge', 'noun'], ['Mädchen', 'noun'],
      ['Familie', 'noun'],
    ]),
    Orte: leveled([
      ['Haus', 'noun'], ['Schule', 'noun'], ['draußen', 'little'], ['drinnen', 'little'],
      ['Bad', 'noun'], ['Küche', 'noun'], ['Zimmer', 'noun'], ['Park', 'noun'],
      ['Laden', 'noun'], ['Auto', 'noun'], ['Garten', 'noun'], ['Krankenhaus', 'noun'],
      ['Strand', 'noun'],
    ]),
    Schule: leveled([
      ['Klasse', 'noun'], ['Heft', 'noun'], ['Stift', 'noun'], ['Tisch', 'noun'],
      ['Rucksack', 'noun'], ['Hausaufgaben', 'noun'], ['Pause', 'noun'], ['Mensa', 'noun'],
      ['Tafel', 'noun'], ['Kleber', 'noun'], ['Schere', 'noun'], ['Papier', 'noun'],
      ['Turnhalle', 'noun'],
    ]),
    Körper: leveled([
      ['Kopf', 'noun'], ['Hand', 'noun'], ['Fuß', 'noun'], ['Bauch', 'noun'],
      ['Auge', 'noun'], ['Ohr', 'noun'], ['Mund', 'noun'], ['Nase', 'noun'],
      ['Arm', 'noun'], ['Bein', 'noun'], ['Haar', 'noun'], ['Zahn', 'noun'],
      ['Rücken', 'noun'],
    ]),
  },
}

// ---------------------------------------------------------------------------
// 6×10 — the expanded board.

const SIZE_6X10 = {
  name: 'Kernwortschatz (erweitert)',
  shortName: 'Erweitert',
  rows: 6,
  columns: 10,
  coreColumns: 4,
  core: core([
    ['ich', 'pronoun'], ['du', 'pronoun'], ['er', 'pronoun'], ['sie', 'pronoun'],
    ['das', 'pronoun'], ['es', 'pronoun'], ['was', 'question'], ['wo', 'question'],
    ['will', 'verb'], ['möchte', 'verb'], ['mag', 'verb'], ['habe', 'verb'],
    ['ist', 'verb'], ['kann', 'verb'], ['muss', 'verb'], ['machen', 'verb'],
    ['gehen', 'verb'], ['Hilfe', 'noun'], ['stopp', 'verb'], ['schau', 'verb'],
    ['mehr', 'little'], ['nicht', 'little'], ['ja', 'social'], ['nein', 'social'],
  ]),
  topicLevels: {
    Tun: 1, Hilfswörter: 1, Fürwörter: 1, Beschreiben: 1, Gefühle: 1,
    Soziales: 1, Fragen: 1, Kleine: 1, Zeit: 1, Menge: 1,
    Essen: 1, Trinken: 1, Spielen: 1, Menschen: 1, Orte: 2, Schule: 2,
    Körper: 2, Tiere: 2, Kleidung: 2, 'Zu Hause': 2, Wetter: 3,
  },
  corePages: {
    Tun: 'verb', Hilfswörter: 'verb', Fürwörter: 'pronoun',
    Beschreiben: 'descriptor', Gefühle: 'descriptor', Soziales: 'social',
    Fragen: 'question', Kleine: 'little', Zeit: 'little', Menge: 'little',
  },
  topics: {
    Tun: leveled([
      ['aufmachen', 'verb'], ['zumachen', 'verb'], ['geben', 'verb'], ['nehmen', 'verb'],
      ['legen', 'verb'], ['waschen', 'verb'], ['essen', 'verb'], ['trinken', 'verb'],
      ['schlafen', 'verb'], ['spielen', 'verb'], ['lesen', 'verb'], ['schreiben', 'verb'],
      ['singen', 'verb'], ['tanzen', 'verb'], ['laufen', 'verb'], ['springen', 'verb'],
      ['sitzen', 'verb'], ['aufstehen', 'verb'], ['kommen', 'verb'], ['anziehen', 'verb'],
      ['ausziehen', 'verb'], ['suchen', 'verb'], ['finden', 'verb'], ['hören', 'verb'],
      ['anfassen', 'verb'], ['warten', 'verb'], ['aufhören', 'verb'], ['anfangen', 'verb'],
      ['kaufen', 'verb'], ['putzen', 'verb'], ['kochen', 'verb'], ['malen', 'verb'],
      ['bauen', 'verb'], ['helfen', 'verb'],
    ]),
    Hilfswörter: leveled([
      ['bin', 'verb'], ['bist', 'verb'], ['sind', 'verb'], ['seid', 'verb'],
      ['hat', 'verb'], ['hast', 'verb'], ['haben', 'verb'], ['darf', 'verb'],
      ['soll', 'verb'], ['weiß', 'verb'], ['brauche', 'verb'], ['war', 'verb'],
      ['waren', 'verb'], ['wird', 'verb'], ['werden', 'verb'], ['könnte', 'verb'],
      ['müsste', 'verb'], ['würde', 'verb'], ['denke', 'verb'], ['glaube', 'verb'],
      ['hoffe', 'verb'], ['gehe', 'verb'], ['komme', 'verb'], ['bleibe', 'verb'],
      ['gefällt', 'verb'], ['tut weh', 'verb'], ['weiß nicht', 'verb'], ['gibt', 'verb'],
      ['gibt es', 'verb'], ['lass uns', 'verb'], ['bitte nicht', 'verb'],
    ]),
    Fürwörter: leveled([
      ['wir', 'pronoun'], ['ihr', 'pronoun'], ['mich', 'pronoun'], ['dich', 'pronoun'],
      ['mir', 'pronoun'], ['dir', 'pronoun'], ['uns', 'pronoun'], ['euch', 'pronoun'],
      ['ihn', 'pronoun'], ['ihm', 'pronoun'], ['mein', 'pronoun'], ['dein', 'pronoun'],
      ['sein', 'pronoun'], ['unser', 'pronoun'], ['dieser', 'pronoun'], ['jener', 'pronoun'],
      ['alle', 'pronoun'], ['alles', 'pronoun'], ['jemand', 'pronoun'], ['niemand', 'pronoun'],
      ['etwas', 'pronoun'], ['nichts', 'pronoun'], ['andere', 'pronoun'], ['selbst', 'pronoun'],
      ['jeder', 'pronoun'], ['beide', 'pronoun'], ['man', 'pronoun'], ['wen', 'pronoun'],
      ['wem', 'pronoun'], ['diese', 'pronoun'], ['dieses', 'pronoun'], ['solche', 'pronoun'],
    ]),
    Beschreiben: leveled([
      ['groß', 'descriptor'], ['klein', 'descriptor'], ['schön', 'descriptor'],
      ['hässlich', 'descriptor'], ['neu', 'descriptor'], ['alt', 'descriptor'],
      ['heiß', 'descriptor'], ['kalt', 'descriptor'], ['schnell', 'descriptor'],
      ['langsam', 'descriptor'], ['schmutzig', 'descriptor'], ['sauber', 'descriptor'],
      ['gut', 'descriptor'], ['schlecht', 'descriptor'], ['laut', 'descriptor'],
      ['leise', 'descriptor'], ['hart', 'descriptor'], ['weich', 'descriptor'],
      ['lang', 'descriptor'], ['kurz', 'descriptor'], ['hoch', 'descriptor'],
      ['niedrig', 'descriptor'], ['voll', 'descriptor'], ['leer', 'descriptor'],
      ['leicht', 'descriptor'], ['schwer', 'descriptor'], ['richtig', 'descriptor'],
      ['falsch', 'descriptor'], ['lustig', 'descriptor'], ['langweilig', 'descriptor'],
      ['lieblings', 'descriptor'], ['fertig', 'descriptor'], ['kaputt', 'descriptor'],
    ]),
    Gefühle: leveled([
      ['froh', 'descriptor'], ['traurig', 'descriptor'], ['wütend', 'descriptor'],
      ['müde', 'descriptor'], ['krank', 'descriptor'], ['ängstlich', 'descriptor'],
      ['gelangweilt', 'descriptor'], ['zufrieden', 'descriptor'], ['besorgt', 'descriptor'],
      ['allein', 'descriptor'], ['stolz', 'descriptor'], ['aufgeregt', 'descriptor'],
      ['ruhig', 'descriptor'], ['nervös', 'descriptor'], ['überrascht', 'descriptor'],
      ['verwirrt', 'descriptor'], ['enttäuscht', 'descriptor'], ['peinlich', 'descriptor'],
      ['frustriert', 'descriptor'], ['sicher', 'descriptor'], ['Schmerzen', 'noun'],
      ['Angst', 'noun'], ['Durst', 'noun'], ['Hunger', 'noun'], ['okay', 'descriptor'],
      ['so lala', 'descriptor'], ['glücklich', 'descriptor'], ['einsam', 'descriptor'],
    ]),
    Soziales: leveled([
      ['hallo', 'social'], ['tschüss', 'social'], ['danke', 'social'],
      ['bitte', 'social'], ['entschuldigung', 'social'], ['wie geht es dir', 'social'],
      ['guten Morgen', 'social'], ['guten Abend', 'social'], ['gute Nacht', 'social'],
      ['bis später', 'social'], ['tut mir leid', 'social'], ['willkommen', 'social'],
      ['ich bin dran', 'social'], ['du bist dran', 'social'], ['toll gemacht', 'social'],
      ['warte', 'social'], ['schau mal', 'social'], ['komm her', 'social'],
      ['lass mich', 'social'], ['alles klar', 'social'], ['nicht okay', 'social'],
      ['nochmal', 'social'], ['viel Glück', 'social'], ['herzlichen Glückwunsch', 'social'],
      ['gute Besserung', 'social'], ['guten Appetit', 'social'], ['bis morgen', 'social'],
      ['freut mich', 'social'], ['Geheimnis', 'social'], ['gern geschehen', 'social'],
      ['keine Ahnung', 'social'],
    ]),
    Fragen: leveled([
      ['wer', 'question'], ['wann', 'question'], ['warum', 'question'],
      ['wie', 'question'], ['welche', 'question'], ['wie viel', 'question'],
      ['wie viele', 'question'], ['wer ist das', 'question'], ['was ist das', 'question'],
      ['wo ist', 'question'], ['warum nicht', 'question'], ['wieso', 'question'],
      ['wohin', 'question'], ['woher', 'question'], ['was kostet das', 'question'],
      ['um wie viel Uhr', 'question'], ['darf ich', 'question'], ['wirklich', 'question'],
      ['stimmt das', 'question'], ['und dann', 'question'],
    ]),
    Kleine: leveled([
      ['der', 'little'], ['die', 'little'], ['dem', 'little'], ['ein', 'little'],
      ['eine', 'little'], ['und', 'little'], ['oder', 'little'], ['aber', 'little'],
      ['in', 'little'], ['auf', 'little'], ['mit', 'little'], ['für', 'little'],
      ['zu', 'little'], ['an', 'little'], ['von', 'little'], ['bei', 'little'],
      ['ohne', 'little'], ['über', 'little'], ['unter', 'little'], ['neben', 'little'],
      ['hinter', 'little'], ['vor', 'little'], ['drinnen', 'little'], ['draußen', 'little'],
      ['hier', 'little'], ['da', 'little'], ['auch', 'little'], ['nur', 'little'],
      ['noch', 'little'], ['schon', 'little'], ['weil', 'little'], ['wenn', 'little'],
      ['dass', 'little'], ['sehr', 'little'],
    ]),
    Zeit: leveled([
      ['jetzt', 'little'], ['später', 'little'], ['vorher', 'little'], ['heute', 'little'],
      ['morgen', 'little'], ['gestern', 'little'], ['Morgen', 'noun'], ['Mittag', 'noun'],
      ['Abend', 'noun'], ['Nacht', 'noun'], ['früh', 'little'], ['spät', 'little'],
      ['immer', 'little'], ['nie', 'little'], ['manchmal', 'little'], ['sofort', 'little'],
      ['Minute', 'noun'], ['Stunde', 'noun'], ['Tag', 'noun'], ['Woche', 'noun'],
      ['Monat', 'noun'], ['Jahr', 'noun'], ['Wochenende', 'noun'], ['Geburtstag', 'noun'],
    ]),
    Menge: leveled([
      ['viel', 'little'], ['wenig', 'little'], ['nichts mehr', 'little'], ['alles', 'little'],
      ['noch eins', 'little'], ['genug', 'little'], ['zu viel', 'little'], ['halb', 'little'],
      ['eins', 'little'], ['zwei', 'little'], ['drei', 'little'], ['vier', 'little'],
      ['fünf', 'little'], ['sechs', 'little'], ['sieben', 'little'], ['acht', 'little'],
      ['neun', 'little'], ['zehn', 'little'], ['viele', 'little'],
    ]),
    Essen: leveled([
      ['Brot', 'noun'], ['Nudeln', 'noun'], ['Pizza', 'noun'], ['Apfel', 'noun'],
      ['Banane', 'noun'], ['Keks', 'noun'], ['Käse', 'noun'], ['Reis', 'noun'],
      ['Fleisch', 'noun'], ['Suppe', 'noun'], ['Eis', 'noun'], ['Pommes', 'noun'],
      ['Ei', 'noun'], ['Hähnchen', 'noun'], ['Fisch', 'noun'], ['Gemüse', 'noun'],
      ['Obst', 'noun'], ['Kuchen', 'noun'], ['Joghurt', 'noun'],
    ]),
    Trinken: leveled([
      ['Wasser', 'noun'], ['Milch', 'noun'], ['Saft', 'noun'], ['Tee', 'noun'],
      ['Kaffee', 'noun'], ['Limo', 'noun'], ['Glas', 'noun'], ['Strohhalm', 'noun'],
      ['Kakao', 'noun'], ['Flasche', 'noun'], ['Tasse', 'noun'], ['Eiswürfel', 'noun'],
      ['Smoothie', 'noun'], ['Sprudel', 'noun'], ['Becher', 'noun'], ['warm', 'descriptor'],
      ['Trinkflasche', 'noun'], ['Apfelsaft', 'noun'], ['Orangensaft', 'noun'],
    ]),
    Spielen: leveled([
      ['Ball', 'noun'], ['Spiel', 'noun'], ['Musik', 'noun'], ['Buch', 'noun'],
      ['Schaukel', 'noun'], ['Seifenblasen', 'noun'], ['Puzzle', 'noun'], ['Puppe', 'noun'],
      ['Verstecken', 'noun'], ['Tablet', 'noun'], ['Fernseher', 'noun'], ['Film', 'noun'],
      ['Lied', 'noun'], ['Fahrrad', 'noun'], ['Rutsche', 'noun'], ['Sand', 'noun'],
      ['Bausteine', 'noun'], ['Knete', 'noun'], ['Ballon', 'noun'],
    ]),
    Menschen: leveled([
      ['Mama', 'noun'], ['Papa', 'noun'], ['Oma', 'noun'], ['Opa', 'noun'],
      ['Bruder', 'noun'], ['Schwester', 'noun'], ['Freund', 'noun'], ['Freundin', 'noun'],
      ['Lehrerin', 'noun'], ['Arzt', 'noun'], ['Junge', 'noun'], ['Mädchen', 'noun'],
      ['Familie', 'noun'], ['Tante', 'noun'], ['Onkel', 'noun'], ['Baby', 'noun'],
      ['Frau', 'noun'], ['Mann', 'noun'], ['Kind', 'noun'],
    ]),
    Orte: leveled([
      ['Haus', 'noun'], ['Schule', 'noun'], ['Bad', 'noun'], ['Küche', 'noun'],
      ['Zimmer', 'noun'], ['Park', 'noun'], ['Laden', 'noun'], ['Auto', 'noun'],
      ['Garten', 'noun'], ['Krankenhaus', 'noun'], ['Strand', 'noun'], ['Schwimmbad', 'noun'],
      ['Straße', 'noun'], ['Bus', 'noun'], ['Zug', 'noun'], ['Kino', 'noun'],
      ['Restaurant', 'noun'], ['Spielplatz', 'noun'], ['Zoo', 'noun'],
    ]),
    Schule: leveled([
      ['Klasse', 'noun'], ['Heft', 'noun'], ['Stift', 'noun'], ['Tisch', 'noun'],
      ['Rucksack', 'noun'], ['Hausaufgaben', 'noun'], ['Pause', 'noun'], ['Mensa', 'noun'],
      ['Tafel', 'noun'], ['Kleber', 'noun'], ['Schere', 'noun'], ['Papier', 'noun'],
      ['Turnhalle', 'noun'], ['Stuhl', 'noun'], ['Lineal', 'noun'], ['Buchstaben', 'noun'],
      ['Zahlen', 'noun'], ['Ausflug', 'noun'],
    ]),
    Körper: leveled([
      ['Kopf', 'noun'], ['Hand', 'noun'], ['Fuß', 'noun'], ['Bauch', 'noun'],
      ['Auge', 'noun'], ['Ohr', 'noun'], ['Mund', 'noun'], ['Nase', 'noun'],
      ['Arm', 'noun'], ['Bein', 'noun'], ['Haar', 'noun'], ['Zahn', 'noun'],
      ['Rücken', 'noun'], ['Finger', 'noun'], ['Knie', 'noun'], ['Schulter', 'noun'],
      ['Hals', 'noun'], ['Gesicht', 'noun'], ['Haut', 'noun'],
    ]),
    Tiere: leveled([
      ['Hund', 'noun'], ['Katze', 'noun'], ['Vogel', 'noun'], ['Pferd', 'noun'],
      ['Kuh', 'noun'], ['Schwein', 'noun'], ['Schaf', 'noun'], ['Hase', 'noun'],
      ['Maus', 'noun'], ['Löwe', 'noun'], ['Elefant', 'noun'], ['Affe', 'noun'],
      ['Bär', 'noun'], ['Biene', 'noun'], ['Schmetterling', 'noun'], ['Spinne', 'noun'],
      ['Schlange', 'noun'], ['Ente', 'noun'], ['Huhn', 'noun'],
    ]),
    Kleidung: leveled([
      ['Hemd', 'noun'], ['Hose', 'noun'], ['Schuh', 'noun'], ['Socken', 'noun'],
      ['Jacke', 'noun'], ['Mütze', 'noun'], ['Kleid', 'noun'], ['Rock', 'noun'],
      ['Pullover', 'noun'], ['Schlafanzug', 'noun'], ['Handschuhe', 'noun'], ['Schal', 'noun'],
      ['Stiefel', 'noun'], ['Mantel', 'noun'], ['Brille', 'noun'], ['Knopf', 'noun'],
      ['Reißverschluss', 'noun'], ['Badeanzug', 'noun'], ['Windel', 'noun'],
    ]),
    'Zu Hause': leveled([
      ['Bett', 'noun'], ['Sofa', 'noun'], ['Tür', 'noun'], ['Fenster', 'noun'],
      ['Licht', 'noun'], ['Dusche', 'noun'], ['Seife', 'noun'], ['Handtuch', 'noun'],
      ['Zahnbürste', 'noun'], ['Kamm', 'noun'], ['Decke', 'noun'], ['Kissen', 'noun'],
      ['Teller', 'noun'], ['Gabel', 'noun'], ['Löffel', 'noun'], ['Messer', 'noun'],
      ['Kühlschrank', 'noun'], ['Schrank', 'noun'], ['Treppe', 'noun'],
    ]),
    Wetter: leveled([
      ['Sonne', 'noun'], ['Regen', 'noun'], ['Schnee', 'noun'], ['Wind', 'noun'],
      ['Wolke', 'noun'], ['Gewitter', 'noun'], ['Regenbogen', 'noun'], ['Nebel', 'noun'],
      ['nass', 'descriptor'], ['trocken', 'descriptor'], ['Regenschirm', 'noun'],
      ['Himmel', 'noun'], ['sonnig', 'descriptor'], ['windig', 'descriptor'],
    ]),
  },
}

const doc = {
  _comment: [
    'Authored German boards (§19.7). Generated by',
    'scripts/vocabulary/build-german-core.mjs — edit that, not this file.',
    '',
    'MODALS ARE CORE. German separable verbs put their prefix at the end of the',
    'clause (ich stehe … auf), which a tap-at-a-time bar cannot produce — but',
    'after a modal the verb stays whole: `ich will aufstehen` is correct German.',
    'So will/kann/muss/möchte hold core cells and the board leans on them.',
    '',
    'Nouns are capitalised because in German that is spelling, not style.',
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
  // German-specific: a noun written lowercase is a spelling error, and the
  // board is what teaches the written form.
  for (const [topic, words] of Object.entries(layout.topics)) {
    for (const [label, pos] of words) {
      if (pos === 'noun' && label[0] !== label[0].toUpperCase()) {
        problems.push(`${size}/${topic}: noun "${label}" is not capitalised`)
      }
    }
  }
}
if (problems.length) {
  console.error('German board problems:\n  ' + problems.join('\n  '))
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
