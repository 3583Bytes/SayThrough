import { PartOfSpeech } from '../constants/colors'

// Hard-coded 5×6 home page following the §19.2 persistent-core template:
// columns 0–2 = the 15-word persistent core region (identical on every
// page once real page sets land), columns 3–5 = page-specific words.
// Word list is the §19.3 candidate set, pending SLP validation.
// Replaced by SQLite-backed page sets in the next milestone.

export interface GridButton {
  id: string
  label: string
  pos: PartOfSpeech
  row: number
  column: number
}

export const GRID_ROWS = 5
export const GRID_COLUMNS = 6

const core: Array<[string, PartOfSpeech]> = [
  // row-major, columns 0–2
  ['I', 'pronoun'],
  ['you', 'pronoun'],
  ['it', 'pronoun'],
  ['want', 'verb'],
  ['like', 'verb'],
  ['more', 'little'],
  ['go', 'verb'],
  ['help', 'verb'],
  ['stop', 'verb'],
  ['do', 'verb'],
  ['feel', 'verb'],
  ['look', 'verb'],
  ['not', 'little'],
  ['yes', 'social'],
  ['no', 'social'],
]

const fringe: Array<[string, PartOfSpeech]> = [
  // row-major, columns 3–5
  ['eat', 'verb'],
  ['drink', 'verb'],
  ['play', 'verb'],
  ['cookie', 'noun'],
  ['milk', 'noun'],
  ['ball', 'noun'],
  ['mom', 'noun'],
  ['dad', 'noun'],
  ['happy', 'descriptor'],
  ['school', 'noun'],
  ['home', 'noun'],
  ['sad', 'descriptor'],
  ['please', 'social'],
  ['thank you', 'social'],
  ['tired', 'descriptor'],
]

function placeButtons(
  words: Array<[string, PartOfSpeech]>,
  columnOffset: number,
): GridButton[] {
  return words.map(([label, pos], i) => ({
    id: `${columnOffset}-${i}`,
    label,
    pos,
    row: Math.floor(i / 3),
    column: columnOffset + (i % 3),
  }))
}

export const CORE_PAGE_BUTTONS: GridButton[] = [
  ...placeButtons(core, 0),
  ...placeButtons(fringe, 3),
]
