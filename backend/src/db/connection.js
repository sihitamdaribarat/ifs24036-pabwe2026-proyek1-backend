import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

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

let db;

// Attempt 1: better-sqlite3
try {
  const { default: BetterSqlite } = await import('better-sqlite3');
  db = new BetterSqlite(targetDbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
  console.log('[DB] Connected using better-sqlite3 at', targetDbPath);
} catch (betterErr) {
  console.warn('[DB] better-sqlite3 unavailable, trying node:sqlite fallback:', betterErr.message);
  // Attempt 2: built-in node:sqlite (Node 22+)
  try {
    const { DatabaseSync } = await import('node:sqlite');
    db = new DatabaseSync(targetDbPath);
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA busy_timeout = 5000;');
    db.exec('PRAGMA synchronous = NORMAL;');
    db.pragma = (str) => db.exec(`PRAGMA ${str}`);
    console.log('[DB] Connected using node:sqlite at', targetDbPath);
  } catch (nodeErr) {
    console.error('[DB] All SQLite drivers failed:', nodeErr.message);
    throw new Error(`Database connection failed: ${betterErr.message} | ${nodeErr.message}`);
  }
}

// Run initial migration if database was created fresh
const migrationPath = path.resolve(__dirname, 'migrations/001_init.sql');
if (fs.existsSync(migrationPath)) {
  try {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    db.exec(sql);
  } catch (migErr) {
    console.warn('[DB] Migration note:', migErr.message);
  }
}

export default db;
