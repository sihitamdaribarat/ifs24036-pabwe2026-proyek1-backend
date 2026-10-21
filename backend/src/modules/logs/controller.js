import db from '../../db/connection.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { getUserToday, isLogDateAllowed } from '../../utils/dates.js';
import { calculateHabitStreak } from './streak.js';

export function createLog(req, res) {
  const habitId = parseInt(req.params.habitId, 10);
  if (isNaN(habitId)) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  // Ensure habit belongs to user and not archived
  const habit = db.prepare(`
    SELECT id FROM habits WHERE id = ? AND user_id = ?
  `).get(habitId, req.user.id);

  if (!habit) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  const today = getUserToday(req.user.timezone);
  const logDate = req.body.log_date || today;
  const note = req.body.note || null;

  // Validate allowed window: only today and yesterday H-1 (PRD US-LOG-01)
  if (!isLogDateAllowed(logDate, req.user.timezone)) {
    return sendError(
      res,
      'VALIDATION_ERROR',
      'Pencatatan hanya diizinkan untuk hari ini atau kemarin (H-1).',
      [{ field: 'log_date', message: 'Tanggal di luar jendela yang diizinkan (hari ini dan kemarin)' }],
      422
    );
  }

  // Check unique log per date
  const existing = db.prepare(`
    SELECT id FROM habit_logs WHERE habit_id = ? AND log_date = ?
  `).get(habitId, logDate);

  if (existing) {
    return sendError(
      res,
      'ALREADY_LOGGED',
      'Kebiasaan ini sudah dicatat untuk tanggal tersebut.',
      null,
      409
    );
  }

  const insertStmt = db.prepare(`
    INSERT INTO habit_logs (habit_id, user_id, log_date, note)
    VALUES (?, ?, ?, ?)
  `);
  const info = insertStmt.run(habitId, req.user.id, logDate, note);
  const logId = Number(info.lastInsertRowid);

  const log = db.prepare(`
    SELECT id, habit_id, log_date, note, created_at
    FROM habit_logs WHERE id = ?
  `).get(logId);

  const streak = calculateHabitStreak(habitId, today);

  return sendSuccess(res, { log, streak }, undefined, 201);
}

export function deleteLog(req, res) {
  const habitId = parseInt(req.params.habitId, 10);
  const logDate = req.params.logDate;

  if (isNaN(habitId)) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  // Validate date format and allowed window
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(logDate) || !isLogDateAllowed(logDate, req.user.timezone)) {
    return sendError(
      res,
      'VALIDATION_ERROR',
      'Pembatalan check-in hanya diizinkan untuk hari ini atau kemarin (H-1).',
      null,
      422
    );
  }

  // Ensure habit belongs to user
  const habit = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(habitId, req.user.id);
  if (!habit) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  const result = db.prepare(`
    DELETE FROM habit_logs
    WHERE habit_id = ? AND log_date = ? AND user_id = ?
  `).run(habitId, logDate, req.user.id);

  if (result.changes === 0) {
    return sendError(res, 'NOT_FOUND', 'Catatan tidak ditemukan untuk tanggal tersebut.', null, 404);
  }

  const today = getUserToday(req.user.timezone);
  const streak = calculateHabitStreak(habitId, today);

  return sendSuccess(res, { streak });
}

export function getLogs(req, res) {
  const habitId = parseInt(req.params.habitId, 10);
  if (isNaN(habitId)) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  const habit = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(habitId, req.user.id);
  if (!habit) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  let { from, to } = req.query;
  const today = getUserToday(req.user.timezone);

  if (!to) to = today;
  if (!from) {
    // Default 30 days prior
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    from = d.toISOString().slice(0, 10);
  }

  const rows = db.prepare(`
    SELECT id, habit_id, log_date, note, created_at
    FROM habit_logs
    WHERE habit_id = ? AND log_date BETWEEN ? AND ?
    ORDER BY log_date DESC
  `).all(habitId, from, to);

  return sendSuccess(res, { logs: rows });
}

export function getHabitStreakInfo(req, res) {
  const habitId = parseInt(req.params.habitId, 10);
  if (isNaN(habitId)) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  const habit = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(habitId, req.user.id);
  if (!habit) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  const today = getUserToday(req.user.timezone);
  const streak = calculateHabitStreak(habitId, today);

  return sendSuccess(res, streak);
}
