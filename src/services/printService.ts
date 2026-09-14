// §14.4 — printing the user's own board onto paper.
//
// A paper board is the backup a device cannot be: it survives a flat battery,
// goes in the bath and the pool, and needs no charger. What matters is that it
// reproduces THIS user's board — their buttons, symbols, photos and colours —
// because a paper copy whose words sit somewhere else is a second system to
// learn, and under pressure that is worse than no paper at all.
//
// Split so the interesting half needs no DOM: `buildPrintablePages` and
// `renderPrintDocument` are pure, and only `printDocument` touches the page.

import type { Button, Page } from '../types/models'

export interface PrintableCell {
  row: number
  column: number
  rowSpan: number
  columnSpan: number
  label: string
  symbolUri: string | null
  backgroundColor: string
  labelColor: string
}

export interface PrintablePage {
  id: string
  name: string
  rows: number
  columns: number
  cells: PrintableCell[]
}

export interface PrintOptions {
  /** Shown on every sheet, so a stack of them can be filed. */
  title: string
  /** Footer credit — the symbol libraries require attribution. */
  credit: string
}

/**
 * Maps stored pages and buttons onto printable grids.
 *
 * `resolveSymbol` is injected rather than imported so this stays testable
 * without the platform's symbol service (and so native and web can differ).
 */
export function buildPrintablePages(
  pages: Page[],
  buttonsByPage: Map<string, Button[]>,
  resolveSymbol: (ref: string) => string | null,
  rootPageId?: string | null,
): PrintablePage[] {
  // Root first — it is the page anyone printing one sheet actually wants —
  // then the rest by name so a reprint comes out in the same order.
  const ordered = [...pages].sort((a, b) => {
    if (a.id === rootPageId) return -1
    if (b.id === rootPageId) return 1
    return a.name.localeCompare(b.name)
  })

  return ordered.map((page) => ({
    id: page.id,
    name: page.name,
    rows: page.rows,
    columns: page.columns,
    cells: (buttonsByPage.get(page.id) ?? [])
      // A hidden button leaves its cell EMPTY rather than closing the gap.
      // Closing it would shift every button after it and break the motor plan
      // this print exists to preserve.
      .filter((button) => !button.isHidden)
      .map((button) => ({
        row: button.row,
        column: button.column,
        rowSpan: Math.max(1, button.rowSpan),
        columnSpan: Math.max(1, button.columnSpan),
        label: button.label,
        symbolUri:
          button.customSymbolUri ??
          (button.symbolId ? resolveSymbol(button.symbolId) : null),
        backgroundColor: button.backgroundColor,
        labelColor: button.labelColor,
      })),
  }))
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// A symbol URI is written into an `src`, so anything that could execute has to
// be refused rather than escaped. Same-origin http(s), data: images and blob:
// (a photo the user added) are the only shapes that legitimately appear here.
const SAFE_URI = /^(https?:\/\/|\/|\.\/|data:image\/|blob:)/i
const safeUri = (uri: string | null): string | null =>
  uri && SAFE_URI.test(uri) ? uri : null

/** A standalone HTML document: one board per sheet, colours intact. */
export function renderPrintDocument(
  pages: PrintablePage[],
  options: PrintOptions,
): string {
  const sheets = pages
    .map((page) => {
      const cells = page.cells
        .map((cell) => {
          const uri = safeUri(cell.symbolUri)
          const img = uri
            ? `<img src="${escapeHtml(uri)}" alt="" />`
            : ''
          const style = [
            `grid-row:${cell.row + 1}/span ${cell.rowSpan}`,
            `grid-column:${cell.column + 1}/span ${cell.columnSpan}`,
            `background:${escapeHtml(cell.backgroundColor)}`,
            `color:${escapeHtml(cell.labelColor)}`,
          ].join(';')
          return `<div class="cell" style="${style}">${img}<span>${escapeHtml(cell.label)}</span></div>`
        })
        .join('')
      return (
        `<section class="sheet">` +
        `<h1>${escapeHtml(options.title)} — ${escapeHtml(page.name)}</h1>` +
        `<div class="grid" style="grid-template-columns:repeat(${page.columns},1fr);grid-template-rows:repeat(${page.rows},1fr)">${cells}</div>` +
        `<p class="credit">${escapeHtml(options.credit)}</p>` +
        `</section>`
      )
    })
    .join('')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(options.title)}</title>
<style>
  /* Every authored grid is wider than it is tall, so landscape wastes less
     paper and leaves the cells bigger — which is the whole point on paper. */
  @page { size: landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #17202a;
  }
  .sheet {
    display: flex;
    flex-direction: column;
    height: 100vh;
    break-after: page;
    page-break-after: always;
  }
  .sheet:last-child { break-after: auto; page-break-after: auto; }
  h1 { font-size: 11pt; font-weight: 600; margin: 0 0 4mm; }
  .grid { flex: 1; display: grid; gap: 2mm; min-height: 0; }
  .cell {
    border: 1px solid rgba(23, 32, 42, 0.28);
    border-radius: 3mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1mm;
    padding: 1.5mm;
    overflow: hidden;
    text-align: center;
    font-weight: 700;
    font-size: 11pt;
    line-height: 1.1;
    /* Without this most browsers drop the fills, and the Fitzgerald colour
       coding is not decoration — it is how a word class is recognised. */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cell img { max-width: 78%; max-height: 62%; object-fit: contain; }
  .cell span { overflow-wrap: anywhere; }
  .credit { font-size: 7pt; color: #566372; margin: 3mm 0 0; }
</style>
</head>
<body>${sheets}</body>
</html>`
}

/**
 * Prints a document produced by `renderPrintDocument`.
 *
 * A hidden same-origin iframe rather than `window.open`, which pop-up blockers
 * eat even on a click. `srcdoc` gives a real `load` event that fires after the
 * images, so symbols are never missing from the sheet.
 */
export function printDocument(html: string): Promise<void> {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.setAttribute('title', 'print')
    frame.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'

    const cleanUp = () => {
      frame.remove()
      resolve()
    }

    frame.addEventListener('load', () => {
      const view = frame.contentWindow
      if (!view) return cleanUp()
      // `print()` blocks until the dialog closes in most browsers, but not
      // all — remove the frame afterwards either way rather than leaking one
      // per print.
      try {
        view.focus()
        view.print()
      } finally {
        setTimeout(cleanUp, 500)
      }
    })

    frame.srcdoc = html
    document.body.appendChild(frame)
  })
}
