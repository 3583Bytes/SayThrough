import {
  buildPrintablePages,
  renderPrintDocument,
} from '../../src/services/printService'
import type { Button, Page } from '../../src/types/models'

const page = (over: Partial<Page> & Pick<Page, 'id' | 'name'>): Page => ({
  pageSetId: 'set-1',
  rows: 2,
  columns: 3,
  backgroundColor: '#ffffff',
  showMessageBar: true,
  showToolbar: true,
  isBuiltIn: true,
  createdAt: 0,
  updatedAt: 0,
  ...over,
})

const button = (over: Partial<Button> & Pick<Button, 'id' | 'pageId' | 'label'>): Button => ({
  row: 0,
  column: 0,
  rowSpan: 1,
  columnSpan: 1,
  backgroundColor: '#FFF9C4',
  borderColor: '#dddddd',
  borderWidth: 1,
  labelColor: '#000000',
  labelFontSize: 16,
  labelFontWeight: 'bold',
  symbolScale: 1,
  isHidden: false,
  isNavigationButton: false,
  actions: [],
  isBuiltIn: true,
  createdAt: 0,
  updatedAt: 0,
  ...over,
})

const resolve = (ref: string) => `/symbols/${ref.replace(':', '/')}.webp`

describe('buildPrintablePages', () => {
  it('puts the root page first and the rest in a stable order', () => {
    const pages = [
      page({ id: 'food', name: 'Food' }),
      page({ id: 'home', name: 'Zzz Home' }),
      page({ id: 'actions', name: 'Actions' }),
    ]
    const built = buildPrintablePages(pages, new Map(), resolve, 'home')
    // Root first even though its name sorts last — it is the page anyone
    // printing a single sheet actually wants.
    expect(built.map((p) => p.id)).toEqual(['home', 'actions', 'food'])
  })

  it('keeps a hidden button’s cell empty instead of closing the gap', () => {
    // The whole point of printing is that paper and screen share a layout. If
    // a hidden button let the ones after it slide up, every position after it
    // would move and the motor plan would not transfer.
    const buttons = [
      button({ id: 'a', pageId: 'p', label: 'I', row: 0, column: 0 }),
      button({ id: 'b', pageId: 'p', label: 'secret', row: 0, column: 1, isHidden: true }),
      button({ id: 'c', pageId: 'p', label: 'want', row: 0, column: 2 }),
    ]
    const [built] = buildPrintablePages(
      [page({ id: 'p', name: 'Home' })],
      new Map([['p', buttons]]),
      resolve,
    )
    expect(built.cells.map((c) => [c.label, c.column])).toEqual([
      ['I', 0],
      ['want', 2],
    ])
  })

  it('prefers a custom photo over the mapped symbol', () => {
    const buttons = [
      button({
        id: 'a',
        pageId: 'p',
        label: 'Mum',
        symbolId: 'arasaac:2788',
        customSymbolUri: 'blob:photo-of-mum',
      }),
      button({ id: 'b', pageId: 'p', label: 'more', column: 1, symbolId: 'arasaac:2788' }),
      button({ id: 'c', pageId: 'p', label: 'plain', column: 2 }),
    ]
    const [built] = buildPrintablePages(
      [page({ id: 'p', name: 'Home' })],
      new Map([['p', buttons]]),
      resolve,
    )
    expect(built.cells.map((c) => c.symbolUri)).toEqual([
      'blob:photo-of-mum',
      '/symbols/arasaac/2788.webp',
      null,
    ])
  })

  it('carries the user’s own colours, not a stock palette', () => {
    const buttons = [
      button({ id: 'a', pageId: 'p', label: 'go', backgroundColor: '#123456', labelColor: '#abcdef' }),
    ]
    const [built] = buildPrintablePages(
      [page({ id: 'p', name: 'Home' })],
      new Map([['p', buttons]]),
      resolve,
    )
    expect(built.cells[0]).toMatchObject({
      backgroundColor: '#123456',
      labelColor: '#abcdef',
    })
  })
})

describe('renderPrintDocument', () => {
  const built = () =>
    buildPrintablePages(
      [page({ id: 'p', name: 'Home', rows: 2, columns: 3 })],
      new Map([
        [
          'p',
          [
            button({ id: 'a', pageId: 'p', label: 'I', symbolId: 'arasaac:2788' }),
            button({ id: 'b', pageId: 'p', label: 'want more', row: 1, column: 1, columnSpan: 2 }),
          ],
        ],
      ]),
      resolve,
    )

  const html = () =>
    renderPrintDocument(built(), { title: 'Core Vocabulary', credit: 'ARASAAC, CC BY-NC-SA' })

  it('reproduces the grid geometry the board actually has', () => {
    const out = html()
    expect(out).toContain('grid-template-columns:repeat(3,1fr)')
    expect(out).toContain('grid-template-rows:repeat(2,1fr)')
    // CSS grid lines are 1-based; the model stores 0-based rows and columns.
    expect(out).toContain('grid-row:1/span 1;grid-column:1/span 1')
    expect(out).toContain('grid-row:2/span 1;grid-column:2/span 2')
  })

  it('forces colour printing, because the colour is the word class', () => {
    expect(html()).toContain('print-color-adjust: exact')
  })

  it('breaks one board per sheet and credits the symbols', () => {
    const out = html()
    expect(out).toContain('page-break-after: always')
    expect(out).toContain('ARASAAC, CC BY-NC-SA')
    expect(out).toContain('Core Vocabulary — Home')
  })

  it('escapes labels rather than letting them become markup', () => {
    const pages = buildPrintablePages(
      [page({ id: 'p', name: '<script>' })],
      new Map([['p', [button({ id: 'a', pageId: 'p', label: '<img onerror=x>' })]]]),
      resolve,
    )
    const out = renderPrintDocument(pages, { title: 'T', credit: 'C' })
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('<img onerror')
    expect(out).toContain('&lt;img onerror=x&gt;')
  })

  it('refuses a symbol URI that is not an image reference', () => {
    // A label is escaped, but a URI goes into an `src` — anything that could
    // execute has to be dropped, not encoded.
    const pages = buildPrintablePages(
      [page({ id: 'p', name: 'Home' })],
      new Map([
        [
          'p',
          [button({ id: 'a', pageId: 'p', label: 'x', customSymbolUri: 'javascript:alert(1)' })],
        ],
      ]),
      resolve,
    )
    const out = renderPrintDocument(pages, { title: 'T', credit: 'C' })
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('<img')
  })
})
