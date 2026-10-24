import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (for local dev)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// On Vercel, only /tmp is writable for SQLite
const defaultDbPath = process.env.VERCEL
  ? '/tmp/database.sqlite'
  : path.resolve(__dirname, '../../database.sqlite');

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'langkahkecil-super-secret-jwt-key-change-in-production-min-32-chars!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10),
  dbPath: process.env.DB_PATH || defaultDbPath,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

