import { sendError } from '../utils/response.js';

export function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // If already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'BAD_REQUEST', 'Format JSON tidak valid.', null, 400);
  }

  // Handle generic error
  return sendError(res, 'INTERNAL_ERROR', 'Terjadi kesalahan pada server.', null, 500);
}
