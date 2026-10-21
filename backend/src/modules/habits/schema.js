import { z } from 'zod';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const createHabitSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul kebiasaan wajib diisi')
    .max(80, 'Judul kebiasaan maksimal 80 karakter'),
  anchor_cue: z
    .string()
    .trim()
    .max(120, 'Anchor cue maksimal 120 karakter')
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(200, 'Deskripsi maksimal 200 karakter')
    .nullable()
    .optional(),
  emoji: z.string().trim().max(10).optional().default('🌱'),
  color: z
    .string()
    .trim()
    .regex(HEX_COLOR_REGEX, 'Format warna harus hex #RRGGBB (contoh: #10B981)')
    .optional()
    .default('#10B981'),
});

export const updateHabitSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul kebiasaan minimal 1 karakter')
    .max(80, 'Judul kebiasaan maksimal 80 karakter')
    .optional(),
  anchor_cue: z
    .string()
    .trim()
    .max(120, 'Anchor cue maksimal 120 karakter')
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(200, 'Deskripsi maksimal 200 karakter')
    .nullable()
    .optional(),
  emoji: z.string().trim().max(10).optional(),
  color: z
    .string()
    .trim()
    .regex(HEX_COLOR_REGEX, 'Format warna harus hex #RRGGBB (contoh: #10B981)')
    .optional(),
});
