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
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.pragma = (str) => db.exec(`PRAGMA ${str}`);
  console.log('[DB] Connected using node:sqlite at', targetDbPath);
} catch (nodeErr) {
  console.warn('[DB] node:sqlite unavailable, attempting better-sqlite3:', nodeErr.message);
  // Attempt 2: better-sqlite3
  try {
    const Database = require('better-sqlite3');
    db = new Database(targetDbPath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');
    console.log('[DB] Connected using better-sqlite3 at', targetDbPath);
  } catch (betterErr) {
    console.error('[DB] All SQLite engines failed:', betterErr.message);
    throw new Error(`Database connection failed: node:sqlite (${nodeErr.message}) | better-sqlite3 (${betterErr.message})`);
  }
}

// Run initial migration if needed
const migrationPath = path.resolve(__dirname, 'migrations/001_init.sql');
if (fs.existsSync(migrationPath)) {
  try {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    db.exec(sql);
  } catch (migErr) {
    console.warn('[DB] Migration check:', migErr.message);
  }
}

export default db;
