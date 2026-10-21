import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      display_name: user.display_name,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export function generateRefreshToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + config.refreshTokenDays * 24 * 60 * 60 * 1000).toISOString();
  return { rawToken, tokenHash, expiresAt };
}

export function hashRefreshToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
