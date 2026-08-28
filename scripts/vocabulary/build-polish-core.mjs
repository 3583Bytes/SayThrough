// Generates src/data/coreWords.pl.json — the Polish authored boards (§19.7).
//
// Not a translation of either existing board. Polish changes what belongs on a
// core board in ways the Romance/Germanic pair did not:
//
//  - CASE, not word order. `chcę wodę` / `nie chcę wody` — the noun changes
//    shape according to what governs it. The board therefore carries nouns in
//    the mianownik (citation form) and lets the word-forms popup supply the
//    cases, exactly the way it carries infinitives and supplies persons.
//  - ONE copula, but a heavily irregular one. `być` is the single most
//    important verb on the board and none of its forms are predictable, so the
//    Słowa pomocnicze page carries them explicitly (jestem / jesteś / jest /
//    jesteśmy / są), plus `mam` and `mogę`.
//  - PRO-DROP, like Spanish. Person lives on the verb, so the frame words
//    (`chcę`, `potrzebuję`, `mam`, `lubię`) are carried already conjugated and
//    everything else is an infinitive.
//  - NO ARTICLES. The cells Spanish spends on el/la/un/una and English on
//    a/the go to prepositions and particles instead, which Polish needs more
//    of because they govern case.
//  - `się` is its own cell. A large share of everyday Polish verbs are
//    reflexive (bawić się, nazywać się, cieszyć się) and the particle is
//    written separately, so it earns a core slot.
//
// Word lists adapted from published Polish core vocabulary work (słownictwo
// podstawowe / AAC materials from Polish practice) per the project's
// `adapt, don't invent` rule. §19.6 review is OUTSTANDING, as for every
// language — see docs/slp-review-pl.md.
//
// Usage: node scripts/vocabulary/build-polish-core.mjs

import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outPath = join(here, '..', '..', 'src', 'data', 'coreWords.pl.json')

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
  name: 'Słownictwo podstawowe (uproszczone)',
  shortName: 'Uproszczone',
  rows: 3,
  columns: 4,
  coreColumns: 2,
  core: core([
    ['ja', 'pronoun'], ['chcę', 'verb'],
    ['iść', 'verb'], ['jeszcze', 'little'],
    ['mój', 'pronoun'], ['nie', 'social'],
  ]),
  topicLevels: { Słowa: 1, Uczucia: 1, Jedzenie: 1, Picie: 1, Ludzie: 1 },
  corePages: { Słowa: 'verb', Uczucia: 'descriptor' },
  topics: {
    Słowa: core([['pomoc', 'noun'], ['stop', 'verb'], ['to', 'pronoun'], ['tam', 'little']]),
    Uczucia: core([['wesoły', 'descriptor'], ['smutny', 'descriptor'], ['zły', 'descriptor'], ['zmęczony', 'descriptor']]),
    Jedzenie: core([['jeść', 'verb'], ['głodny', 'descriptor'], ['ciastko', 'noun'], ['jabłko', 'noun']]),
    Picie: core([['pić', 'verb'], ['spragniony', 'descriptor'], ['woda', 'noun'], ['mleko', 'noun']]),
    Ludzie: core([['mama', 'noun'], ['tata', 'noun'], ['pani', 'noun'], ['kolega', 'noun']]),
  },
}

// ---------------------------------------------------------------------------
// 5×6 — the standard board. 15 core cells.
//
// Core layout (5 rows × 3 columns):
//   ja      ty       to          people and deixis
//   chcę    lubię    jeszcze     what I want
//   jest    mam      iść         the copula, having, the most-used verb
//   pomoc   stop     robić       regulation
//   się     tak      nie         the reflexive particle + polarity

