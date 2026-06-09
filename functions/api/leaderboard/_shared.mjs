const MAX_RETURNED_ENTRIES = 100;

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
