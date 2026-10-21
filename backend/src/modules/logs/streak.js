import db from '../../db/connection.js';

export function calculateHabitStreak(habitId, today) {
  const query = `
    WITH numbered AS (
      SELECT log_date,
             CAST(julianday(log_date) - ROW_NUMBER() OVER (ORDER BY log_date) AS INT) AS grp
      FROM habit_logs
      WHERE habit_id = ?
    ),
    islands AS (
      SELECT MIN(log_date) AS start_date,
             MAX(log_date) AS end_date,
             COUNT(*)      AS len
      FROM numbered
      GROUP BY grp
    )
    SELECT
      COALESCE((SELECT len FROM islands
                WHERE end_date >= date(?, '-1 day')
                ORDER BY end_date DESC LIMIT 1), 0) AS current_streak,
      COALESCE((SELECT MAX(len) FROM islands), 0)   AS longest_streak,
      (SELECT MAX(log_date) FROM habit_logs WHERE habit_id = ?) AS last_log_date
  `;

  const stmt = db.prepare(query);
  const result = stmt.get(habitId, today, habitId);

  return {
    current_streak: result ? Number(result.current_streak || 0) : 0,
    longest_streak: result ? Number(result.longest_streak || 0) : 0,
    last_log_date: result ? result.last_log_date : null,
  };
}

export function isHabitCompletedToday(habitId, today) {
  const stmt = db.prepare('SELECT 1 FROM habit_logs WHERE habit_id = ? AND log_date = ? LIMIT 1');
  const row = stmt.get(habitId, today);
  return !!row;
}
