// WCAG 2.1 AA contrast, measured on the rendered page rather than asserted
// against the palette — the palette was never the problem. Every failure this
// caught was a component that painted a themed surface but left its text at a
// hardcoded colour, so the two only disagreed once dark mode was on.
//
// Walks every element with a text child, composites the background stack
// (semi-transparent tints included), and applies the real AA thresholds:
// 3:1 for large text (>=24px, or >=18.66px bold), 4.5:1 otherwise.
export const AUDIT = `(() => {
  const lum = (c) => {
    const [r,g,b] = c.map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4) })
    return 0.2126*r + 0.7152*g + 0.0722*b
  }
  const parse = (s) => {
    const m = (s || '').match(/rgba?\\(([^)]+)\\)/)
    if (!m) return null
    const p = m[1].split(',').map(x => parseFloat(x))
    const a = p.length > 3 ? p[3] : 1
    if (a === 0) return null
    return [p[0], p[1], p[2], a]
  }
  // Composite semi-transparent layers over what is behind them. Treating a
  // 0.18-alpha tint as opaque reports nonsense (an earlier version of this
  // audit "found" white-on-white at 1:1 that way).
  // A gradient is painted by background-image, not background-color, so a
  // naive walk sails straight past it to the body and scores the text against
  // the wrong colour. Every colour stop is a candidate background; the caller
  // scores against the worst one.
  const stopsOf = (st) => {
    const img = st.backgroundImage || ''
    if (img === 'none') return []
    return (img.match(/rgba?\\([^)]+\\)/g) || []).map(parse).filter(Boolean)
  }
  const bgsOf = (el) => {
    const layers = []
    let n = el
    let stops = []
    while (n && n !== document.documentElement) {
      const st = getComputedStyle(n)
      const g = stopsOf(st)
      if (g.length) { stops = g; break }
      const c = parse(st.backgroundColor)
      if (c) { layers.push(c); if (c[3] === 1) break }
      n = n.parentElement
    }
    if (stops.length) return stops.map((stop) => flatten([...layers, stop]))
    return [flatten(layers)]
  }
  const flatten = (layers) => {
    let out = [255,255,255]
    for (let i = layers.length - 1; i >= 0; i--) {
      const [r,g,b,a] = layers[i]
      out = [r*a + out[0]*(1-a), g*a + out[1]*(1-a), b*a + out[2]*(1-a)]
    }
    return out
  }
  const out = []
  for (const el of document.querySelectorAll('*')) {
    const text = Array.from(el.childNodes).filter(n => n.nodeType === 3)
      .map(n => n.textContent.trim()).join(' ').trim()
    if (!text) continue
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    const st = getComputedStyle(el)
    if (st.visibility === 'hidden' || st.opacity === '0') continue
    const fg = parse(st.color); if (!fg) continue
    // Worst case across the background's colour stops.
    let ratio = Infinity, bg = null
    for (const cand of bgsOf(el)) {
      const [hi,lo] = [lum(fg), lum(cand)].sort((x,y) => y-x)
      const r2 = (hi + 0.05) / (lo + 0.05)
      if (r2 < ratio) { ratio = r2; bg = cand }
    }
    const px = parseFloat(st.fontSize) || 16
    const bold = (parseInt(st.fontWeight, 10) || 400) >= 700
    const min = px >= 24 || (bold && px >= 18.66) ? 3 : 4.5
    if (ratio < min) {
      out.push({ text: text.slice(0,42), ratio: +ratio.toFixed(2), min, fg: st.color, bg: 'rgb('+bg.map(Math.round).join(',')+')' })
    }
  }
  return out
})()`

export type Issue = { text: string; ratio: number; min: number; fg: string; bg: string }
