import db from '../../db/connection.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { getUserToday } from '../../utils/dates.js';
import { calculateHabitStreak } from '../logs/streak.js';

export function getPosts(req, res) {
  let limit = parseInt(req.query.limit || '20', 10);
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > 50) limit = 50;

  const cursor = req.query.cursor ? parseInt(req.query.cursor, 10) : null;
  const username = req.query.username ? req.query.username.trim() : null;
  const postType = req.query.post_type ? req.query.post_type.trim() : null;

  let query = `
    SELECT
      p.id,
      p.user_id,
      p.habit_id,
      p.post_type,
      p.body,
      p.streak_snapshot,
      p.created_at,
      p.updated_at,
      u.username,
      u.display_name,
      h.title AS habit_title,
      h.emoji AS habit_emoji,
      (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id) AS reaction_count,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count,
      (SELECT type FROM reactions mr WHERE mr.post_id = p.id AND mr.user_id = ?) AS my_reaction
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN habits h ON h.id = p.habit_id
    WHERE p.deleted_at IS NULL
  `;

  const params = [req.user.id];

  if (cursor && !isNaN(cursor)) {
    query += ' AND p.id < ?';
    params.push(cursor);
  }

  if (username) {
    query += ' AND u.username = ?';
    params.push(username);
  }

  if (postType && ['daily_win', 'reflection'].includes(postType)) {
    query += ' AND p.post_type = ?';
    params.push(postType);
  }

  // Fetch limit + 1 to check if there is a next page
  query += ' ORDER BY p.id DESC LIMIT ?';
  params.push(limit + 1);

  const rows = db.prepare(query).all(...params);

  const hasMore = rows.length > limit;
  const slicedRows = hasMore ? rows.slice(0, limit) : rows;

  const nextCursor = slicedRows.length > 0 ? String(slicedRows[slicedRows.length - 1].id) : null;

  const posts = slicedRows.map((r) => ({
    id: r.id,
    body: r.body,
    post_type: r.post_type,
    streak_snapshot: r.streak_snapshot,
    habit: r.habit_id
      ? {
          id: r.habit_id,
          title: r.habit_title,
          emoji: r.habit_emoji,
        }
      : null,
    author: {
      id: r.user_id,
      username: r.username,
      display_name: r.display_name,
    },
    reaction_count: Number(r.reaction_count || 0),
    comment_count: Number(r.comment_count || 0),
    my_reaction: r.my_reaction || null,
    is_edited: r.updated_at !== r.created_at,
    created_at: r.created_at,
  }));

  return sendSuccess(res, { posts }, { limit, next_cursor: nextCursor, has_more: hasMore });
}

export function createPost(req, res) {
  const { body, post_type = 'daily_win', habit_id = null } = req.body;

  let streakSnapshot = null;

  if (habit_id) {
    const habit = db.prepare(`
      SELECT id FROM habits WHERE id = ? AND user_id = ?
    `).get(habit_id, req.user.id);

    if (!habit) {
      return sendError(res, 'NOT_FOUND', 'Kebiasaan tidak ditemukan atau bukan milik Anda.', null, 404);
    }

    const today = getUserToday(req.user.timezone);
    const streak = calculateHabitStreak(habit_id, today);
    streakSnapshot = streak.current_streak;
  }

  const insertStmt = db.prepare(`
    INSERT INTO posts (user_id, habit_id, post_type, body, streak_snapshot)
    VALUES (?, ?, ?, ?, ?)
  `);

  const info = insertStmt.run(req.user.id, habit_id, post_type, body, streakSnapshot);
  const postId = Number(info.lastInsertRowid);

  // Fetch created post
  const r = db.prepare(`
    SELECT
      p.id,
      p.user_id,
      p.habit_id,
      p.post_type,
      p.body,
      p.streak_snapshot,
      p.created_at,
      p.updated_at,
      u.username,
      u.display_name,
      h.title AS habit_title,
      h.emoji AS habit_emoji
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN habits h ON h.id = p.habit_id
    WHERE p.id = ?
  `).get(postId);

  const post = {
    id: r.id,
    body: r.body,
    post_type: r.post_type,
    streak_snapshot: r.streak_snapshot,
    habit: r.habit_id
      ? {
          id: r.habit_id,
          title: r.habit_title,
          emoji: r.habit_emoji,
        }
      : null,
    author: {
      id: r.user_id,
      username: r.username,
      display_name: r.display_name,
    },
    reaction_count: 0,
    comment_count: 0,
    my_reaction: null,
    is_edited: false,
    created_at: r.created_at,
  };

  return sendSuccess(res, { post }, undefined, 201);
}

