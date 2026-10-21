import { z } from 'zod';
import { isValidIanaTimezone } from '../../utils/dates.js';

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi')
    .max(254, 'Email maksimal 254 karakter')
    .email('Format email tidak valid')
    .transform((val) => val.toLowerCase()),
  username: z
    .string()
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .max(20, 'Username maksimal 20 karakter')
    .regex(/^[a-z0-9_]+$/, 'Username hanya boleh berisi huruf kecil, angka, dan garis bawah (_)'),
  display_name: z
    .string()
    .trim()
    .min(1, 'Nama tampilan minimal 1 karakter')
    .max(50, 'Nama tampilan maksimal 50 karakter'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(72, 'Password maksimal 72 karakter')
    .refine((val) => /[A-Za-z]/.test(val) && /\d/.test(val), {
      message: 'Password harus mengandung minimal 1 huruf dan 1 angka',
    }),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const updateProfileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, 'Nama tampilan minimal 1 karakter')
    .max(50, 'Nama tampilan maksimal 50 karakter')
    .optional(),
  bio: z
    .string()
    .trim()
    .max(160, 'Bio maksimal 160 karakter')
    .nullable()
    .optional(),
  timezone: z
    .string()
    .trim()
    .refine(isValidIanaTimezone, { message: 'Nama zona waktu IANA tidak valid (mis. Asia/Jakarta)' })
    .optional(),
});
