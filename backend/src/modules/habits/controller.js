import db from '../../db/connection.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { getUserToday } from '../../utils/dates.js';
import { calculateHabitStreak, isHabitCompletedToday } from '../logs/streak.js';

export function getHabits(req, res) {
  const status = req.query.status === 'archived' ? 'archived' : 'active';
  const today = getUserToday(req.user.timezone);

  let query = `
    SELECT id, user_id, title, anchor_cue, description, emoji, color, archived_at, created_at, updated_at
    FROM habits
    WHERE user_id = ?
  `;

  if (status === 'archived') {
    query += ' AND archived_at IS NOT NULL ORDER BY archived_at DESC';
  } else {
    query += ' AND archived_at IS NULL ORDER BY created_at ASC';
  }

  const rows = db.prepare(query).all(req.user.id);

  const habits = rows.map((h) => {
    const streak = calculateHabitStreak(h.id, today);
    const completed_today = isHabitCompletedToday(h.id, today);
    return {
      ...h,
      streak,
      completed_today,
    };
  });

  return sendSuccess(res, { habits });
}

export function createHabit(req, res) {
  const { title, anchor_cue = null, description = null, emoji = '🌱', color = '#10B981' } = req.body;

  // Check 10 active habits limit (PRD US-HAB-01)
  const countRow = db.prepare(`
    SELECT COUNT(*) as count FROM habits WHERE user_id = ? AND archived_at IS NULL
  `).get(req.user.id);

  if (countRow && countRow.count >= 10) {
    return sendError(
      res,
      'HABIT_LIMIT_REACHED',
      'Maksimal 10 kebiasaan aktif tercapai. Arsipkan salah satu sebelum membuat yang baru.',
      null,
      422
    );
  }

  const insertStmt = db.prepare(`
    INSERT INTO habits (user_id, title, anchor_cue, description, emoji, color)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = insertStmt.run(req.user.id, title, anchor_cue, description, emoji, color);
  const habitId = Number(info.lastInsertRowid);

  const habit = db.prepare(`
    SELECT id, user_id, title, anchor_cue, description, emoji, color, archived_at, created_at, updated_at
    FROM habits WHERE id = ?
  `).get(habitId);

  return sendSuccess(
    res,
    {
      habit: {
        ...habit,
        streak: { current_streak: 0, longest_streak: 0 },
        completed_today: false,
      },
    },
    undefined,
    201
  );
}

export function getHabitById(req, res) {
  const habitId = parseInt(req.params.habitId, 10);
  if (isNaN(habitId)) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  const habit = db.prepare(`
    SELECT id, user_id, title, anchor_cue, description, emoji, color, archived_at, created_at, updated_at
    FROM habits WHERE id = ? AND user_id = ?
  `).get(habitId, req.user.id);

  if (!habit) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  const today = getUserToday(req.user.timezone);
  const streak = calculateHabitStreak(habit.id, today);
  const completed_today = isHabitCompletedToday(habit.id, today);

  return sendSuccess(res, {
    habit: {
      ...habit,
      streak,
      completed_today,
    },
  });
}

export function updateHabit(req, res) {
  const habitId = parseInt(req.params.habitId, 10);
  if (isNaN(habitId)) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  const habit = db.prepare(`
    SELECT id FROM habits WHERE id = ? AND user_id = ?
  `).get(habitId, req.user.id);

  if (!habit) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  const { title, anchor_cue, description, emoji, color } = req.body;
  const updates = [];
  const params = [];

  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  if (anchor_cue !== undefined) {
    updates.push('anchor_cue = ?');
    params.push(anchor_cue);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (emoji !== undefined) {
    updates.push('emoji = ?');
    params.push(emoji);
  }
  if (color !== undefined) {
    updates.push('color = ?');
    params.push(color);
  }

  if (updates.length > 0) {
    updates.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
    params.push(habitId, req.user.id);

    const query = `UPDATE habits SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    db.prepare(query).run(...params);
  }

  const updatedHabit = db.prepare(`
    SELECT id, user_id, title, anchor_cue, description, emoji, color, archived_at, created_at, updated_at
    FROM habits WHERE id = ?
  `).get(habitId);

  const today = getUserToday(req.user.timezone);
  const streak = calculateHabitStreak(habitId, today);
  const completed_today = isHabitCompletedToday(habitId, today);

  return sendSuccess(res, {
    habit: {
      ...updatedHabit,
      streak,
      completed_today,
    },
  });
}

export function archiveHabit(req, res) {
  const habitId = parseInt(req.params.habitId, 10);
  if (isNaN(habitId)) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  const result = db.prepare(`
    UPDATE habits
    SET archived_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ? AND user_id = ? AND archived_at IS NULL
  `).run(habitId, req.user.id);

  if (result.changes === 0) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan atau sudah diarsipkan.', null, 404);
  }

  return res.status(204).send();
}

export function restoreHabit(req, res) {
  const habitId = parseInt(req.params.habitId, 10);
  if (isNaN(habitId)) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  const habit = db.prepare(`
    SELECT id FROM habits WHERE id = ? AND user_id = ?
  `).get(habitId, req.user.id);

  if (!habit) {
    return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan.', null, 404);
  }

  // Check limit before restore
  const countRow = db.prepare(`
    SELECT COUNT(*) as count FROM habits WHERE user_id = ? AND archived_at IS NULL
  `).get(req.user.id);

  if (countRow && countRow.count >= 10) {
    return sendError(
      res,
      'HABIT_LIMIT_REACHED',
      'Maksimal 10 kebiasaan aktif tercapai. Arsipkan salah satu sebelum memulihkan kebiasaan ini.',
      null,
      422
    );
  }

  db.prepare(`
    UPDATE habits
    SET archived_at = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ? AND user_id = ?
  `).run(habitId, req.user.id);

  const restoredHabit = db.prepare(`
    SELECT id, user_id, title, anchor_cue, description, emoji, color, archived_at, created_at, updated_at
    FROM habits WHERE id = ?
  `).get(habitId);

  const today = getUserToday(req.user.timezone);
  const streak = calculateHabitStreak(habitId, today);
  const completed_today = isHabitCompletedToday(habitId, today);

  return sendSuccess(res, {
    habit: {
      ...restoredHabit,
      streak,
      completed_today,
    },
  });
}

export function getTodayDashboard(req, res) {
  const today = getUserToday(req.user.timezone);

  const rows = db.prepare(`
    SELECT id, user_id, title, anchor_cue, description, emoji, color, archived_at, created_at, updated_at
    FROM habits
    WHERE user_id = ? AND archived_at IS NULL
    ORDER BY created_at ASC
  `).all(req.user.id);

  let completedCount = 0;
  const habits = rows.map((h) => {
    const streak = calculateHabitStreak(h.id, today);
    const completed_today = isHabitCompletedToday(h.id, today);
    if (completed_today) completedCount++;
    return {
      ...h,
      streak,
      completed_today,
    };
  });

  const total = habits.length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return sendSuccess(res, {
    date: today,
    progress: {
      total,
      completed: completedCount,
      percentage,
    },
    habits,
  });
}