export function getPostById(req, res) {
  const postId = parseInt(req.params.postId, 10);
  if (isNaN(postId)) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  const r = db.prepare(`
    SELECT
      p.id,
      p.user_id,
      p.habit_id,
      p.post_type,
      p.body,
      p.streak_snapshot,
      p.created_at,
      p.updated_at,
      u.username,
      u.display_name,
      h.title AS habit_title,
      h.emoji AS habit_emoji,
      (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id) AS reaction_count,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count,
      (SELECT type FROM reactions mr WHERE mr.post_id = p.id AND mr.user_id = ?) AS my_reaction
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN habits h ON h.id = p.habit_id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `).get(req.user.id, postId);

  if (!r) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  const post = {
    id: r.id,
    body: r.body,
    post_type: r.post_type,
    streak_snapshot: r.streak_snapshot,
    habit: r.habit_id
      ? {
          id: r.habit_id,
          title: r.habit_title,
          emoji: r.habit_emoji,
        }
      : null,
    author: {
      id: r.user_id,
      username: r.username,
      display_name: r.display_name,
    },
    reaction_count: Number(r.reaction_count || 0),
    comment_count: Number(r.comment_count || 0),
    my_reaction: r.my_reaction || null,
    is_edited: r.updated_at !== r.created_at,
    created_at: r.created_at,
  };

  return sendSuccess(res, { post });
}

export function updatePost(req, res) {
  const postId = parseInt(req.params.postId, 10);
  if (isNaN(postId)) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ? AND deleted_at IS NULL').get(postId);
  if (!post) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  if (post.user_id !== req.user.id) {
    return sendError(res, 'FORBIDDEN', 'Hanya penulis yang dapat mengubah postingan ini.', null, 403);
  }

  const { body } = req.body;

  db.prepare(`
    UPDATE posts
    SET body = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `).run(body, postId);

  return getPostById(req, res);
}

export function deletePost(req, res) {
  const postId = parseInt(req.params.postId, 10);
  if (isNaN(postId)) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ? AND deleted_at IS NULL').get(postId);
  if (!post) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  if (post.user_id !== req.user.id) {
    return sendError(res, 'FORBIDDEN', 'Hanya penulis yang dapat menghapus postingan ini.', null, 403);
  }

  db.prepare(`
    UPDATE posts
    SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `).run(postId);

  return res.status(204).send();
}

export function getComments(req, res) {
  const postId = parseInt(req.params.postId, 10);
  if (isNaN(postId)) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  const post = db.prepare('SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL').get(postId);
  if (!post) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  let limit = parseInt(req.query.limit || '20', 10);
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > 50) limit = 50;

  const cursor = req.query.cursor ? parseInt(req.query.cursor, 10) : null;

  let query = `
    SELECT
      c.id,
      c.post_id,
      c.user_id,
      c.body,
      c.created_at,
      u.username,
      u.display_name
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ? AND c.deleted_at IS NULL
  `;
  const params = [postId];

  if (cursor && !isNaN(cursor)) {
    query += ' AND c.id > ?';
    params.push(cursor);
  }

  query += ' ORDER BY c.id ASC LIMIT ?';
  params.push(limit + 1);

  const rows = db.prepare(query).all(...params);

  const hasMore = rows.length > limit;
  const slicedRows = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = slicedRows.length > 0 ? String(slicedRows[slicedRows.length - 1].id) : null;

  const comments = slicedRows.map((c) => ({
    id: c.id,
    post_id: c.post_id,
    body: c.body,
    author: {
      id: c.user_id,
      username: c.username,
      display_name: c.display_name,
    },
    created_at: c.created_at,
  }));

  return sendSuccess(res, { comments }, { limit, next_cursor: nextCursor, has_more: hasMore });
}

