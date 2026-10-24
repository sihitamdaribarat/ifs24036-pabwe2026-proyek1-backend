import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite connection using better-sqlite3
// (compatible with Vercel serverless, unlike node:sqlite)
const db = new Database(config.dbPath);

// Execute PRAGMAs specified in PRD 4.4
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = NORMAL');

// Run initial migration
const migrationPath = path.resolve(__dirname, 'migrations/001_init.sql');
if (fs.existsSync(migrationPath)) {
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  db.exec(sql);
}

export default db;
