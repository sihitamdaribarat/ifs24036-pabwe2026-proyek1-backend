import { z } from 'zod';

export const createPostSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Isi postingan wajib diisi')
    .max(500, 'Isi postingan maksimal 500 karakter'),
  post_type: z.enum(['daily_win', 'reflection']).default('daily_win'),
  habit_id: z.number().int().positive().nullable().optional(),
});

export const updatePostSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Isi postingan minimal 1 karakter')
    .max(500, 'Isi postingan maksimal 500 karakter'),
});

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Komentar tidak boleh kosong')
    .max(300, 'Komentar maksimal 300 karakter'),
});

export const reactionSchema = z.object({
  type: z.enum(['cheer', 'clap', 'fire']),
});
