import { sendError } from '../utils/response.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return sendError(res, 'VALIDATION_ERROR', 'Data yang dikirim tidak valid.', details, 422);
      }
      return sendError(res, 'VALIDATION_ERROR', 'Data yang dikirim tidak valid.', null, 422);
    }
  };
}
