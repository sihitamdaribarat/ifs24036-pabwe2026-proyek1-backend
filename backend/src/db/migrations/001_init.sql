-- =====================================================
-- LangkahKecil — SQLite Schema v1.0
-- PRD Section 4.4 DDL
-- =====================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL COLLATE NOCASE UNIQUE,
  username      TEXT    NOT NULL COLLATE NOCASE UNIQUE
                CHECK (length(username) BETWEEN 3 AND 20),
  display_name  TEXT    NOT NULL CHECK (length(display_name) BETWEEN 1 AND 50),
  password_hash TEXT    NOT NULL,
  bio           TEXT    CHECK (bio IS NULL OR length(bio) <= 160),
  timezone      TEXT    NOT NULL DEFAULT 'Asia/Jakarta',
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 2. REFRESH_TOKENS (disimpan dalam bentuk hash SHA-256)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT    NOT NULL UNIQUE,
  expires_at  TEXT    NOT NULL,
  revoked_at  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- 3. HABITS
CREATE TABLE IF NOT EXISTS habits (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL CHECK (length(title) BETWEEN 1 AND 80),
  anchor_cue   TEXT    CHECK (anchor_cue IS NULL OR length(anchor_cue) <= 120),
  description  TEXT    CHECK (description IS NULL OR length(description) <= 200),
  emoji        TEXT    NOT NULL DEFAULT '🌱',
  color        TEXT    NOT NULL DEFAULT '#10B981'
               CHECK (color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  archived_at  TEXT,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id, archived_at);

-- 4. HABIT_LOGS (satu log per kebiasaan per tanggal)
CREATE TABLE IF NOT EXISTS habit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id    INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  log_date    TEXT    NOT NULL
              CHECK (log_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  note        TEXT    CHECK (note IS NULL OR length(note) <= 200),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (habit_id, log_date)
);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, log_date);

-- 5. POSTS (Daily Wins & Refleksi)
CREATE TABLE IF NOT EXISTS posts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  habit_id        INTEGER REFERENCES habits(id) ON DELETE SET NULL,
  post_type       TEXT    NOT NULL DEFAULT 'daily_win'
                  CHECK (post_type IN ('daily_win','reflection')),
  body            TEXT    NOT NULL CHECK (length(body) BETWEEN 1 AND 500),
  streak_snapshot INTEGER CHECK (streak_snapshot IS NULL OR streak_snapshot >= 0),
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_posts_feed ON posts(deleted_at, id DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id, id DESC);

-- 6. COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT    NOT NULL CHECK (length(body) BETWEEN 1 AND 300),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, id);

-- 7. REACTIONS (maksimal satu reaksi per pengguna per postingan)
CREATE TABLE IF NOT EXISTS reactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT    NOT NULL CHECK (type IN ('cheer','clap','fire')),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
