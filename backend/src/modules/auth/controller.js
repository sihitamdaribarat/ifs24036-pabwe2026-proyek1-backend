import db from '../../db/connection.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../../utils/security.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(req, res) {
  const { email, username, display_name, password } = req.body;

  // Check email conflict
  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingEmail) {
    return sendError(res, 'CONFLICT', 'Email sudah terdaftar.', [{ field: 'email', message: 'Email sudah dipakai' }], 409);
  }

  // Check username conflict
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return sendError(res, 'CONFLICT', 'Username sudah terdaftar.', [{ field: 'username', message: 'Username sudah dipakai' }], 409);
  }

  const passwordHash = await hashPassword(password);

  const insertStmt = db.prepare(`
    INSERT INTO users (email, username, display_name, password_hash)
    VALUES (?, ?, ?, ?)
  `);
  const info = insertStmt.run(email, username, display_name, passwordHash);
  const userId = Number(info.lastInsertRowid);

  const user = db.prepare(`
    SELECT id, email, username, display_name, bio, timezone, created_at
    FROM users WHERE id = ?
  `).get(userId);

  const accessToken = generateAccessToken(user);
  const { rawToken, tokenHash, expiresAt } = generateRefreshToken();

  db.prepare(`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).run(userId, tokenHash, expiresAt);

  res.cookie('refreshToken', rawToken, COOKIE_OPTIONS);

  return sendSuccess(res, { user, access_token: accessToken }, undefined, 201);
}

export async function login(req, res) {
  const identifier = (req.body.email || req.body.username || '').trim();
  const { password } = req.body;

  const user = db.prepare(`
    SELECT id, email, username, display_name, password_hash, bio, timezone, created_at
    FROM users WHERE email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE
  `).get(identifier, identifier);

  if (!user) {
    return sendError(res, 'UNAUTHORIZED', 'Email atau password salah.', null, 401);
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    return sendError(res, 'UNAUTHORIZED', 'Email atau password salah.', null, 401);
  }

  const userSafe = {
    id: user.id,
    email: user.email,
    username: user.username,
    display_name: user.display_name,
    bio: user.bio,
    timezone: user.timezone,
    created_at: user.created_at,
  };

  const accessToken = generateAccessToken(userSafe);
  const { rawToken, tokenHash, expiresAt } = generateRefreshToken();

  db.prepare(`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).run(user.id, tokenHash, expiresAt);

  res.cookie('refreshToken', rawToken, COOKIE_OPTIONS);

  return sendSuccess(res, { user: userSafe, access_token: accessToken });
}

export function refresh(req, res) {
  const rawToken = req.cookies.refreshToken || (req.body && req.body.refresh_token);

  if (!rawToken) {
    return sendError(res, 'UNAUTHORIZED', 'Refresh token tidak ditemukan.', null, 401);
  }

  const tokenHash = hashRefreshToken(rawToken);

  const row = db.prepare(`
    SELECT id, user_id, expires_at, revoked_at
    FROM refresh_tokens
    WHERE token_hash = ?
  `).get(tokenHash);

  if (!row || row.revoked_at || new Date(row.expires_at) <= new Date()) {
    return sendError(res, 'UNAUTHORIZED', 'Refresh token tidak valid atau telah kedaluwarsa.', null, 401);
  }

  // Revoke old token
  db.prepare(`
    UPDATE refresh_tokens
    SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `).run(row.id);

  // Fetch user
  const user = db.prepare(`
    SELECT id, email, username, display_name, bio, timezone, created_at
    FROM users WHERE id = ?
  `).get(row.user_id);

  if (!user) {
    return sendError(res, 'UNAUTHORIZED', 'Pengguna tidak ditemukan.', null, 401);
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const { rawToken: newRawToken, tokenHash: newTokenHash, expiresAt } = generateRefreshToken();

  db.prepare(`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).run(user.id, newTokenHash, expiresAt);

  res.cookie('refreshToken', newRawToken, COOKIE_OPTIONS);

  return sendSuccess(res, { access_token: newAccessToken });
}

export function logout(req, res) {
  const rawToken = req.cookies.refreshToken || (req.body && req.body.refresh_token);

  if (rawToken) {
    const tokenHash = hashRefreshToken(rawToken);
    db.prepare(`
      UPDATE refresh_tokens
      SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE token_hash = ?
    `).run(tokenHash);
  }

  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  return res.status(204).send();
}

export function getMe(req, res) {
  return sendSuccess(res, { user: req.user });
}

export function updateMe(req, res) {
  const { display_name, bio, timezone } = req.body;
  const updates = [];
  const params = [];

  if (display_name !== undefined) {
    updates.push('display_name = ?');
    params.push(display_name);
  }
  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }
  if (timezone !== undefined) {
    updates.push('timezone = ?');
    params.push(timezone);
  }

  if (updates.length > 0) {
    updates.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
    params.push(req.user.id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);
  }

  const updatedUser = db.prepare(`
    SELECT id, email, username, display_name, bio, timezone, created_at
    FROM users WHERE id = ?
  `).get(req.user.id);

  return sendSuccess(res, { user: updatedUser });
}
