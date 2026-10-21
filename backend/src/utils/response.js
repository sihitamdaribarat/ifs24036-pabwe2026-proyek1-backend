export function sendSuccess(res, data = {}, meta = undefined, statusCode = 200) {
  const payload = { success: true, data };
  if (meta !== undefined) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

export function sendError(res, code, message, details = null, statusCode = 400) {
  const errorObj = { code, message };
  if (details) {
    errorObj.details = details;
  }
  return res.status(statusCode).json({
    success: false,
    error: errorObj,
  });
}