const SIZE_5X6 = {
  name: 'Słownictwo podstawowe',
  shortName: 'Podstawowe',
  rows: 5,
  columns: 6,
  coreColumns: 3,
  core: core([
    ['ja', 'pronoun'], ['ty', 'pronoun'], ['to', 'pronoun'],
    ['chcę', 'verb'], ['lubię', 'verb'], ['jeszcze', 'little'],
    ['jest', 'verb'], ['mam', 'verb'], ['iść', 'verb'],
    ['pomoc', 'noun'], ['stop', 'verb'], ['robić', 'verb'],
    ['się', 'little'], ['tak', 'social'], ['nie', 'social'],
  ]),
  topicLevels: {
    Czynności: 1, 'Słowa pomocnicze': 1, Opisy: 1, Uczucia: 1,
    Grzeczność: 1, Pytania: 1, 'Małe słowa': 1, Jedzenie: 1, Picie: 1,
    Zabawa: 1, Ludzie: 1, Miejsca: 2, Szkoła: 2, Ciało: 2,
  },
  corePages: {
    Czynności: 'verb', 'Słowa pomocnicze': 'verb', Opisy: 'descriptor',
    Uczucia: 'descriptor', Grzeczność: 'social', Pytania: 'question',
    'Małe słowa': 'little',
  },
  topics: {
    Czynności: leveled([
      ['otworzyć', 'verb'], ['zamknąć', 'verb'], ['dać', 'verb'], ['brać', 'verb'],
      ['jeść', 'verb'], ['pić', 'verb'], ['spać', 'verb'], ['bawić', 'verb'],
      ['czytać', 'verb'], ['pisać', 'verb'], ['śpiewać', 'verb'], ['tańczyć', 'verb'],
      ['myć', 'verb'],
    ]),
    // `być` is one verb but none of its forms are predictable, so it gets a
    // page rather than a cell — the Polish counterpart of Helping Words.
    'Słowa pomocnicze': leveled([
      ['jestem', 'verb'], ['jesteś', 'verb'], ['jesteśmy', 'verb'], ['są', 'verb'],
      ['byłem', 'verb'], ['byłam', 'verb'], ['będzie', 'verb'], ['masz', 'verb'],
      ['mogę', 'verb'], ['możesz', 'verb'], ['muszę', 'verb'], ['trzeba', 'verb'],
      ['potrzebuję', 'verb'],
    ]),
    Opisy: leveled([
      ['duży', 'descriptor'], ['mały', 'descriptor'], ['dobry', 'descriptor'],
      ['zły', 'descriptor'], ['ładny', 'descriptor'], ['brzydki', 'descriptor'],
      ['szybki', 'descriptor'], ['wolny', 'descriptor'], ['gorący', 'descriptor'],
      ['zimny', 'descriptor'], ['czysty', 'descriptor'], ['brudny', 'descriptor'],
      ['nowy', 'descriptor'],
    ]),
    Uczucia: leveled([
      ['wesoły', 'descriptor'], ['smutny', 'descriptor'], ['zły', 'descriptor'],
      ['zmęczony', 'descriptor'], ['przestraszony', 'descriptor'], ['chory', 'descriptor'],
      ['boli', 'verb'], ['spokojny', 'descriptor'], ['znudzony', 'descriptor'],
      ['dumny', 'descriptor'], ['zdenerwowany', 'descriptor'], ['głodny', 'descriptor'],
      ['spragniony', 'descriptor'],
    ]),
    Grzeczność: leveled([
      ['cześć', 'social'], ['dzień dobry', 'social'], ['do widzenia', 'social'],
      ['dziękuję', 'social'], ['proszę', 'social'], ['przepraszam', 'social'],
      ['dobranoc', 'social'], ['kocham cię', 'social'], ['na razie', 'social'],
      ['smacznego', 'social'], ['gratulacje', 'social'], ['moja kolej', 'social'],
      ['twoja kolej', 'social'],
    ]),
    Pytania: leveled([
      ['co', 'question'], ['kto', 'question'], ['gdzie', 'question'],
      ['kiedy', 'question'], ['jak', 'question'], ['dlaczego', 'question'],
      ['który', 'question'], ['ile', 'question'], ['czyj', 'question'],
      ['dokąd', 'question'], ['po co', 'question'], ['z kim', 'question'],
      ['co to', 'question'],
    ]),
    'Małe słowa': leveled([
      ['w', 'little'], ['na', 'little'], ['do', 'little'], ['z', 'little'],
      ['od', 'little'], ['dla', 'little'], ['i', 'little'], ['albo', 'little'],
      ['ale', 'little'], ['bo', 'little'], ['pod', 'little'], ['nad', 'little'],
      ['bez', 'little'],
    ]),
    Jedzenie: leveled([
      ['jeść', 'verb'], ['głodny', 'descriptor'], ['ciastko', 'noun'],
      ['jabłko', 'noun'], ['banan', 'noun'], ['chleb', 'noun'], ['pizza', 'noun'],
      ['ser', 'noun'], ['kanapka', 'noun'], ['zupa', 'noun'], ['jajko', 'noun'],
      ['ryż', 'noun'], ['owoc', 'noun'],
    ]),
    Picie: leveled([
      ['pić', 'verb'], ['spragniony', 'descriptor'], ['woda', 'noun'],
      ['mleko', 'noun'], ['sok', 'noun'], ['herbata', 'noun'], ['kakao', 'noun'],
      ['kubek', 'noun'], ['szklanka', 'noun'], ['butelka', 'noun'],
      ['słomka', 'noun'], ['lód', 'noun'], ['kawa', 'noun'],
    ]),
    Zabawa: leveled([
      ['bawić', 'verb'], ['piłka', 'noun'], ['lalka', 'noun'], ['samochód', 'noun'],
      ['klocki', 'noun'], ['książka', 'noun'], ['muzyka', 'noun'], ['bańki', 'noun'],
      ['huśtawka', 'noun'], ['puzzle', 'noun'], ['rysować', 'verb'],
      ['rower', 'noun'], ['park', 'noun'],
    ]),
    Ludzie: leveled([
      ['mama', 'noun'], ['tata', 'noun'], ['brat', 'noun'], ['siostra', 'noun'],
      ['babcia', 'noun'], ['dziadek', 'noun'], ['kolega', 'noun'],
      ['koleżanka', 'noun'], ['pani', 'noun'], ['pan', 'noun'],
      ['dziecko', 'noun'], ['lekarz', 'noun'], ['rodzina', 'noun'],
    ]),
    Miejsca: leveled([
      ['dom', 'noun'], ['szkoła', 'noun'], ['łazienka', 'noun'], ['kuchnia', 'noun'],
      ['sklep', 'noun'], ['ulica', 'noun'], ['plaża', 'noun'], ['autobus', 'noun'],
      ['szpital', 'noun'], ['miasto', 'noun'], ['ogród', 'noun'], ['basen', 'noun'],
      ['las', 'noun'],
    ]),
    Szkoła: leveled([
      ['klasa', 'noun'], ['książka', 'noun'], ['ołówek', 'noun'], ['papier', 'noun'],
      ['stół', 'noun'], ['krzesło', 'noun'], ['plecak', 'noun'], ['tablica', 'noun'],
      ['przerwa', 'noun'], ['zadanie', 'noun'], ['nożyczki', 'noun'],
      ['klej', 'noun'], ['zeszyt', 'noun'],
    ]),
    Ciało: leveled([
      ['głowa', 'noun'], ['ręka', 'noun'], ['noga', 'noun'], ['oko', 'noun'],
      ['usta', 'noun'], ['nos', 'noun'], ['ucho', 'noun'], ['włosy', 'noun'],
      ['ząb', 'noun'], ['brzuch', 'noun'], ['palec', 'noun'], ['plecy', 'noun'],
      ['twarz', 'noun'],
    ]),
  },
}

