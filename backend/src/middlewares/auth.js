import { verifyAccessToken } from '../utils/security.js';
import { sendError } from '../utils/response.js';
import db from '../db/connection.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'UNAUTHORIZED', 'Token autentikasi tidak ditemukan.', null, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    const userId = decoded.sub;

    const stmt = db.prepare('SELECT id, email, username, display_name, bio, timezone, created_at FROM users WHERE id = ?');
    const user = stmt.get(userId);

    if (!user) {
      return sendError(res, 'UNAUTHORIZED', 'Pengguna tidak ditemukan.', null, 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'TOKEN_EXPIRED', 'Token kedaluwarsa. Silakan perbarui sesi Anda.', null, 401);
    }
    return sendError(res, 'UNAUTHORIZED', 'Token tidak valid.', null, 401);
  }
}