export function createComment(req, res) {
  const postId = parseInt(req.params.postId, 10);
  if (isNaN(postId)) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  const post = db.prepare('SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL').get(postId);
  if (!post) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  const { body } = req.body;

  const insertStmt = db.prepare(`
    INSERT INTO comments (post_id, user_id, body)
    VALUES (?, ?, ?)
  `);
  const info = insertStmt.run(postId, req.user.id, body);
  const commentId = Number(info.lastInsertRowid);

  const comment = {
    id: commentId,
    post_id: postId,
    body,
    author: {
      id: req.user.id,
      username: req.user.username,
      display_name: req.user.display_name,
    },
    created_at: new Date().toISOString(),
  };

  return sendSuccess(res, { comment }, undefined, 201);
}

export function deleteComment(req, res) {
  const commentId = parseInt(req.params.commentId, 10);
  if (isNaN(commentId)) {
    return sendError(res, 'NOT_FOUND', 'Komentar tidak ditemukan.', null, 404);
  }

  const comment = db.prepare(`
    SELECT c.id, c.user_id, c.post_id, p.user_id AS post_owner_id
    FROM comments c
    JOIN posts p ON p.id = c.post_id
    WHERE c.id = ? AND c.deleted_at IS NULL
  `).get(commentId);

  if (!comment) {
    return sendError(res, 'NOT_FOUND', 'Komentar tidak ditemukan.', null, 404);
  }

  // PRD US-INT-02: Penulis komentar atau pemilik postingan dapat menghapus komentar
  if (comment.user_id !== req.user.id && comment.post_owner_id !== req.user.id) {
    return sendError(res, 'FORBIDDEN', 'Anda tidak memiliki hak untuk menghapus komentar ini.', null, 403);
  }

  db.prepare(`
    UPDATE comments
    SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `).run(commentId);

  return res.status(204).send();
}

export function setReaction(req, res) {
  const postId = parseInt(req.params.postId, 10);
  if (isNaN(postId)) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  const post = db.prepare('SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL').get(postId);
  if (!post) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  const { type } = req.body;

  // Upsert reaction (PRD 5.6 & 4.4)
  db.prepare(`
    INSERT INTO reactions (post_id, user_id, type)
    VALUES (?, ?, ?)
    ON CONFLICT(post_id, user_id) DO UPDATE SET type = excluded.type
  `).run(postId, req.user.id, type);

  const countRow = db.prepare('SELECT COUNT(*) as count FROM reactions WHERE post_id = ?').get(postId);
  const reactionCount = countRow ? Number(countRow.count) : 0;

  return sendSuccess(res, {
    my_reaction: type,
    reaction_count: reactionCount,
  });
}

export function deleteReaction(req, res) {
  const postId = parseInt(req.params.postId, 10);
  if (isNaN(postId)) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  const post = db.prepare('SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL').get(postId);
  if (!post) {
    return sendError(res, 'NOT_FOUND', 'Postingan tidak ditemukan.', null, 404);
  }

  db.prepare('DELETE FROM reactions WHERE post_id = ? AND user_id = ?').run(postId, req.user.id);

  const countRow = db.prepare('SELECT COUNT(*) as count FROM reactions WHERE post_id = ?').get(postId);
  const reactionCount = countRow ? Number(countRow.count) : 0;

  return sendSuccess(res, {
    my_reaction: null,
    reaction_count: reactionCount,
  });
}

export function getPublicProfile(req, res) {
  const username = req.params.username;

  const user = db.prepare(`
    SELECT id, username, display_name, bio, timezone, created_at
    FROM users
    WHERE username = ?
  `).get(username);

  if (!user) {
    return sendError(res, 'NOT_FOUND', 'Pengguna tidak ditemukan.', null, 404);
  }

  // Active habits of this user
  const habits = db.prepare(`
    SELECT id, title, anchor_cue, emoji, color, created_at
    FROM habits
    WHERE user_id = ? AND archived_at IS NULL
    ORDER BY created_at ASC
  `).all(user.id);

  const today = getUserToday(user.timezone);
  const habitsWithStats = habits.map(h => {
    const streak = calculateHabitStreak(h.id, today);
    return {
      ...h,
      streak,
    };
  });

  return sendSuccess(res, {
    user,
    habits: habitsWithStats,
  });
}
