import { sendError } from '../utils/response.js';

// Simple and efficient memory-based sliding window rate limiter
export function createRateLimiter({ windowMs, maxRequests, keyGenerator, message }) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator ? keyGenerator(req) : (req.ip || req.connection.remoteAddress || 'anonymous');
    
    // Clean up expired entries periodically
    if (Math.random() < 0.05) {
      for (const [k, timestamps] of hits.entries()) {
        const valid = timestamps.filter(t => now - t < windowMs);
        if (valid.length === 0) hits.delete(k);
        else hits.set(k, valid);
      }
    }

    const currentTimestamps = (hits.get(key) || []).filter(t => now - t < windowMs);

    if (currentTimestamps.length >= maxRequests) {
      return sendError(
        res,
        'RATE_LIMITED',
        message || 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.',
        null,
        429
      );
    }

    currentTimestamps.push(now);
    hits.set(key, currentTimestamps);
    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyGenerator: (req) => `${req.ip}_auth`,
  message: 'Terlalu banyak percobaan autentikasi. Silakan coba lagi setelah 15 menit.'
});

export const postRateLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 10,
  keyGenerator: (req) => `${req.user ? req.user.id : req.ip}_post`,
  message: 'Batas harian posting telah tercapai (maksimal 10 postingan per 24 jam).'
});

export const commentRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 30,
  keyGenerator: (req) => `${req.user ? req.user.id : req.ip}_comment`,
  message: 'Batas komentar telah tercapai (maksimal 30 komentar per jam).'
});
