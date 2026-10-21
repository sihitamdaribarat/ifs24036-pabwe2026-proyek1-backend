import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite connection
const db = new DatabaseSync(config.dbPath);

// Execute PRAGMAs specified in PRD 4.4
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 5000;');
db.exec('PRAGMA synchronous = NORMAL;');

// Run initial migration
const migrationPath = path.resolve(__dirname, 'migrations/001_init.sql');
if (fs.existsSync(migrationPath)) {
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  db.exec(sql);
}

export default db;
