// App themes (§6.1 visual theme). Themes re-skin the CHROME, backgrounds,
// text, and surfaces — NOT the vocabulary buttons: their Fitzgerald
// part-of-speech colors (POS_COLORS) carry meaning and read as bright
// islands on a dark page, the way commercial AAC dark modes work.

export interface Theme {
  mode: 'light' | 'dark'
  screen: string // app background behind everything
  chrome: string // top bar / toolbar background
  chromeBorder: string
  surface: string // cards, modals, message bar
  surfaceAlt: string // inputs, chips, small buttons
  pageBg: string // grid area background (behind the buttons)
  coreFrame: string // persistent core panel background
  coreFrameBorder: string
  text: string // primary text
  textMuted: string // secondary / hint text
  border: string // general borders / dividers
  backdrop: string // modal scrim
  icon: string // chrome icon color
  accent: string // primary action / highlight blue
  accentSurface: string // tinted background behind accent text (selected states)
  danger: string // destructive actions & error text — must stay legible on `surface`
}

export const LIGHT: Theme = {
  mode: 'light',
  screen: '#FFFFFF',
  chrome: '#F8F8F8',
  chromeBorder: '#E0E0E0',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAFA',
  pageBg: '#FFFFFF',
  coreFrame: '#EEF3F7',
  coreFrameBorder: '#D3DEE7',
  text: '#1A1A1A',
  textMuted: '#6B6B6B',
  border: '#DDDDDD',
  backdrop: 'rgba(0,0,0,0.4)',
  icon: '#444444',
  accent: '#1565C0',
  accentSurface: '#E3F2FD',
  danger: '#C62828', // 5.39:1 on surfaceAlt
}

export const DARK: Theme = {
  mode: 'dark',
  screen: '#121212',
  chrome: '#1E1E1E',
  chromeBorder: '#333333',
  surface: '#1E1E1E',
  surfaceAlt: '#2A2A2A',
  pageBg: '#121212',
  coreFrame: '#1B2733',
  coreFrameBorder: '#31485C',
  text: '#ECECEC',
  textMuted: '#9E9E9E',
  border: '#3A3A3A',
  backdrop: 'rgba(0,0,0,0.6)',
  icon: '#CFCFCF',
  accent: '#64B5F6',
  accentSurface: 'rgba(100,181,246,0.18)',
  danger: '#E57373', // 4.81:1 on surfaceAlt
}

export type ThemePreference = 'light' | 'dark' | 'system'
export const THEMES: Record<'light' | 'dark', Theme> = { light: LIGHT, dark: DARK }
