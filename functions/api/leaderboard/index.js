import {
  dedupeLeaderboardRowsByNickname,
  getDayKey,
  json,
  normalizeScope,
  publicEntry,
  unavailableJson,
} from "./_shared.mjs";

export async function onRequestGet({ request, env }) {
  if (!env || !env.DB) return unavailableJson();

  const url = new URL(request.url);
  const scope = normalizeScope(url.searchParams.get("scope"));
  const dayKey = getDayKey();
  const generatedAt = new Date().toISOString();

  try {
    const scopedWhere = scope === "today" ? "AND day_key = ?" : "";
    const query = `
      SELECT id, nickname, nickname_normalized, score, best_clear, line_clears,
             color_bursts, max_unlocked_colors, created_at
      FROM ringzzle_scores
      WHERE rejected = 0
        ${scopedWhere}
      ORDER BY score DESC, best_clear DESC, line_clears DESC, color_bursts DESC,
               max_unlocked_colors DESC, created_at ASC
      LIMIT 500
    `;
    const result = scope === "today"
      ? await env.DB.prepare(query).bind(dayKey).all()
      : await env.DB.prepare(query).all();
    const rows = Array.isArray(result && result.results) ? result.results : [];
    const entries = dedupeLeaderboardRowsByNickname(rows).map(publicEntry);

    return json({
      ok: true,
      scope,
      entries,
      generatedAt,
    });
  } catch (error) {
    return json({
      ok: false,
      scope,
      error: "leaderboard_query_failed",
      message: "Leaderboard is temporarily unavailable.",
      generatedAt,
    }, 503);
  }
}
