const MAX_RETURNED_ENTRIES = 100;
const MAX_SCORE = 1000000;
const MAX_BEST_CLEAR = 16;
const MAX_LINE_CLEARS = 10000;
const MAX_COLOR_BURSTS = 10000;
const MIN_UNLOCKED_COLORS = 3;
const MAX_UNLOCKED_COLORS = 6;
const MAX_GAMES_PLAYED = 1000000;
const MAX_CLIENT_VERSION_LENGTH = 20;
const MAX_BROWSER_PLAYER_ID_LENGTH = 80;
const BLOCKED_NICKNAMES = new Set(["admin", "moderator", "support", "staff", "owner", "badword"]);

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function unavailableJson() {
  return json({
    ok: false,
    error: "leaderboard_unavailable",
    message: "Leaderboard is not available yet.",
    generatedAt: new Date().toISOString(),
  }, 503);
}

export function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function normalizeScope(value) {
  return value === "alltime" ? "alltime" : "today";
}

export function normalizeLeaderboardNicknameKey(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function toInteger(value) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return Number.parseInt(value, 10);
  }
  return null;
}

function valueFromBody(body, camelKey, snakeKey, fallback) {
  if (Object.prototype.hasOwnProperty.call(body, camelKey)) return body[camelKey];
  if (snakeKey && Object.prototype.hasOwnProperty.call(body, snakeKey)) return body[snakeKey];
  return fallback;
}

function validateIntegerRange(body, camelKey, snakeKey, fallback, min, max, message) {
  const value = valueFromBody(body, camelKey, snakeKey, fallback);
  const parsed = toInteger(value);
  if (parsed === null || parsed < min || parsed > max) {
    return { ok: false, error: message };
  }
  return { ok: true, value: parsed };
}

