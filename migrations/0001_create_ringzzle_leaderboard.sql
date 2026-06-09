CREATE TABLE IF NOT EXISTS ringzzle_scores (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  day_key TEXT NOT NULL,
  nickname TEXT NOT NULL,
  nickname_normalized TEXT NOT NULL,
  browser_player_id TEXT,
  score INTEGER NOT NULL,
  best_clear INTEGER NOT NULL DEFAULT 0,
  line_clears INTEGER NOT NULL DEFAULT 0,
  color_bursts INTEGER NOT NULL DEFAULT 0,
  max_unlocked_colors INTEGER NOT NULL DEFAULT 3,
  games_played INTEGER,
  client_version TEXT NOT NULL,
  board_version TEXT NOT NULL DEFAULT 'ringzzle-classic-v1',
  rejected INTEGER NOT NULL DEFAULT 0,
  reject_reason TEXT,
  moderation_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_ringzzle_scores_day_rejected_score
  ON ringzzle_scores (day_key, rejected, score DESC, best_clear DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ringzzle_scores_nickname_normalized
  ON ringzzle_scores (nickname_normalized, score DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ringzzle_scores_browser_player
  ON ringzzle_scores (browser_player_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ringzzle_scores_rejected
  ON ringzzle_scores (rejected, created_at DESC);
