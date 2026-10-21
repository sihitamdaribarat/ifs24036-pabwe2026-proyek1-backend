import { z } from 'zod';

const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export const createLogSchema = z.object({
  log_date: z
    .string()
    .trim()
    .regex(DATE_REGEX, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  note: z
    .string()
    .trim()
    .max(200, 'Catatan maksimal 200 karakter')
    .nullable()
    .optional(),
});
