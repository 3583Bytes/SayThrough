import * as SQLite from 'expo-sqlite'
import type { Button, Page, PageSet, UserProfile } from '../types/models'
import type { Storage } from './types'

// Native driver: expo-sqlite, schema per technical-specification.md §8.1.
// Metro resolves createStorage.web.ts for web builds, so this file only
// ships to iOS/Android.

const SCHEMA_VERSION = 2 // v2: users table

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active_page_set_id TEXT,
  settings_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS page_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  root_page_id TEXT NOT NULL,
  is_built_in INTEGER NOT NULL DEFAULT 0,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  page_set_id TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol_id TEXT,
  rows INTEGER NOT NULL DEFAULT 5,
  columns INTEGER NOT NULL DEFAULT 6,
  background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  show_message_bar INTEGER NOT NULL DEFAULT 1,
  show_toolbar INTEGER NOT NULL DEFAULT 1,
  is_built_in INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (page_set_id) REFERENCES page_sets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS buttons (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  col_index INTEGER NOT NULL,
  row_span INTEGER NOT NULL DEFAULT 1,
  col_span INTEGER NOT NULL DEFAULT 1,
  label TEXT NOT NULL,
  symbol_id TEXT,
  custom_symbol_uri TEXT,
  audio_uri TEXT,
  audio_cue_uri TEXT,
  background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  border_color TEXT NOT NULL DEFAULT '#DDDDDD',
  border_width INTEGER NOT NULL DEFAULT 1,
  label_color TEXT NOT NULL DEFAULT '#000000',
  label_font_size INTEGER NOT NULL DEFAULT 14,
  label_font_weight TEXT NOT NULL DEFAULT 'bold',
  symbol_scale REAL NOT NULL DEFAULT 0.65,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  is_navigation_button INTEGER NOT NULL DEFAULT 0,
  actions_json TEXT NOT NULL DEFAULT '[]',
  is_built_in INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pages_page_set ON pages(page_set_id);
CREATE INDEX IF NOT EXISTS idx_buttons_page ON buttons(page_id);
`

interface ButtonRow {
  id: string
  page_id: string
  row_index: number
  col_index: number
  row_span: number
  col_span: number
  label: string
  symbol_id: string | null
  custom_symbol_uri: string | null
  audio_uri: string | null
  audio_cue_uri: string | null
  background_color: string
  border_color: string
  border_width: number
  label_color: string
  label_font_size: number
  label_font_weight: string
  symbol_scale: number
  is_hidden: number
  is_navigation_button: number
  actions_json: string
  is_built_in: number
  created_at: number
  updated_at: number
}

interface PageRow {
  id: string
  page_set_id: string
  name: string
  symbol_id: string | null
  rows: number
  columns: number
  background_color: string
  show_message_bar: number
  show_toolbar: number
  is_built_in: number
  created_at: number
  updated_at: number
}

interface PageSetRow {
  id: string
  name: string
  description: string | null
  language: string
  root_page_id: string
  is_built_in: number
  schema_version: number
  created_at: number
  updated_at: number
}

function toButton(row: ButtonRow): Button {
  return {
    id: row.id,
    pageId: row.page_id,
    row: row.row_index,
    column: row.col_index,
    rowSpan: row.row_span,
    columnSpan: row.col_span,
    label: row.label,
    symbolId: row.symbol_id ?? undefined,
    customSymbolUri: row.custom_symbol_uri ?? undefined,
    audioUri: row.audio_uri ?? undefined,
    audioCueUri: row.audio_cue_uri ?? undefined,
    backgroundColor: row.background_color,
    borderColor: row.border_color,
    borderWidth: row.border_width,
    labelColor: row.label_color,
    labelFontSize: row.label_font_size,
    labelFontWeight: row.label_font_weight === 'bold' ? 'bold' : 'normal',
    symbolScale: row.symbol_scale,
    isHidden: row.is_hidden === 1,
    isNavigationButton: row.is_navigation_button === 1,
    actions: JSON.parse(row.actions_json),
    isBuiltIn: row.is_built_in === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toPage(row: PageRow): Page {
  return {
    id: row.id,
    pageSetId: row.page_set_id,
    name: row.name,
    symbolId: row.symbol_id ?? undefined,
    rows: row.rows,
    columns: row.columns,
    backgroundColor: row.background_color,
    showMessageBar: row.show_message_bar === 1,
    showToolbar: row.show_toolbar === 1,
    isBuiltIn: row.is_built_in === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toPageSet(row: PageSetRow): PageSet {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    language: row.language,
    rootPageId: row.root_page_id,
    schemaVersion: row.schema_version,
    isBuiltIn: row.is_built_in === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

class SqliteStorage implements Storage {
  private db!: SQLite.SQLiteDatabase

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('saythrough.db')
    await this.db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
    const row = await this.db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    )
    if ((row?.user_version ?? 0) < SCHEMA_VERSION) {
      await this.db.execAsync(SCHEMA)
      await this.db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`)
    }
  }

  async clearAll(): Promise<void> {
    await this.db.execAsync(
      'DELETE FROM buttons; DELETE FROM pages; DELETE FROM page_sets; DELETE FROM users; DELETE FROM meta;',
    )
  }

  // Profile stored whole in settings_json per §8.1; name and
  // active_page_set_id are mirrored to columns for queries
  async getUsers(): Promise<UserProfile[]> {
    const rows = await this.db.getAllAsync<{ settings_json: string }>(
      'SELECT settings_json FROM users',
    )
    return rows.map((r) => JSON.parse(r.settings_json))
  }

  async createUser(user: UserProfile): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO users
       (id, name, active_page_set_id, settings_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      user.id,
      user.name,
      user.activePageSetId,
      JSON.stringify(user),
      user.createdAt,
      user.updatedAt,
    )
  }

  async updateUser(user: UserProfile): Promise<void> {
    await this.createUser(user)
  }

  async getMeta(key: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM meta WHERE key = ?',
      key,
    )
    return row?.value ?? null
  }

  async setMeta(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
      key,
      value,
    )
  }

  async getPageSets(): Promise<PageSet[]> {
    const rows = await this.db.getAllAsync<PageSetRow>('SELECT * FROM page_sets')
    return rows.map(toPageSet)
  }

  async getPageSet(id: string): Promise<PageSet | null> {
    const row = await this.db.getFirstAsync<PageSetRow>(
      'SELECT * FROM page_sets WHERE id = ?',
      id,
    )
    return row ? toPageSet(row) : null
  }

  async createPageSet(ps: PageSet): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO page_sets
       (id, name, description, language, root_page_id, is_built_in,
        schema_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ps.id,
      ps.name,
      ps.description ?? null,
      ps.language,
      ps.rootPageId,
      ps.isBuiltIn ? 1 : 0,
      ps.schemaVersion,
      ps.createdAt,
      ps.updatedAt,
    )
  }

  async getPage(id: string): Promise<Page | null> {
    const row = await this.db.getFirstAsync<PageRow>(
      'SELECT * FROM pages WHERE id = ?',
      id,
    )
    return row ? toPage(row) : null
  }

  async getPagesForPageSet(pageSetId: string): Promise<Page[]> {
    const rows = await this.db.getAllAsync<PageRow>(
      'SELECT * FROM pages WHERE page_set_id = ?',
      pageSetId,
    )
    return rows.map(toPage)
  }

  async createPage(p: Page): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO pages
       (id, page_set_id, name, symbol_id, rows, columns, background_color,
        show_message_bar, show_toolbar, is_built_in, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      p.id,
      p.pageSetId,
      p.name,
      p.symbolId ?? null,
      p.rows,
      p.columns,
      p.backgroundColor,
      p.showMessageBar ? 1 : 0,
      p.showToolbar ? 1 : 0,
      p.isBuiltIn ? 1 : 0,
      p.createdAt,
      p.updatedAt,
    )
  }

  async getButtonsForPage(pageId: string): Promise<Button[]> {
    const rows = await this.db.getAllAsync<ButtonRow>(
      'SELECT * FROM buttons WHERE page_id = ?',
      pageId,
    )
    return rows.map(toButton)
  }

  async createButton(b: Button): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO buttons
       (id, page_id, row_index, col_index, row_span, col_span, label,
        symbol_id, custom_symbol_uri, audio_uri, audio_cue_uri,
        background_color, border_color, border_width, label_color,
        label_font_size, label_font_weight, symbol_scale, is_hidden,
        is_navigation_button, actions_json, is_built_in, created_at,
        updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      b.id,
      b.pageId,
      b.row,
      b.column,
      b.rowSpan,
      b.columnSpan,
      b.label,
      b.symbolId ?? null,
      b.customSymbolUri ?? null,
      b.audioUri ?? null,
      b.audioCueUri ?? null,
      b.backgroundColor,
      b.borderColor,
      b.borderWidth,
      b.labelColor,
      b.labelFontSize,
      b.labelFontWeight,
      b.symbolScale,
      b.isHidden ? 1 : 0,
      b.isNavigationButton ? 1 : 0,
      JSON.stringify(b.actions),
      b.isBuiltIn ? 1 : 0,
      b.createdAt,
      b.updatedAt,
    )
  }

  async updateButton(b: Button): Promise<void> {
    await this.db.runAsync(
      `UPDATE buttons SET
        row_index = ?, col_index = ?, row_span = ?, col_span = ?, label = ?,
        symbol_id = ?, custom_symbol_uri = ?, audio_uri = ?, audio_cue_uri = ?,
        background_color = ?, border_color = ?, border_width = ?,
        label_color = ?, label_font_size = ?, label_font_weight = ?,
        symbol_scale = ?, is_hidden = ?, is_navigation_button = ?,
        actions_json = ?, updated_at = ?
       WHERE id = ?`,
      b.row,
      b.column,
      b.rowSpan,
      b.columnSpan,
      b.label,
      b.symbolId ?? null,
      b.customSymbolUri ?? null,
      b.audioUri ?? null,
      b.audioCueUri ?? null,
      b.backgroundColor,
      b.borderColor,
      b.borderWidth,
      b.labelColor,
      b.labelFontSize,
      b.labelFontWeight,
      b.symbolScale,
      b.isHidden ? 1 : 0,
      b.isNavigationButton ? 1 : 0,
      JSON.stringify(b.actions),
      b.updatedAt,
      b.id,
    )
  }

  async deleteButton(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM buttons WHERE id = ?', id)
  }
}

export function createStorage(): Storage {
  return new SqliteStorage()
}
