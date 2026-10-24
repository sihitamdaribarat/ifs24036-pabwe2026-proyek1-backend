import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { config } from '../config/index.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel serverless environment, ensure database exists in /tmp and is pre-seeded
let targetDbPath = config.dbPath;

if (process.env.VERCEL) {
  const tmpPath = '/tmp/database.sqlite';
  const candidateSeedPaths = [
    path.resolve(__dirname, '../../database.sqlite'),
    path.resolve(__dirname, '../../../database.sqlite'),
    path.resolve(process.cwd(), 'backend/database.sqlite'),
    path.resolve(process.cwd(), 'database.sqlite'),
  ];

  const existingSeed = candidateSeedPaths.find((p) => fs.existsSync(p));

  if (!fs.existsSync(tmpPath) && existingSeed) {
    try {
      fs.copyFileSync(existingSeed, tmpPath);
      console.log(`[DB] Successfully seeded /tmp/database.sqlite from ${existingSeed}`);
    } catch (err) {
      console.error('[DB] Failed copying seed database to /tmp:', err);
    }
  }
  targetDbPath = tmpPath;
}

let db = null;

// Attempt 1: built-in node:sqlite (native in Node 22+, zero native addon compilation issues)
try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(targetDbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = DELETE;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.pragma = (str) => db.exec(`PRAGMA ${str}`);
  console.log('[DB] Connected using node:sqlite at', targetDbPath);
} catch (nodeErr) {
  console.warn('[DB] node:sqlite unavailable, attempting fallback driver:', nodeErr.message);
  try {
    if (process.versions.bun) {
      // Attempt 2: built-in bun:sqlite when running under Bun
      const { Database } = require('bun:sqlite');
      db = new Database(targetDbPath, { create: true });
      db.exec('PRAGMA foreign_keys = ON;');
      db.exec('PRAGMA journal_mode = DELETE;');
      db.exec('PRAGMA busy_timeout = 5000;');
      db.exec('PRAGMA synchronous = NORMAL;');
      db.pragma = (str) => db.exec(`PRAGMA ${str}`);
      console.log('[DB] Connected using bun:sqlite at', targetDbPath);
    } else {
      // Attempt 3: better-sqlite3 (only if installed separately)
      const Database = require('better-sqlite3');
      db = new Database(targetDbPath);
      db.pragma('foreign_keys = ON');
      db.pragma('journal_mode = DELETE');
      db.pragma('busy_timeout = 5000');
      db.pragma('synchronous = NORMAL');
      console.log('[DB] Connected using better-sqlite3 at', targetDbPath);
    }
  } catch (fallbackErr) {
    console.error('[DB] All SQLite engines failed:', fallbackErr.message);
    throw new Error(
      `Database connection failed (runtime ${process.versions.bun ? `bun ${process.versions.bun}` : `node ${process.version}`}): ` +
      `node:sqlite (${nodeErr.message}) | fallback (${fallbackErr.message}). ` +
      'Gunakan Node.js >= 22.13 atau Bun.'
    );
  }
}

// Embedded DDL schema to guarantee all tables exist even if migration file is not bundled
const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL COLLATE NOCASE UNIQUE,
  username      TEXT    NOT NULL COLLATE NOCASE UNIQUE,
  display_name  TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,
  bio           TEXT,
  timezone      TEXT    NOT NULL DEFAULT 'Asia/Jakarta',
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT    NOT NULL UNIQUE,
  expires_at  TEXT    NOT NULL,
  revoked_at  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS habits (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  anchor_cue   TEXT,
  description  TEXT,
  emoji        TEXT    NOT NULL DEFAULT '🌱',
  color        TEXT    NOT NULL DEFAULT '#10B981',
  archived_at  TEXT,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id    INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  log_date    TEXT    NOT NULL,
  note        TEXT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (habit_id, log_date)
);

CREATE TABLE IF NOT EXISTS posts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  habit_id        INTEGER REFERENCES habits(id) ON DELETE SET NULL,
  post_type       TEXT    NOT NULL DEFAULT 'daily_win',
  body            TEXT    NOT NULL,
  streak_snapshot INTEGER,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at      TEXT
);

CREATE TABLE IF NOT EXISTS comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at  TEXT
);

CREATE TABLE IF NOT EXISTS reactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (post_id, user_id)
);
`;

try {
  db.exec(SCHEMA_DDL);
} catch (schemaErr) {
  console.warn('[DB] Schema init check:', schemaErr.message);
}

// Ensure demo user dinda.demo@example.com and deonbaik178@gmail.com exist
try {
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('dinda.demo@example.com');
  if (!existingUser) {
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, username, display_name, password_hash, timezone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      2,
      'dinda.demo@example.com',
      'dinda_baca',
      'Dinda',
      '$2a$12$d5yNCy2GsnNr1Q.BH5NeNeLkdfOUUW3VJ1/u6piyw4DD8KWptGj2y',
      'Asia/Jakarta'
    );

    db.prepare(`
      INSERT OR IGNORE INTO habits (id, user_id, title, anchor_cue, emoji, color)
      VALUES (2, 2, 'Baca 1 halaman buku', 'Setelah menyikat gigi malam', '📖', '#10B981')
    `).run();

    console.log('[DB] Seeded dinda.demo@example.com user successfully');
  }

  const existingDeon = db.prepare('SELECT id FROM users WHERE email = ?').get('deonbaik178@gmail.com');
  if (!existingDeon) {
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, username, display_name, password_hash, timezone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      3,
      'deonbaik178@gmail.com',
      'yuukk111',
      'yuki',
      '$2a$12$LOOR.ROtU15.l4bb4UJ2ceupZ7mdU5pk2VlEIK8LFRXggYy/.hwR6',
      'Asia/Jakarta'
    );
  }
} catch (seedErr) {
  console.error('[DB] Seed check error:', seedErr.message);
}

export default db;
