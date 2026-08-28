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
  // 5.13:1 against white text. #4CAF50 (the brand green) is only 2.78:1,
  // which fails WCAG AA on the app's primary control.
  speakGreen: '#2E7D32',
  // clearRed removed: a single red cannot clear AA on both a white and a
  // near-black surface. Use `theme.danger` instead.
  backspaceGray: '#9E9E9E',
  buttonBorder: '#DDDDDD',
  barBackground: '#F8F8F8',
  barBorder: '#E0E0E0',
  messageBarBorder: '#CCCCCC',
  label: '#000000',
} as const
