import JSZip from 'jszip'
import { getSymbolUri } from './SymbolService'
import { storage } from '../storage'
import type { Button, ButtonAction, Page, PageSet } from '../types/models'
import { uuid } from '../utils/uuid'

// Open Board Format import/export — spec §14, format spec at
// https://www.openboardformat.org/. Web implementation; native builds
// add expo-file-system/expo-sharing paths in Phase 2.

interface ObfButton {
  id: string
  label: string
  background_color?: string
  border_color?: string
  vocalization?: string
  image_id?: string
  load_board?: { id?: string; path?: string }
}

interface ObfBoard {
  format: string
  id: string
  name: string
  grid: { rows: number; columns: number; order: (string | null)[][] }
  buttons: ObfButton[]
  images: Array<{ id: string; path?: string; url?: string; content_type?: string }>
}

const boardPath = (pageId: string) => `boards/${pageId}.obf`

export async function exportPageSet(pageSetId: string): Promise<Blob> {
  const pageSet = await storage.getPageSet(pageSetId)
  if (!pageSet) throw new Error('Page set not found')
  const pages = await storage.getPagesForPageSet(pageSetId)

  const zip = new JSZip()
  const boardPaths: Record<string, string> = {}
  const imagePaths: Record<string, string> = {}

  for (const page of pages) {
    const buttons = await storage.getButtonsForPage(page.id)

    const order: (string | null)[][] = Array.from({ length: page.rows }, () =>
      Array.from({ length: page.columns }, () => null),
    )
    const obfButtons: ObfButton[] = []
    const images: ObfBoard['images'] = []

    for (const button of buttons) {
      if (button.row < page.rows && button.column < page.columns) {
        order[button.row][button.column] = button.id
      }

      const obfButton: ObfButton = {
        id: button.id,
        label: button.label,
        background_color: button.backgroundColor,
        border_color: button.borderColor,
      }

      for (const action of button.actions) {
        if (action.type === 'speak_label') obfButton.vocalization = button.label
        if (action.type === 'navigate') {
          obfButton.load_board = { id: action.pageId, path: boardPath(action.pageId) }
        }
      }

      // Embed the symbol image so the .obz is self-contained
      const symbolUri = button.customSymbolUri ??
        (button.symbolId ? getSymbolUri(button.symbolId) : null)
      if (symbolUri) {
        const imageId = button.symbolId ?? button.id
        const path = `images/${imageId.replace(/[^a-zA-Z0-9_-]/g, '_')}.webp`
        if (!imagePaths[imageId]) {
          try {
            const res = await fetch(symbolUri)
            if (res.ok) {
              zip.file(path, await res.arrayBuffer())
              imagePaths[imageId] = path
            }
          } catch {
            // unreachable image — export the button text-only
          }
        }
        if (imagePaths[imageId]) {
          obfButton.image_id = imageId
          if (!images.some((img) => img.id === imageId)) {
            images.push({ id: imageId, path, content_type: 'image/webp' })
          }
        }
      }

      obfButtons.push(obfButton)
    }

    const board: ObfBoard = {
      format: 'open-board-0.1',
      id: page.id,
      name: page.name,
      grid: { rows: page.rows, columns: page.columns, order },
      buttons: obfButtons,
      images,
    }
    const path = boardPath(page.id)
    zip.file(path, JSON.stringify(board))
    boardPaths[page.id] = path
  }

  zip.file(
    'manifest.json',
    JSON.stringify({
      format: 'open-board-0.1',
      root: boardPath(pageSet.rootPageId),
      paths: { boards: boardPaths, images: imagePaths },
    }),
  )

  return zip.generateAsync({ type: 'blob' })
}

function parseColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  if (value.startsWith('#')) return value
  const rgb = value.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (rgb) {
    const hex = (n: string) => Number(n).toString(16).padStart(2, '0')
    return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`.toUpperCase()
  }
  return fallback
}

export async function importPageSet(data: ArrayBuffer): Promise<PageSet> {
  const zip = await JSZip.loadAsync(data)
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) throw new Error('Not a valid .obz file (no manifest.json)')
  const manifest = JSON.parse(await manifestFile.async('string'))

  // Collect boards; keys are zip paths so load_board.path can resolve
  const boards = new Map<string, ObfBoard>()
  for (const file of Object.values(zip.files)) {
    if (file.name.endsWith('.obf') && !file.dir) {
      boards.set(file.name, JSON.parse(await file.async('string')))
    }
  }
  if (boards.size === 0) throw new Error('No boards found in .obz')

  const now = Date.now()
  const newPageIdByPath = new Map<string, string>()
  for (const path of boards.keys()) newPageIdByPath.set(path, uuid())

  const rootPath = manifest.root ?? boards.keys().next().value
  const rootBoard = boards.get(rootPath) ?? boards.values().next().value!

  const pageSet: PageSet = {
    id: uuid(),
    name: `${rootBoard.name || 'Imported'} (imported)`,
    language: 'en',
    rootPageId: newPageIdByPath.get(rootPath) ?? newPageIdByPath.values().next().value!,
    schemaVersion: 1,
    isBuiltIn: false,
    createdAt: now,
    updatedAt: now,
  }
  await storage.createPageSet(pageSet)

  for (const [path, board] of boards) {
    const pageId = newPageIdByPath.get(path)!
    const rows = board.grid?.rows ?? 5
    const columns = board.grid?.columns ?? 6

    const page: Page = {
      id: pageId,
      pageSetId: pageSet.id,
      name: board.name || 'Imported page',
      rows,
      columns,
      backgroundColor: '#FFFFFF',
      showMessageBar: true,
      showToolbar: true,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    }
    await storage.createPage(page)

    // Position lookup from grid.order
    const position = new Map<string, { row: number; column: number }>()
    board.grid?.order?.forEach((rowIds, row) =>
      rowIds?.forEach((buttonId, column) => {
        if (buttonId != null) position.set(String(buttonId), { row, column })
      }),
    )

    for (const obfButton of board.buttons ?? []) {
      const pos = position.get(String(obfButton.id))
      if (!pos) continue

      const actions: ButtonAction[] = []
      let isNavigationButton = false
      if (obfButton.load_board?.path && newPageIdByPath.has(obfButton.load_board.path)) {
        actions.push({
          type: 'navigate',
          pageId: newPageIdByPath.get(obfButton.load_board.path)!,
        })
        isNavigationButton = true
      } else if (obfButton.vocalization) {
        actions.push({ type: 'speak_label' })
      } else {
        actions.push({ type: 'append_to_message' })
      }

      // Embedded image → data URI (persists in storage on all platforms)
      let customSymbolUri: string | undefined
      const image = board.images?.find((img) => img.id === obfButton.image_id)
      if (image?.path) {
        const imageFile = zip.file(image.path)
        if (imageFile) {
          const base64 = await imageFile.async('base64')
          customSymbolUri = `data:${image.content_type ?? 'image/png'};base64,${base64}`
        }
      } else if (image?.url) {
        customSymbolUri = image.url
      }

      const button: Button = {
        id: uuid(),
        pageId,
        row: pos.row,
        column: pos.column,
        rowSpan: 1,
        columnSpan: 1,
        label: obfButton.label ?? '',
        customSymbolUri,
        backgroundColor: parseColor(obfButton.background_color, '#FFFFFF'),
        borderColor: parseColor(obfButton.border_color, '#DDDDDD'),
        borderWidth: 1,
        labelColor: '#000000',
        labelFontSize: 14,
        labelFontWeight: 'bold',
        symbolScale: 0.65,
        isHidden: false,
        isNavigationButton,
        actions,
        isBuiltIn: false,
        createdAt: now,
        updatedAt: now,
      }
      await storage.createButton(button)
    }
  }

  return pageSet
}
