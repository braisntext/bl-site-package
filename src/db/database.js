import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { scheduleRebuild } from "../build/rebuild.js";

// Config keys exposed to the public site (GET /api/site/config and the
// Eleventy build-time data file, site/_data/site.js, both read this list).
export const PUBLIC_CONFIG_KEYS = [
  "company_name",
  "sector",
  "page_index_title",
  "page_index_subtitle",
  "page_index_desc",
  "page_quienes_title",
  "page_quienes_subtitle",
  "page_quienes_desc",
  "page_servicios_title",
  "page_servicios_subtitle",
  "page_servicios_desc",
  "page_contacto_title",
  "page_contacto_subtitle",
  "page_contacto_desc",
  "page_blog_title",
  "page_blog_subtitle",
  "logo_ext",
  "ai_model",
  "whatsapp_number",
];

const dbPath = process.env.DB_PATH || "./data/app.db";
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    status TEXT DEFAULT 'draft',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export function getConfig(key) {
  const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key);
  return row ? row.value : null;
}

export function setConfig(key, value) {
  db.prepare(
    "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, datetime('now'))",
  ).run(key, value);
  scheduleRebuild();
}

export default db;