export function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `score_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function validateNickname(value) {
  const nickname = String(value || "").trim().replace(/\s+/g, " ");
  if (nickname.length < 2 || nickname.length > 16) {
    return { ok: false, error: "Nickname must be 2-16 characters." };
  }
  if (!/^[A-Za-z0-9 _-]+$/.test(nickname)) {
    return { ok: false, error: "Nickname can use letters, numbers, spaces, underscore, and hyphen." };
  }
  if (BLOCKED_NICKNAMES.has(nickname.toLowerCase())) {
    return { ok: false, error: "Please choose another nickname." };
  }
  return { ok: true, nickname, nickname_normalized: normalizeLeaderboardNicknameKey(nickname) };
}

export function validateSubmission(input) {
  const body = input || {};
  const nicknameResult = validateNickname(body.nickname);
  if (!nicknameResult.ok) return nicknameResult;

  const scoreResult = validateIntegerRange(body, "score", null, null, 0, MAX_SCORE, "Score is outside the leaderboard range.");
  if (!scoreResult.ok) return scoreResult;

  const bestClearResult = validateIntegerRange(body, "bestClear", "best_clear", 0, 0, MAX_BEST_CLEAR, "Best clear is outside the leaderboard range.");
  if (!bestClearResult.ok) return bestClearResult;

  const lineClearsResult = validateIntegerRange(body, "lineClears", "line_clears", 0, 0, MAX_LINE_CLEARS, "Line clear count is outside the leaderboard range.");
  if (!lineClearsResult.ok) return lineClearsResult;

  const colorBurstsResult = validateIntegerRange(body, "colorBursts", "color_bursts", 0, 0, MAX_COLOR_BURSTS, "Color Burst count is outside the leaderboard range.");
  if (!colorBurstsResult.ok) return colorBurstsResult;

  const maxUnlockedColorsResult = validateIntegerRange(
    body,
    "maxUnlockedColors",
    "max_unlocked_colors",
    MIN_UNLOCKED_COLORS,
    MIN_UNLOCKED_COLORS,
    MAX_UNLOCKED_COLORS,
    "Unlocked color count is outside the leaderboard range."
  );
  if (!maxUnlockedColorsResult.ok) return maxUnlockedColorsResult;

  const gamesPlayedValue = valueFromBody(body, "gamesPlayed", "games_played", null);
  let gamesPlayed = null;
  if (gamesPlayedValue !== null && gamesPlayedValue !== undefined && gamesPlayedValue !== "") {
    const gamesPlayedResult = validateIntegerRange(body, "gamesPlayed", "games_played", null, 0, MAX_GAMES_PLAYED, "Games played count is outside the leaderboard range.");
    if (!gamesPlayedResult.ok) return gamesPlayedResult;
    gamesPlayed = gamesPlayedResult.value;
  }

  const browserPlayerId = String(valueFromBody(body, "browserPlayerId", "browser_player_id", "") || "").trim();
  if (!browserPlayerId || browserPlayerId.length > MAX_BROWSER_PLAYER_ID_LENGTH) {
    return { ok: false, error: "Browser player id is outside the leaderboard range." };
  }

  const clientVersion = String(valueFromBody(body, "clientVersion", "client_version", "") || "").trim();
  if (!clientVersion || clientVersion.length > MAX_CLIENT_VERSION_LENGTH) {
    return { ok: false, error: "Client version is outside the leaderboard range." };
  }

  return {
    ok: true,
    entry: {
      nickname: nicknameResult.nickname,
      nickname_normalized: nicknameResult.nickname_normalized,
      score: scoreResult.value,
      best_clear: bestClearResult.value,
      line_clears: lineClearsResult.value,
      color_bursts: colorBurstsResult.value,
      max_unlocked_colors: maxUnlockedColorsResult.value,
      games_played: gamesPlayed,
      browser_player_id: browserPlayerId,
      client_version: clientVersion,
      board_version: "ringzzle-classic-v1",
    },
  };
}

function compareLeaderboardRows(left, right) {
  const scoreDelta = Number(right.score || 0) - Number(left.score || 0);
  if (scoreDelta) return scoreDelta;

  const bestClearDelta = Number(right.best_clear || 0) - Number(left.best_clear || 0);
  if (bestClearDelta) return bestClearDelta;

  const lineClearDelta = Number(right.line_clears || 0) - Number(left.line_clears || 0);
  if (lineClearDelta) return lineClearDelta;

  const burstDelta = Number(right.color_bursts || 0) - Number(left.color_bursts || 0);
  if (burstDelta) return burstDelta;

  const colorDelta = Number(right.max_unlocked_colors || 0) - Number(left.max_unlocked_colors || 0);
  if (colorDelta) return colorDelta;

  const leftCreatedAt = String(left.created_at || "");
  const rightCreatedAt = String(right.created_at || "");
  if (leftCreatedAt !== rightCreatedAt) return leftCreatedAt < rightCreatedAt ? -1 : 1;

  const leftId = String(left.id || "");
  const rightId = String(right.id || "");
  if (leftId !== rightId) return leftId < rightId ? -1 : 1;

  return 0;
}

export function dedupeLeaderboardRowsByNickname(rows, limit = MAX_RETURNED_ENTRIES) {
  const bestByNickname = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const key = normalizeLeaderboardNicknameKey(row && (row.nickname_normalized || row.nickname));
    if (!key) return;
    const current = bestByNickname.get(key);
    if (!current || compareLeaderboardRows(row, current) < 0) {
      bestByNickname.set(key, row);
    }
  });

  return Array.from(bestByNickname.values())
    .sort(compareLeaderboardRows)
    .slice(0, limit);
}

export function publicEntry(row, index) {
  return {
    rank: index + 1,
    nickname: String(row.nickname || "Player").trim() || "Player",
    score: Number(row.score || 0),
    bestClear: Number(row.best_clear || 0),
    lineClears: Number(row.line_clears || 0),
    colorBursts: Number(row.color_bursts || 0),
    maxUnlockedColors: Number(row.max_unlocked_colors || 3),
    createdAt: row.created_at || null,
  };
}