// ---------------------------------------------------------------------------
// 6×10 — expanded. 24 core cells.
//
//   ja      ty        on        ona
//   to      tamto     co        gdzie
//   chcę    potrzebuję lubię    mam
//   jest    są        mogę      robić
//   iść     pomoc     stop      patrz
//   się     jeszcze   tak       nie

const SIZE_6X10 = {
  name: 'Słownictwo podstawowe (rozszerzone)',
  shortName: 'Rozszerzone',
  rows: 6,
  columns: 10,
  coreColumns: 4,
  core: core([
    ['ja', 'pronoun'], ['ty', 'pronoun'], ['on', 'pronoun'], ['ona', 'pronoun'],
    ['to', 'pronoun'], ['tamto', 'pronoun'], ['co', 'question'], ['gdzie', 'question'],
    ['chcę', 'verb'], ['potrzebuję', 'verb'], ['lubię', 'verb'], ['mam', 'verb'],
    ['jest', 'verb'], ['są', 'verb'], ['mogę', 'verb'], ['robić', 'verb'],
    ['iść', 'verb'], ['pomoc', 'noun'], ['stop', 'verb'], ['patrz', 'verb'],
    ['się', 'little'], ['jeszcze', 'little'], ['tak', 'social'], ['nie', 'social'],
  ]),
  topicLevels: {
    Czynności: 1, 'Słowa pomocnicze': 1, Zaimki: 1, Opisy: 1, Uczucia: 1,
    Grzeczność: 1, Pytania: 1, 'Małe słowa': 1, Czas: 1, Ilość: 1,
    Jedzenie: 1, Picie: 1, Zabawa: 1, Ludzie: 1, Miejsca: 2, Szkoła: 2,
    Ciało: 2, Zwierzęta: 2, Ubrania: 3, Mieszkanie: 3, Pogoda: 3,
  },
  corePages: {
    Czynności: 'verb', 'Słowa pomocnicze': 'verb', Zaimki: 'pronoun',
    Opisy: 'descriptor', Uczucia: 'descriptor', Grzeczność: 'social',
    Pytania: 'question', 'Małe słowa': 'little', Czas: 'little', Ilość: 'descriptor',
  },
  topics: {
    Czynności: leveled([
      ['otworzyć', 'verb'], ['zamknąć', 'verb'], ['dać', 'verb'], ['brać', 'verb'],
      ['jeść', 'verb'], ['pić', 'verb'], ['spać', 'verb'], ['bawić', 'verb'],
      ['czytać', 'verb'], ['pisać', 'verb'], ['śpiewać', 'verb'], ['tańczyć', 'verb'],
      ['myć', 'verb'], ['siedzieć', 'verb'], ['stać', 'verb'], ['biegać', 'verb'],
      ['skakać', 'verb'], ['czekać', 'verb'], ['szukać', 'verb'], ['słuchać', 'verb'],
      ['mówić', 'verb'], ['prosić', 'verb'], ['pomóc', 'verb'], ['widzieć', 'verb'],
      ['wiedzieć', 'verb'], ['rysować', 'verb'], ['ciąć', 'verb'], ['sprzątać', 'verb'],
      ['przytulić', 'verb'], ['rzucać', 'verb'], ['pchać', 'verb'], ['wracać', 'verb'],
      ['kończyć', 'verb'], ['zaczynać', 'verb'],
    ]),
    'Słowa pomocnicze': leveled([
      ['jestem', 'verb'], ['jesteś', 'verb'], ['jesteśmy', 'verb'], ['jesteście', 'verb'],
      ['byłem', 'verb'], ['byłam', 'verb'], ['było', 'verb'], ['będzie', 'verb'],
      ['będę', 'verb'], ['masz', 'verb'], ['ma', 'verb'], ['mamy', 'verb'],
      ['możesz', 'verb'], ['może', 'verb'], ['możemy', 'verb'], ['mogą', 'verb'],
      ['muszę', 'verb'], ['musisz', 'verb'], ['trzeba', 'verb'], ['można', 'verb'],
      ['chcesz', 'verb'], ['chce', 'verb'], ['chcemy', 'verb'], ['wolno', 'verb'],
      ['nie ma', 'verb'], ['był', 'verb'], ['była', 'verb'], ['będziemy', 'verb'],
      ['lubisz', 'verb'], ['lubi', 'verb'], ['umiem', 'verb'],
    ]),
    Zaimki: leveled([
      ['my', 'pronoun'], ['wy', 'pronoun'], ['oni', 'pronoun'], ['one', 'pronoun'],
      ['mnie', 'pronoun'], ['mi', 'pronoun'], ['ciebie', 'pronoun'], ['ci', 'pronoun'],
      ['go', 'pronoun'], ['jej', 'pronoun'], ['nas', 'pronoun'], ['nam', 'pronoun'],
      ['mój', 'pronoun'], ['moja', 'pronoun'], ['moje', 'pronoun'], ['twój', 'pronoun'],
      ['twoja', 'pronoun'], ['nasz', 'pronoun'], ['jego', 'pronoun'], ['ten', 'pronoun'],
      ['ta', 'pronoun'], ['tamten', 'pronoun'], ['taki', 'pronoun'], ['sam', 'pronoun'],
      ['ktoś', 'pronoun'], ['nikt', 'pronoun'], ['coś', 'pronoun'], ['nic', 'pronoun'],
      ['wszyscy', 'pronoun'], ['każdy', 'pronoun'], ['inny', 'pronoun'], ['siebie', 'pronoun'],
    ]),
    Opisy: leveled([
      ['duży', 'descriptor'], ['mały', 'descriptor'], ['dobry', 'descriptor'],
      ['zły', 'descriptor'], ['ładny', 'descriptor'], ['brzydki', 'descriptor'],
      ['szybki', 'descriptor'], ['wolny', 'descriptor'], ['gorący', 'descriptor'],
      ['zimny', 'descriptor'], ['czysty', 'descriptor'], ['brudny', 'descriptor'],
      ['nowy', 'descriptor'], ['stary', 'descriptor'], ['wysoki', 'descriptor'],
      ['niski', 'descriptor'], ['długi', 'descriptor'], ['krótki', 'descriptor'],
      ['mocny', 'descriptor'], ['miękki', 'descriptor'], ['twardy', 'descriptor'],
      ['pełny', 'descriptor'], ['pusty', 'descriptor'], ['zepsuty', 'descriptor'],
      ['taki sam', 'descriptor'], ['inny', 'descriptor'], ['czerwony', 'descriptor'],
      ['niebieski', 'descriptor'], ['zielony', 'descriptor'], ['żółty', 'descriptor'],
      ['czarny', 'descriptor'], ['biały', 'descriptor'], ['głośny', 'descriptor'],
    ]),
    Uczucia: leveled([
      ['wesoły', 'descriptor'], ['smutny', 'descriptor'], ['zły', 'descriptor'],
      ['zmęczony', 'descriptor'], ['przestraszony', 'descriptor'], ['chory', 'descriptor'],
      ['boli', 'verb'], ['spokojny', 'descriptor'], ['znudzony', 'descriptor'],
      ['dumny', 'descriptor'], ['zdenerwowany', 'descriptor'], ['głodny', 'descriptor'],
      ['spragniony', 'descriptor'], ['szczęśliwy', 'descriptor'], ['zaskoczony', 'descriptor'],
      ['samotny', 'descriptor'], ['bezpieczny', 'descriptor'], ['odważny', 'descriptor'],
      ['zazdrosny', 'descriptor'], ['zawstydzony', 'descriptor'], ['zdziwiony', 'descriptor'],
      ['podekscytowany', 'descriptor'], ['senny', 'descriptor'], ['zły humor', 'descriptor'],
      ['lepiej', 'descriptor'], ['gorzej', 'descriptor'], ['wygodnie', 'descriptor'],
      ['nudno', 'descriptor'],
    ]),
    Grzeczność: leveled([
      ['cześć', 'social'], ['dzień dobry', 'social'], ['do widzenia', 'social'],
      ['dziękuję', 'social'], ['przepraszam', 'social'], ['dobranoc', 'social'],
      ['kocham cię', 'social'], ['na razie', 'social'], ['smacznego', 'social'],
      ['gratulacje', 'social'], ['moja kolej', 'social'], ['twoja kolej', 'social'],
      ['jasne', 'social'], ['może', 'social'], ['jeszcze raz', 'social'],
      ['już', 'social'], ['zobacz', 'social'], ['fajnie', 'social'],
      ['śmieszne', 'social'], ['nic się nie stało', 'social'], ['poczekaj', 'social'],
      ['chodź tu', 'social'], ['zostaw', 'social'], ['nie chcę', 'social'],
      ['nie wiem', 'social'], ['nie lubię', 'social'], ['proszę bardzo', 'social'],
      ['jak się masz', 'social'], ['miło mi', 'social'], ['wszystkiego najlepszego', 'social'],
      ['dobrze', 'social'],
    ]),
    Pytania: leveled([
      ['kto', 'question'], ['kiedy', 'question'], ['jak', 'question'],
      ['dlaczego', 'question'], ['który', 'question'], ['ile', 'question'],
      ['czyj', 'question'], ['dokąd', 'question'], ['po co', 'question'],
      ['z kim', 'question'], ['co to', 'question'], ['kto to', 'question'],
      ['gdzie jest', 'question'], ['co się stało', 'question'], ['jak długo', 'question'],
      ['czy', 'question'], ['naprawdę', 'question'], ['co robić', 'question'],
      ['pomożesz', 'question'], ['skąd', 'question'],
    ]),
    'Małe słowa': leveled([
      ['w', 'little'], ['na', 'little'], ['do', 'little'], ['z', 'little'],
      ['od', 'little'], ['dla', 'little'], ['i', 'little'], ['albo', 'little'],
      ['ale', 'little'], ['bo', 'little'], ['że', 'little'], ['jeśli', 'little'],
      ['pod', 'little'], ['nad', 'little'], ['przed', 'little'], ['za', 'little'],
      ['obok', 'little'], ['między', 'little'], ['blisko', 'little'], ['daleko', 'little'],
      ['tu', 'little'], ['tam', 'little'], ['w górę', 'little'], ['w dół', 'little'],
      ['do środka', 'little'], ['na zewnątrz', 'little'], ['bez', 'little'],
      ['przy', 'little'], ['po', 'little'], ['też', 'little'], ['tylko', 'little'],
      ['razem', 'little'], ['osobno', 'little'], ['znowu', 'little'],
    ]),
    Czas: leveled([
      ['teraz', 'little'], ['potem', 'little'], ['przedtem', 'little'],
      ['dziś', 'little'], ['jutro', 'little'], ['wczoraj', 'little'],
      ['zawsze', 'little'], ['nigdy', 'little'], ['wkrótce', 'little'],
      ['późno', 'little'], ['wcześnie', 'little'], ['jeszcze nie', 'little'],
      ['rano', 'little'], ['po południu', 'little'], ['wieczorem', 'little'],
      ['w nocy', 'little'], ['godzina', 'noun'], ['dzień', 'noun'],
      ['tydzień', 'noun'], ['miesiąc', 'noun'], ['rok', 'noun'],
      ['minuta', 'noun'], ['weekend', 'noun'], ['urodziny', 'noun'],
    ]),
    Ilość: leveled([
      ['dużo', 'descriptor'], ['mało', 'descriptor'], ['wszystko', 'descriptor'],
      ['nic', 'descriptor'], ['coś', 'descriptor'], ['trochę', 'descriptor'],
      ['mniej', 'descriptor'], ['więcej', 'descriptor'], ['za dużo', 'descriptor'],
      ['pół', 'descriptor'], ['jeden', 'descriptor'], ['dwa', 'descriptor'],
      ['trzy', 'descriptor'], ['cztery', 'descriptor'], ['pięć', 'descriptor'],
      ['kilka', 'descriptor'], ['żaden', 'descriptor'], ['cały', 'descriptor'],
      ['każdy', 'descriptor'],
    ]),
    Jedzenie: leveled([
      ['jeść', 'verb'], ['głodny', 'descriptor'], ['ciastko', 'noun'],
      ['jabłko', 'noun'], ['banan', 'noun'], ['chleb', 'noun'], ['pizza', 'noun'],
      ['ser', 'noun'], ['kanapka', 'noun'], ['zupa', 'noun'], ['jajko', 'noun'],
      ['ryż', 'noun'], ['owoc', 'noun'], ['makaron', 'noun'], ['kurczak', 'noun'],
      ['ziemniak', 'noun'], ['marchewka', 'noun'], ['lody', 'noun'], ['obiad', 'noun'],
    ]),
    Picie: leveled([
      ['pić', 'verb'], ['spragniony', 'descriptor'], ['woda', 'noun'],
      ['mleko', 'noun'], ['sok', 'noun'], ['herbata', 'noun'], ['kakao', 'noun'],
      ['kubek', 'noun'], ['szklanka', 'noun'], ['butelka', 'noun'],
      ['słomka', 'noun'], ['lód', 'noun'], ['kawa', 'noun'], ['kompot', 'noun'],
      ['lemoniada', 'noun'], ['gorący', 'descriptor'], ['zimny', 'descriptor'],
      ['bidon', 'noun'], ['napój', 'noun'],
    ]),
    Zabawa: leveled([
      ['bawić', 'verb'], ['piłka', 'noun'], ['lalka', 'noun'], ['samochód', 'noun'],
      ['klocki', 'noun'], ['książka', 'noun'], ['muzyka', 'noun'], ['bańki', 'noun'],
      ['huśtawka', 'noun'], ['puzzle', 'noun'], ['rysować', 'verb'], ['rower', 'noun'],
      ['park', 'noun'], ['zjeżdżalnia', 'noun'], ['gra', 'noun'], ['tablet', 'noun'],
      ['miś', 'noun'], ['taniec', 'noun'], ['zabawka', 'noun'],
    ]),
    Ludzie: leveled([
      ['mama', 'noun'], ['tata', 'noun'], ['brat', 'noun'], ['siostra', 'noun'],
      ['babcia', 'noun'], ['dziadek', 'noun'], ['kolega', 'noun'], ['koleżanka', 'noun'],
      ['pani', 'noun'], ['pan', 'noun'], ['dziecko', 'noun'], ['lekarz', 'noun'],
      ['rodzina', 'noun'], ['ciocia', 'noun'], ['wujek', 'noun'], ['kuzyn', 'noun'],
      ['sąsiad', 'noun'], ['pielęgniarka', 'noun'], ['przyjaciel', 'noun'],
    ]),
    Miejsca: leveled([
      ['dom', 'noun'], ['szkoła', 'noun'], ['łazienka', 'noun'], ['kuchnia', 'noun'],
      ['sklep', 'noun'], ['ulica', 'noun'], ['plaża', 'noun'], ['autobus', 'noun'],
      ['szpital', 'noun'], ['miasto', 'noun'], ['ogród', 'noun'], ['basen', 'noun'],
      ['las', 'noun'], ['plac zabaw', 'noun'], ['biblioteka', 'noun'],
      ['kino', 'noun'], ['restauracja', 'noun'], ['góry', 'noun'], ['wieś', 'noun'],
    ]),
    Szkoła: leveled([
      ['klasa', 'noun'], ['książka', 'noun'], ['ołówek', 'noun'], ['papier', 'noun'],
      ['stół', 'noun'], ['krzesło', 'noun'], ['plecak', 'noun'], ['tablica', 'noun'],
      ['przerwa', 'noun'], ['zadanie', 'noun'], ['nożyczki', 'noun'], ['klej', 'noun'],
      ['zeszyt', 'noun'], ['kredka', 'noun'], ['komputer', 'noun'],
      ['stołówka', 'noun'], ['nauczyciel', 'noun'], ['lekcja', 'noun'],
    ]),
    Ciało: leveled([
      ['głowa', 'noun'], ['ręka', 'noun'], ['noga', 'noun'], ['oko', 'noun'],
      ['usta', 'noun'], ['nos', 'noun'], ['ucho', 'noun'], ['włosy', 'noun'],
      ['ząb', 'noun'], ['brzuch', 'noun'], ['palec', 'noun'], ['plecy', 'noun'],
      ['twarz', 'noun'], ['szyja', 'noun'], ['kolano', 'noun'], ['ramię', 'noun'],
      ['stopa', 'noun'], ['serce', 'noun'], ['język', 'noun'],
    ]),
    Zwierzęta: leveled([
      ['pies', 'noun'], ['kot', 'noun'], ['ptak', 'noun'], ['ryba', 'noun'],
      ['koń', 'noun'], ['krowa', 'noun'], ['świnia', 'noun'], ['owca', 'noun'],
      ['królik', 'noun'], ['mysz', 'noun'], ['niedźwiedź', 'noun'], ['lew', 'noun'],
      ['słoń', 'noun'], ['małpa', 'noun'], ['żółw', 'noun'], ['pająk', 'noun'],
      ['motyl', 'noun'], ['kaczka', 'noun'], ['kura', 'noun'],
    ]),
    Ubrania: leveled([
      ['koszulka', 'noun'], ['spodnie', 'noun'], ['buty', 'noun'],
      ['skarpetki', 'noun'], ['kurtka', 'noun'], ['sukienka', 'noun'],
      ['spódnica', 'noun'], ['sweter', 'noun'], ['czapka', 'noun'], ['szalik', 'noun'],
      ['rękawiczki', 'noun'], ['piżama', 'noun'], ['kalosze', 'noun'],
      ['kąpielówki', 'noun'], ['pasek', 'noun'], ['okulary', 'noun'],
      ['ubrać', 'verb'], ['zdjąć', 'verb'], ['guzik', 'noun'],
    ]),
    Mieszkanie: leveled([
      ['łóżko', 'noun'], ['drzwi', 'noun'], ['okno', 'noun'], ['kanapa', 'noun'],
      ['stół', 'noun'], ['krzesło', 'noun'], ['prysznic', 'noun'], ['koc', 'noun'],
      ['poduszka', 'noun'], ['lodówka', 'noun'], ['talerz', 'noun'], ['łyżka', 'noun'],
      ['widelec', 'noun'], ['nóż', 'noun'], ['mydło', 'noun'], ['ręcznik', 'noun'],
      ['światło', 'noun'], ['klucz', 'noun'], ['telewizor', 'noun'],
    ]),
    Pogoda: leveled([
      ['słońce', 'noun'], ['deszcz', 'noun'], ['śnieg', 'noun'], ['wiatr', 'noun'],
      ['chmura', 'noun'], ['ciepło', 'descriptor'], ['zimno', 'descriptor'],
      ['burza', 'noun'], ['słonecznie', 'descriptor'], ['pochmurno', 'descriptor'],
      ['pada', 'verb'], ['mgła', 'noun'], ['tęcza', 'noun'], ['parasol', 'noun'],
    ]),
  },
}

// ---------------------------------------------------------------------------

const doc = {
  _comment: [
    'Authored Polish layouts for the bundled Słownictwo podstawowe set (§19.7).',
    '',
    'GENERATED by scripts/vocabulary/build-polish-core.mjs — edit that file,',
    'not this one, and re-run `npm run polish-core`.',
    '',
    'Same schema as coreWords.json: one entry per GRID SIZE, each word is',
    '[label, partOfSpeech, level].',
    '',
    'Not a translation of the English or Spanish boards. Polish inflects nouns',
    'for CASE (governed by the verb or preposition, so the board carries the',
    'mianownik and the word-forms popup supplies the rest), has one heavily',
    'irregular copula rather than two regular ones, uses no articles, and',
    'writes the reflexive particle `się` separately often enough that it earns',
    'a core cell. See the generator header.',
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
  console.error('Polish board problems:\n  ' + problems.join('\n  '))
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
