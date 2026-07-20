// Part-of-speech color coding (Fitzgerald key) — technical-specification.md §5.3
export const POS_COLORS = {
  question: '#BBDEFB',
  pronoun: '#FFF9C4',
  verb: '#C8E6C9',
  little: '#FFE0B2', // little words / prepositions
  social: '#F8BBD9',
  descriptor: '#E1BEE7',
  noun: '#FFFFFF',
  category: '#F5F5F5', // category navigation buttons
} as const

export type PartOfSpeech = keyof typeof POS_COLORS

export const UI_COLORS = {
  speakGreen: '#4CAF50',
  clearRed: '#F44336',
  backspaceGray: '#9E9E9E',
  buttonBorder: '#DDDDDD',
  barBackground: '#F8F8F8',
  barBorder: '#E0E0E0',
  messageBarBorder: '#CCCCCC',
  label: '#000000',
} as const
